const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { recordFailedAttempt, clearAttempts } = require('../middlewares/rateLimitMiddleware');

// Constants
const RANK = { Federal: 5, Region: 4, Zone: 3, Woreda: 2, Kebele: 1, Farmer: 0 };
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Helper Functions
const helpers = {
    sign: (admin) => {
        const payload = {
            id: admin.id,
            role: admin.role,
            region_name: admin.region_name,
            zone_name: admin.zone_name,
            woreda_name: admin.woreda_name,
            kebele_name: admin.kebele_name
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    },

    lowerRoleOf: (role) => ({
        Federal: 'Region',
        Region: 'Zone',
        Zone: 'Woreda',
        Woreda: 'Kebele',
        Kebele: 'Farmer'
    }[role] || null),
    scopeMatches: (creator, target) => {
        console.log('Creator:', creator.role, creator.region_name, creator.zone_name, creator.woreda_name, creator.kebele_name);
        console.log('Target:', target.region_name, target.zone_name, target.woreda_name, target.kebele_name);

        // For Federal admin, scope always matches
        if (creator.role === 'Federal') return true;

        // For other admins, check their specific scope
        if (creator.role === 'Region' && target.region_name !== creator.region_name) return false;
        if (creator.role === 'Zone' && target.zone_name !== creator.zone_name) return false;
        if (creator.role === 'Woreda' && target.woreda_name !== creator.woreda_name) return false;
        if (creator.role === 'Kebele' && target.kebele_name !== creator.kebele_name) return false;

        return true;
    },
    roleIsLower: (creatorRole, targetRole) => {
        return (RANK[targetRole] || -1) < (RANK[creatorRole] || 0);
    },

    ensureUniquePerScope: async({ role, region_name, zone_name, woreda_name, kebele_name }) => {
        let sql = '';
        let params = [];

        if (role === 'Federal') {
            sql = 'SELECT id FROM admins WHERE role="Federal" LIMIT 1';
        } else if (role === 'Region') {
            sql = 'SELECT id FROM admins WHERE role="Region" AND region_name=? LIMIT 1';
            params = [region_name];
        } else if (role === 'Zone') {
            sql = 'SELECT id FROM admins WHERE role="Zone" AND region_name=? AND zone_name=? LIMIT 1';
            params = [region_name, zone_name];
        } else if (role === 'Woreda') {
            sql = 'SELECT id FROM admins WHERE role="Woreda" AND region_name=? AND zone_name=? AND woreda_name=? LIMIT 1';
            params = [region_name, zone_name, woreda_name];
        } else if (role === 'Kebele') {
            sql = 'SELECT id FROM admins WHERE role="Kebele" AND region_name=? AND zone_name=? AND woreda_name=? AND kebele_name=? LIMIT 1';
            params = [region_name, zone_name, woreda_name, kebele_name];
        }

        if (sql) {
            const [rows] = await db.query(sql, params);
            if (rows.length > 0) throw new Error('Only one admin allowed for this role and scope');
        }
    }
};

// Authentication
const auth = {
    login: async(req, res) => {
        try {
            const { phoneNumber, password } = req.body;
            if (!phoneNumber || !password) {
                return res.status(400).json({ message: 'Phone number and password are required' });
            }

            const [rows] = await db.query('SELECT * FROM admins WHERE phone_number = ? LIMIT 1', [phoneNumber]);
            if (rows.length === 0) {
                const attemptResult = recordFailedAttempt(req);
                return res.status(401).json({
                    message: 'Invalid credentials',
                    attemptsRemaining: attemptResult.attemptsRemaining,
                    blocked: attemptResult.blocked
                });
            }

            const admin = rows[0];
            const match = await bcrypt.compare(password, admin.password_hash || '');
            if (!match) {
                const attemptResult = recordFailedAttempt(req);
                return res.status(401).json({
                    message: 'Invalid credentials',
                    attemptsRemaining: attemptResult.attemptsRemaining,
                    blocked: attemptResult.blocked
                });
            }

            // Clear attempts on successful login
            clearAttempts(req);

            const token = helpers.sign(admin);
            return res.json({
                token,
                user: {
                    id: admin.id,
                    fullName: admin.full_name,
                    phoneNumber: admin.phone_number,
                    role: admin.role,
                    region_name: admin.region_name,
                    zone_name: admin.zone_name,
                    woreda_name: admin.woreda_name,
                    kebele_name: admin.kebele_name
                }
            });
        } catch (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: 'Login error' });
        }
    },

    me: async(req, res) => {
        try {
            const [rows] = await db.query(
                `SELECT id, full_name, phone_number, role, region_name, zone_name, woreda_name, kebele_name 
         FROM admins WHERE id = ? LIMIT 1`, [req.user.id]
            );
            if (rows.length === 0) return res.status(404).json({ message: 'Admin not found' });
            return res.json(rows[0]);
        } catch (err) {
            console.error('Me error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    },

    // NEW: Update federal admin own profile
    updateFederalProfile: async(req, res) => {
        try {
            // Only federal admin can update their own profile
            if (req.user.role !== 'Federal') {
                return res.status(403).json({ message: 'Only Federal admin can update their profile' });
            }

            const { phoneNumber, password } = req.body;
            const adminId = req.user.id;

            // Check if phone number is being updated and if it's unique
            if (phoneNumber) {
                const [existing] = await db.query(
                    'SELECT id FROM admins WHERE phone_number = ? AND id != ?', [phoneNumber, adminId]
                );
                if (existing.length > 0) {
                    return res.status(409).json({ message: 'Phone number already in use' });
                }
            }

            let updateFields = [];
            let updateValues = [];

            if (phoneNumber) {
                updateFields.push('phone_number = ?');
                updateValues.push(phoneNumber);
            }

            if (password) {
                const passwordHash = await bcrypt.hash(password, 10);
                updateFields.push('password_hash = ?');
                updateValues.push(passwordHash);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ message: 'No fields to update' });
            }

            updateValues.push(adminId);

            const sql = `UPDATE admins SET ${updateFields.join(', ')} WHERE id = ?`;
            await db.query(sql, updateValues);

            // Get updated admin data
            const [updated] = await db.query(
                'SELECT id, full_name, phone_number, role, region_name, zone_name, woreda_name, kebele_name FROM admins WHERE id = ?', [adminId]
            );

            return res.json({
                message: 'Profile updated successfully',
                admin: updated[0]
            });
        } catch (err) {
            console.error('Update federal profile error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }
};

// Admin Management
const adminManagement = {
    createLowerAdmin: async(req, res) => {
        const creator = req.user;
        const {
            fullName,
            phoneNumber,
            password,
            role,
            region_name,
            zone_name,
            woreda_name,
            kebele_name,
            // Agricultural fields
            landSizeHectares,
            cropTypes,
            landType,
            cropsSeason,
            farmingExperience,
            irrigationType,
            farmingMethod,
            primaryCrops,
            secondaryCrops,
            soilType,
            hasLivestock,
            livestockTypes,
            annualIncome,
            educationLevel
        } = req.body;

        try {
            // Validation - Allow Kebele to create Farmers
            const expectedRole = helpers.lowerRoleOf(creator.role);
            if (expectedRole !== role) {
                return res.status(403).json({ message: `A ${creator.role} can only create a ${expectedRole} account` });
            }

            // Location validation
            const requiredFields = {
                Region: ['region_name'],
                Zone: ['region_name', 'zone_name'],
                Woreda: ['region_name', 'zone_name', 'woreda_name'],
                Kebele: ['region_name', 'zone_name', 'woreda_name', 'kebele_name'],
                Farmer: ['region_name', 'zone_name', 'woreda_name', 'kebele_name']
            };

            if (requiredFields[role]) {
                const missing = requiredFields[role].filter(field => !req.body[field]);
                if (missing.length) {
                    return res.status(400).json({
                        message: `${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required for ${role}`
                    });
                }
            }

            // Scope validation
            const targetLoc = { region_name, zone_name, woreda_name, kebele_name };
            if (!helpers.scopeMatches(creator, targetLoc)) {
                return res.status(403).json({ message: 'Target location must be within your scope' });
            }

            // Check phone number uniqueness for admins
            const [existsAdmin] = await db.query('SELECT id FROM admins WHERE phone_number = ? LIMIT 1', [phoneNumber]);

            // Create account
            const password_hash = await bcrypt.hash(password, 10);

            if (role === 'Farmer') {
                // Check phone number uniqueness for farmers
                const [existsFarmer] = await db.query('SELECT id FROM farmers WHERE phone_number = ? LIMIT 1', [phoneNumber]);
                if (existsAdmin.length || existsFarmer.length) {
                    return res.status(409).json({ message: 'Phone number already registered' });
                }

                // Insert into farmers table with all agricultural fields
                const [result] = await db.query(
                    `INSERT INTO farmers (
                        full_name, phone_number, password_hash, 
                        region_name, zone_name, woreda_name, kebele_name,
                        land_size_hectares, crop_types, land_type, crops_season, farming_experience,
                        irrigation_type, farming_method, primary_crops, secondary_crops,
                        soil_type, has_livestock, livestock_types, annual_income, education_level,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [
                        fullName, phoneNumber, password_hash,
                        region_name, zone_name, woreda_name, kebele_name,
                        landSizeHectares || null, cropTypes || null, landType || null, cropsSeason || null, farmingExperience || null,
                        irrigationType || null, farmingMethod || null, primaryCrops || null, secondaryCrops || null,
                        soilType || null, hasLivestock || false, livestockTypes || null, annualIncome || null, educationLevel || null
                    ]
                );

                const [saved] = await db.query('SELECT * FROM farmers WHERE id=?', [result.insertId]);
                return res.status(201).json({
                    message: 'Farmer registered successfully',
                    farmer: saved[0]
                });
            } else {
                // Uniqueness check for admin roles (except Farmer)
                await helpers.ensureUniquePerScope({ role, ...targetLoc });

                if (existsAdmin.length) {
                    return res.status(409).json({ message: 'Phone number already registered' });
                }

                // Insert into admins table
                const [result] = await db.query(
                    `INSERT INTO admins (full_name, phone_number, password_hash, role, region_name, zone_name, woreda_name, kebele_name, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [fullName, phoneNumber, password_hash, role, region_name, zone_name, woreda_name, kebele_name]
                );

                const [saved] = await db.query('SELECT * FROM admins WHERE id=?', [result.insertId]);
                return res.status(201).json({
                    message: `${role} Admin registered successfully`,
                    admin: saved[0]
                });
            }

        } catch (err) {
            console.error('Create lower admin error:', err);
            return res.status(500).json({ message: err.message || 'Server error' });
        }
    },

    listInScope: async(req, res) => {
        try {
            const myRank = RANK[req.user.role] || 0;
            let where = '1=1';
            const params = [];

            // Build WHERE clause based on admin's scope
            if (req.user.role === 'Region') {
                where = 'region_name=?';
                params.push(req.user.region_name);
            } else if (req.user.role === 'Zone') {
                where = 'zone_name=?';
                params.push(req.user.zone_name);
            } else if (req.user.role === 'Woreda') {
                where = 'woreda_name=?';
                params.push(req.user.woreda_name);
            } else if (req.user.role === 'Kebele') {
                where = 'kebele_name=?';
                params.push(req.user.kebele_name);
            }

            // Get admins
            const [admins] = await db.query(
                `SELECT 'admin' AS type, id, full_name, phone_number, password_hash, role,
                region_name, zone_name, woreda_name, kebele_name, created_at
         FROM admins
         WHERE ${where} AND (
           CASE role
             WHEN 'Federal' THEN 5
             WHEN 'Region' THEN 4
             WHEN 'Zone' THEN 3
             WHEN 'Woreda' THEN 2
             WHEN 'Kebele' THEN 1
             ELSE 0
           END
         ) < ?
         ORDER BY created_at DESC`, [...params, myRank]
            );

            // Get farmers
            const [farmers] = await db.query(
                `SELECT 'farmer' AS type, id, full_name, phone_number, password_hash, NULL AS role,
                region_name, zone_name, woreda_name, kebele_name, created_at
         FROM farmers
         WHERE ${where}
         ORDER by created_at DESC`,
                params
            );

            return res.json([...admins, ...farmers]);
        } catch (err) {
            console.error('List in scope error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    },
    updateLowerAdmin: async(req, res) => {
        try {
            const creator = req.user;
            const { id } = req.params;
            const {
                fullName,
                phoneNumber,
                password,
                confirmPassword,
                region_name,
                zone_name,
                woreda_name,
                kebele_name,
                // Agricultural fields (for farmers)
                landSizeHectares,
                cropTypes,
                landType,
                cropsSeason,
                farmingExperience,
                irrigationType,
                farmingMethod,
                primaryCrops,
                secondaryCrops,
                soilType,
                hasLivestock,
                livestockTypes,
                annualIncome,
                educationLevel
            } = req.body;

            // Check if target is an admin or farmer
            let isFarmer = false;
            let target = null;

            // First check if it's an admin
            const [adminRows] = await db.query('SELECT * FROM admins WHERE id=?', [id]);
            if (adminRows.length) {
                target = adminRows[0];
            } else {
                // If not admin, check if it's a farmer
                const [farmerRows] = await db.query('SELECT * FROM farmers WHERE id=?', [id]);
                if (farmerRows.length) {
                    target = farmerRows[0];
                    isFarmer = true;
                } else {
                    return res.status(404).json({ message: 'Admin or farmer not found' });
                }
            }

            // AUTHORIZATION CHECKS - CORRECTED HIERARCHY
            if (isFarmer) {
                // ONLY Kebele admins can edit farmers (in their own scope)
                if (creator.role !== 'Kebele') {
                    return res.status(403).json({ message: 'Only Kebele admins can edit farmers' });
                }

                // Check if farmer is within Kebele admin's scope
                if (!helpers.scopeMatches(creator, target)) {
                    return res.status(403).json({ message: 'Farmer is outside your kebele scope' });
                }
            } else {
                // For admins: Strict hierarchical editing permissions
                const creatorRank = RANK[creator.role] || 0;
                const targetRank = RANK[target.role] || 0;

                // Check if creator can edit this target based on role hierarchy
                const canEditBasedOnRole = () => {
                    switch (creator.role) {
                        case 'Federal':
                            return target.role === 'Region'; // Federal can only edit Regions
                        case 'Region':
                            return target.role === 'Zone'; // Region can only edit Zones in their region
                        case 'Zone':
                            return target.role === 'Woreda'; // Zone can only edit Woredas in their zone
                        case 'Woreda':
                            return target.role === 'Kebele'; // Woreda can only edit Kebeles in their woreda
                        case 'Kebele':
                            return false; // Kebele cannot edit any admins, only farmers
                        default:
                            return false;
                    }
                };

                if (!canEditBasedOnRole()) {
                    return res.status(403).json({
                        message: `A ${creator.role} admin can only edit ${helpers.lowerRoleOf(creator.role)} admins`
                    });
                }

                // Check scope matching for non-Federal admins
                if (creator.role !== 'Federal' && !helpers.scopeMatches(creator, target)) {
                    return res.status(403).json({ message: 'Target admin is outside your scope' });
                }
            }

            // LOCATION EDITING RESTRICTIONS
            // Prepare update values with restrictions on who can edit which location fields
            const newVals = {
                role: isFarmer ? 'Farmer' : target.role,
                region_name: target.region_name, // Default to current value
                zone_name: target.zone_name, // Default to current value
                woreda_name: target.woreda_name, // Default to current value
                kebele_name: target.kebele_name // Default to current value
            };

            // Determine which location fields can be edited based on admin role
            if (!isFarmer) {
                // For admins: Apply location editing restrictions
                switch (creator.role) {
                    case 'Federal':
                        // Federal can edit region_name of Region admins
                        if (region_name !== undefined) newVals.region_name = region_name;
                        break;
                    case 'Region':
                        // Region can edit zone_name of Zone admins (but NOT region_name)
                        if (zone_name !== undefined) newVals.zone_name = zone_name;
                        break;
                    case 'Zone':
                        // Zone can edit woreda_name of Woreda admins (but NOT region_name or zone_name)
                        if (woreda_name !== undefined) newVals.woreda_name = woreda_name;
                        break;
                    case 'Woreda':
                        // Woreda can edit kebele_name of Kebele admins (but NOT region_name, zone_name, or woreda_name)
                        if (kebele_name !== undefined) newVals.kebele_name = kebele_name;
                        break;
                }
            } else {
                // For farmers: Kebele admins can ONLY edit kebele_name (not region, zone, or woreda)
                if (kebele_name !== undefined) newVals.kebele_name = kebele_name;
            }

            // Check uniqueness if location changed (only for admins, not farmers)
            if (!isFarmer && (region_name !== undefined || zone_name !== undefined ||
                    woreda_name !== undefined || kebele_name !== undefined)) {
                await helpers.ensureUniquePerScope(newVals);
            }

            // Check phone uniqueness if changed
            if (phoneNumber !== undefined && phoneNumber !== target.phone_number) {
                if (isFarmer) {
                    const [existsA] = await db.query('SELECT id FROM admins WHERE phone_number=? LIMIT 1', [phoneNumber]);
                    const [existsF] = await db.query('SELECT id FROM farmers WHERE phone_number=? AND id<>? LIMIT 1', [phoneNumber, id]);
                    if (existsA.length || existsF.length) return res.status(409).json({ message: 'Phone number already in use' });
                } else {
                    const [existsA] = await db.query('SELECT id FROM admins WHERE phone_number=? AND id<>? LIMIT 1', [phoneNumber, id]);
                    const [existsF] = await db.query('SELECT id FROM farmers WHERE phone_number=? LIMIT 1', [phoneNumber]);
                    if (existsA.length || existsF.length) return res.status(409).json({ message: 'Phone number already in use' });
                }
            }

            // Password validation if updating password
            if (password !== undefined) {
                if (!confirmPassword) {
                    return res.status(400).json({ message: 'Password confirmation is required' });
                }
                if (password !== confirmPassword) {
                    return res.status(400).json({ message: 'Password and confirmation do not match' });
                }
                if (password.length < 6) {
                    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
                }
            }

            // Perform update based on whether it's an admin or farmer
            if (isFarmer) {
                // Update farmer with all agricultural fields
                const updateFields = [];
                const updateValues = [];

                if (fullName !== undefined) {
                    updateFields.push('full_name = ?');
                    updateValues.push(fullName || null);
                }

                if (phoneNumber !== undefined) {
                    updateFields.push('phone_number = ?');
                    updateValues.push(phoneNumber || null);
                }

                // Only update kebele_name (not region, zone, or woreda for farmers)
                updateFields.push('kebele_name = ?');
                updateValues.push(newVals.kebele_name || null);

                // Keep original region, zone, and woreda values (cannot be changed by Kebele admin)
                updateFields.push('region_name = ?', 'zone_name = ?', 'woreda_name = ?');
                updateValues.push(
                    target.region_name || null,
                    target.zone_name || null,
                    target.woreda_name || null
                );

                // Handle agricultural fields, converting empty strings to NULL
                const agriFields = [
                    { field: 'land_size_hectares', value: landSizeHectares },
                    { field: 'crop_types', value: cropTypes },
                    { field: 'land_type', value: landType },
                    { field: 'crops_season', value: cropsSeason },
                    { field: 'farming_experience', value: farmingExperience },
                    { field: 'irrigation_type', value: irrigationType },
                    { field: 'farming_method', value: farmingMethod },
                    { field: 'primary_crops', value: primaryCrops },
                    { field: 'secondary_crops', value: secondaryCrops },
                    { field: 'soil_type', value: soilType },
                    { field: 'has_livestock', value: hasLivestock },
                    { field: 'livestock_types', value: livestockTypes },
                    { field: 'annual_income', value: annualIncome },
                    { field: 'education_level', value: educationLevel }
                ];

                agriFields.forEach(({ field, value }) => {
                    if (value !== undefined) {
                        updateFields.push(`${field} = ?`);
                        // Convert empty strings to NULL, keep other values as is
                        updateValues.push(value === '' ? null : value);
                    }
                });

                updateValues.push(id);

                await db.query(
                    `UPDATE farmers SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );

                const [updated] = await db.query('SELECT * FROM farmers WHERE id=?', [id]);
                return res.json({ message: 'Farmer updated successfully', farmer: updated[0] });
            } else {
                // Update admin
                const updateFields = [];
                const updateValues = [];

                if (fullName !== undefined) {
                    updateFields.push('full_name = ?');
                    updateValues.push(fullName || null);
                }

                if (phoneNumber !== undefined) {
                    updateFields.push('phone_number = ?');
                    updateValues.push(phoneNumber || null);
                }

                // Handle password update
                if (password !== undefined) {
                    const passwordHash = await bcrypt.hash(password, 10);
                    updateFields.push('password_hash = ?');
                    updateValues.push(passwordHash);
                }

                // Update location fields based on permissions
                updateFields.push('region_name = ?', 'zone_name = ?', 'woreda_name = ?', 'kebele_name = ?');
                updateValues.push(
                    newVals.region_name || null,
                    newVals.zone_name || null,
                    newVals.woreda_name || null,
                    newVals.kebele_name || null
                );

                updateValues.push(id);

                await db.query(
                    `UPDATE admins SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );

                const [updated] = await db.query('SELECT * FROM admins WHERE id=?', [id]);
                return res.json({ message: 'Admin updated successfully', admin: updated[0] });
            }
        } catch (err) {
            console.error('Update lower admin error:', err);
            return res.status(500).json({ message: err.message || 'Server error' });
        }
    },
    // NEW: Kebele admin update farmer profile
    updateFarmerProfile: async(req, res) => {
        try {
            const creator = req.user;
            const { id } = req.params;
            const {
                fullName,
                phoneNumber,
                password,
                confirmPassword,
                kebele_name,
                // Agricultural fields
                landSizeHectares,
                cropTypes,
                landType,
                cropsSeason,
                farmingExperience,
                irrigationType,
                farmingMethod,
                primaryCrops,
                secondaryCrops,
                soilType,
                hasLivestock,
                livestockTypes,
                annualIncome,
                educationLevel
            } = req.body;

            // Only Kebele admins can use this function
            if (creator.role !== 'Kebele') {
                return res.status(403).json({ message: 'Only Kebele admins can update farmer profiles' });
            }

            // Check if target is a farmer
            const [farmerRows] = await db.query('SELECT * FROM farmers WHERE id=?', [id]);
            if (!farmerRows.length) {
                return res.status(404).json({ message: 'Farmer not found' });
            }

            const farmer = farmerRows[0];

            // Check if farmer is within Kebele admin's scope
            if (!helpers.scopeMatches(creator, farmer)) {
                return res.status(403).json({ message: 'Farmer is outside your kebele scope' });
            }

            // Check phone uniqueness if changed
            if (phoneNumber !== undefined && phoneNumber !== farmer.phone_number) {
                const [existsA] = await db.query('SELECT id FROM admins WHERE phone_number=? LIMIT 1', [phoneNumber]);
                const [existsF] = await db.query('SELECT id FROM farmers WHERE phone_number=? AND id<>? LIMIT 1', [phoneNumber, id]);
                if (existsA.length || existsF.length) return res.status(409).json({ message: 'Phone number already in use' });
            }

            // Password validation if updating password
            if (password !== undefined) {
                if (!confirmPassword) {
                    return res.status(400).json({ message: 'Password confirmation is required' });
                }
                if (password !== confirmPassword) {
                    return res.status(400).json({ message: 'Password and confirmation do not match' });
                }
                if (password.length < 6) {
                    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
                }
            }

            // Update farmer with all fields
            const updateFields = [];
            const updateValues = [];

            if (fullName !== undefined) {
                updateFields.push('full_name = ?');
                updateValues.push(fullName || null);
            }

            if (phoneNumber !== undefined) {
                updateFields.push('phone_number = ?');
                updateValues.push(phoneNumber || null);
            }

            // Only update kebele_name (not region, zone, or woreda for farmers)
            if (kebele_name !== undefined) {
                updateFields.push('kebele_name = ?');
                updateValues.push(kebele_name || null);
            }

            // Handle password update
            if (password !== undefined) {
                const passwordHash = await bcrypt.hash(password, 10);
                updateFields.push('password_hash = ?');
                updateValues.push(passwordHash);
            }

            // Handle agricultural fields, converting empty strings to NULL
            const agriFields = [
                { field: 'land_size_hectares', value: landSizeHectares },
                { field: 'crop_types', value: cropTypes },
                { field: 'land_type', value: landType },
                { field: 'crops_season', value: cropsSeason },
                { field: 'farming_experience', value: farmingExperience },
                { field: 'irrigation_type', value: irrigationType },
                { field: 'farming_method', value: farmingMethod },
                { field: 'primary_crops', value: primaryCrops },
                { field: 'secondary_crops', value: secondaryCrops },
                { field: 'soil_type', value: soilType },
                { field: 'has_livestock', value: hasLivestock },
                { field: 'livestock_types', value: livestockTypes },
                { field: 'annual_income', value: annualIncome },
                { field: 'education_level', value: educationLevel }
            ];

            agriFields.forEach(({ field, value }) => {
                if (value !== undefined) {
                    updateFields.push(`${field} = ?`);
                    // Convert empty strings to NULL, keep other values as is
                    updateValues.push(value === '' ? null : value);
                }
            });

            updateValues.push(id);

            await db.query(
                `UPDATE farmers SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            const [updated] = await db.query('SELECT * FROM farmers WHERE id=?', [id]);
            return res.json({ message: 'Farmer updated successfully', farmer: updated[0] });

        } catch (err) {
            console.error('Update farmer profile error:', err);
            return res.status(500).json({ message: err.message || 'Server error' });
        }
    }
}; // This closes the adminManagement object

// ... rest of your code ...

// ... rest of your code ...
const productManagement = {
    addProduct: async(req, res) => {
        try {
            const {
                name,
                category,
                price,
                amount,
                description,
                sub_category,
                unit,
                manufacturer,
                expiry_date
            } = req.body;

            // Required fields validation
            if (!name || !category || !amount || !price || !sub_category || !unit || !expiry_date) {
                return res.status(400).json({
                    message: 'Product name, category, amount, price, sub_category, unit, and expiry_date are required'
                });
            }

            // Validate expiry_date format
            const expiryDate = new Date(expiry_date);
            if (isNaN(expiryDate.getTime())) {
                return res.status(400).json({
                    message: 'Invalid expiry_date format. Use YYYY-MM-DD format'
                });
            }

            const [result] = await db.query(
                `INSERT INTO products (
                    name, 
                    category, 
                    sub_category,
                    price,
                    amount, 
                    unit,
                    description,
                    manufacturer,
                    expiry_date,
                    created_by_admin_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    name,
                    category,
                    sub_category,
                    price,
                    amount,
                    unit || null,
                    description || null,
                    manufacturer || null,
                    expiry_date,
                    req.user.id
                ]
            );

            const [product] = await db.query('SELECT * FROM products WHERE id=?', [result.insertId]);
            return res.status(201).json({
                message: 'Product created successfully',
                product: product[0]
            });
        } catch (err) {
            console.error('Add product error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    },

    listProducts: async(req, res) => {
        try {
            // All admins can see ALL products with all columns
            const [products] = await db.query(
                `SELECT 
                p.*, -- Select all columns from products table
                a.full_name as created_by_name,
                a.role as admin_role, 
                a.region_name, 
                a.zone_name, 
                a.woreda_name, 
                a.kebele_name
             FROM products p 
             LEFT JOIN admins a ON p.created_by_admin_id = a.id 
             ORDER BY p.created_at DESC`
            );
            return res.json(products);
        } catch (err) {
            console.error('List products error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    },
    listMyProducts: async(req, res) => {
        try {
            const [products] = await db.query(
                `SELECT 
                p.*, -- Select all columns from products table
                a.full_name as created_by_name 
             FROM products p 
             LEFT JOIN admins a ON p.created_by_admin_id = a.id 
             WHERE p.created_by_admin_id = ? 
             ORDER BY p.created_at DESC`, [req.user.id]
            );
            return res.json(products);
        } catch (err) {
            console.error('List my products error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    },
    listOtherAdminsProducts: async(req, res) => {
        try {
            const [products] = await db.query(
                `SELECT 
                p.*, -- Select all columns from products table
                a.full_name as created_by_name, 
                a.role as admin_role, 
                a.region_name, 
                a.zone_name, 
                a.woreda_name, 
                a.kebele_name
             FROM products p 
             LEFT JOIN admins a ON p.created_by_admin_id = a.id 
             WHERE p.created_by_admin_id != ? OR p.created_by_admin_id IS NULL
             ORDER BY p.created_at DESC`, [req.user.id]
            );
            return res.json(products);
        } catch (err) {
            console.error('List other admins products error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    },
    updateProduct: async(req, res) => {
        try {
            const { id } = req.params;
            const {
                name,
                description,
                amount,
                category,
                sub_category, // Add this
                expiry_date // Add this
            } = req.body;

            // Check if product exists and is owned by current admin
            const [rows] = await db.query(
                'SELECT * FROM products WHERE id=? AND created_by_admin_id=?', [id, req.user.id]
            );
            if (!rows.length) return res.status(404).json({ message: 'Product not found or not owned by you' });

            // Validate expiry_date if provided
            if (expiry_date) {
                const expiryDate = new Date(expiry_date);
                if (isNaN(expiryDate.getTime())) {
                    return res.status(400).json({
                        message: 'Invalid expiry_date format. Use YYYY-MM-DD format'
                    });
                }
            }

            await db.query(
                `UPDATE products SET 
                    name = COALESCE(?, name),
                    description = COALESCE(?, description),
                    amount = COALESCE(?, amount),
                    category = COALESCE(?, category),
                    sub_category = COALESCE(?, sub_category),  // Add this
                    expiry_date = COALESCE(?, expiry_date)     // Add this
                 WHERE id=?`, [name, description, amount, category, sub_category, expiry_date, id]
            );

            const [updated] = await db.query('SELECT * FROM products WHERE id=?', [id]);
            return res.json({ message: 'Product updated successfully', product: updated[0] });
        } catch (err) {
            console.error('Update product error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    },

    deleteProduct: async(req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.query(
                'SELECT * FROM products WHERE id=? AND created_by_admin_id=?', [id, req.user.id]
            );
            if (!rows.length) return res.status(404).json({ message: 'Product not found or not owned by you' });

            await db.query('DELETE FROM products WHERE id=?', [id]);
            return res.json({ message: 'Product deleted successfully' });
        } catch (err) {
            console.error('Delete product error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }
};
// Request Management
const requestManagement = { // ====== List requests in admin's scope ======
    listRequests: async(req, res) => {
        try {
            const admin = req.user;
            let where = '1=1';
            const params = [];

            // Build WHERE clause based on admin's scope
            if (admin.role === 'Federal') {
                // Federal admin can see all requests
                where = '1=1';
            } else if (admin.role === 'Region') {
                where = 'r.region_name=?';
                params.push(admin.region_name);
            } else if (admin.role === 'Zone') {
                where = 'r.region_name=? AND r.zone_name=?';
                params.push(admin.region_name, admin.zone_name);
            } else if (admin.role === 'Woreda') {
                where = 'r.region_name=? AND r.zone_name=? AND r.woreda_name=?';
                params.push(admin.region_name, admin.zone_name, admin.woreda_name);
            } else if (admin.role === 'Kebele') {
                where = 'r.region_name=? AND r.zone_name=? AND r.woreda_name=? AND r.kebele_name=?';
                params.push(admin.region_name, admin.zone_name, admin.woreda_name, admin.kebele_name);
            }

            const [requests] = await db.query(
                `SELECT 
                r.*, -- Select all columns from requests table
                f.full_name AS farmer_name, 
                f.phone_number AS farmer_phone,
                f.region_name AS farmer_region,
                f.zone_name AS farmer_zone,
                f.woreda_name AS farmer_woreda,
                f.kebele_name AS farmer_kebele,
                p.name as product_name, 
                p.category as product_category,
                p.sub_category as product_sub_category,
                p.price as product_price,
                p.amount as product_amount,
                p.unit as product_unit,
                p.manufacturer as product_manufacturer,
                p.expiry_date as product_expiry_date,
                p.description as product_description,
                kebele_admin.full_name AS kebele_admin_name,
                kebele_admin.phone_number AS kebele_admin_phone,
                woreda_admin.full_name AS woreda_admin_name,
                woreda_admin.phone_number AS woreda_admin_phone,
                zone_admin.full_name AS zone_admin_name,
                zone_admin.phone_number AS zone_admin_phone,
                region_admin.full_name AS region_admin_name,
                region_admin.phone_number AS region_admin_phone,
                federal_admin.full_name AS federal_admin_name,
                federal_admin.phone_number AS federal_admin_phone
             FROM requests r
             JOIN farmers f ON r.farmer_id = f.id
             LEFT JOIN products p ON r.product_id = p.id
             LEFT JOIN admins kebele_admin ON r.kebele_admin_id = kebele_admin.id
             LEFT JOIN admins woreda_admin ON r.woreda_admin_id = woreda_admin.id
             LEFT JOIN admins zone_admin ON r.zone_admin_id = zone_admin.id
             LEFT JOIN admins region_admin ON r.region_admin_id = region_admin.id
             LEFT JOIN admins federal_admin ON r.federal_admin_id = federal_admin.id
             WHERE ${where}
             ORDER BY r.created_at DESC`,
                params
            );

            return res.json({
                message: 'Requests retrieved successfully',
                count: requests.length,
                requests: requests
            });

        } catch (err) {
            console.error('List requests error:', err);
            return res.status(500).json({ message: 'Server error: ' + err.message });
        }
    }, // ====== Update request status (with scope validation) ======
    updateRequestStatus: async(req, res) => {
        try {
            const admin = req.user;
            const { id } = req.params;
            const { status, feedback } = req.body;

            if (!['Pending', 'Approved', 'Rejected', 'Accepted'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }

            // Get request with detailed status
            const [rows] = await db.query(
                `SELECT r.*, f.region_name, f.zone_name, f.woreda_name, f.kebele_name 
             FROM requests r 
             JOIN farmers f ON r.farmer_id = f.id 
             WHERE r.id=?`, [id]
            );

            if (!rows.length) return res.status(404).json({ message: 'Request not found' });
            const request = rows[0];

            // Check scope - ensure admin can only manage requests in their scope
            const farmerScope = {
                region_name: request.region_name,
                zone_name: request.zone_name,
                woreda_name: request.woreda_name,
                kebele_name: request.kebele_name
            };

            if (!helpers.scopeMatches(admin, farmerScope)) {
                return res.status(403).json({ message: 'Request is outside your scope' });
            }

            // Determine which status field to update based on admin role
            let statusField = '';
            let adminIdField = '';
            let approvedAtField = '';
            let feedbackField = '';

            switch (admin.role) {
                case 'Kebele':
                    statusField = 'kebele_status';
                    adminIdField = 'kebele_admin_id';
                    approvedAtField = 'kebele_approved_at';
                    feedbackField = 'kebele_feedback';
                    break;
                case 'Woreda':
                    statusField = 'woreda_status';
                    adminIdField = 'woreda_admin_id';
                    approvedAtField = 'woreda_approved_at';
                    feedbackField = 'woreda_feedback';
                    break;
                case 'Zone':
                    statusField = 'zone_status';
                    adminIdField = 'zone_admin_id';
                    approvedAtField = 'zone_approved_at';
                    feedbackField = 'zone_feedback';
                    break;
                case 'Region':
                    statusField = 'region_status';
                    adminIdField = 'region_admin_id';
                    approvedAtField = 'region_approved_at';
                    feedbackField = 'region_feedback';
                    break;
                case 'Federal':
                    statusField = 'federal_status';
                    adminIdField = 'federal_admin_id';
                    approvedAtField = 'federal_approved_at';
                    feedbackField = 'federal_feedback';
                    break;
                default:
                    return res.status(403).json({ message: 'Invalid admin role' });
            }

            // Update the specific status field
            await db.query(
                `UPDATE requests SET 
                ${statusField} = ?,
                ${adminIdField} = ?,
                ${approvedAtField} = CURRENT_TIMESTAMP,
                ${feedbackField} = COALESCE(?, ${feedbackField})
             WHERE id = ?`, [status, admin.id, feedback || null, id]
            );

            const [updated] = await db.query('SELECT * FROM requests WHERE id=?', [id]);
            return res.json({
                message: 'Request status updated successfully',
                request: updated[0]
            });

        } catch (err) {
            console.error('Update request status error:', err);
            return res.status(500).json({ message: 'Server error: ' + err.message });
        }
    },

    // NEW: Delete rejected requests
    deleteRejectedRequest: async(req, res) => {
        try {
            const admin = req.user;
            const { id } = req.params;

            // Get request details
            const [rows] = await db.query(
                `SELECT r.*, f.region_name, f.zone_name, f.woreda_name, f.kebele_name 
                 FROM requests r 
                 JOIN farmers f ON r.farmer_id = f.id 
                 WHERE r.id=?`, [id]
            );

            if (!rows.length) return res.status(404).json({ message: 'Request not found' });
            const request = rows[0];

            // Check scope
            const farmerScope = {
                region_name: request.region_name,
                zone_name: request.zone_name,
                woreda_name: request.woreda_name,
                kebele_name: request.kebele_name
            };
            if (!helpers.scopeMatches(admin, farmerScope)) {
                return res.status(403).json({ message: 'Request is outside your scope' });
            }

            // Check if request is rejected
            if (request.status !== 'rejected') {
                return res.status(400).json({ message: 'Only rejected requests can be deleted' });
            }

            // Check if admin is the one who rejected it or has higher privileges
            let canDelete = false;

            // Check if admin rejected it at their level
            if (admin.role === 'Kebele' && request.kebele_admin_id === admin.id) canDelete = true;
            if (admin.role === 'Woreda' && request.woreda_admin_id === admin.id) canDelete = true;
            if (admin.role === 'Zone' && request.zone_admin_id === admin.id) canDelete = true;
            if (admin.role === 'Region' && request.region_admin_id === admin.id) canDelete = true;
            if (admin.role === 'Federal' && request.federal_admin_id === admin.id) canDelete = true;

            // Higher level admins can delete requests rejected by lower level admins in their scope
            if (!canDelete) {
                const adminRank = RANK[admin.role] || 0;
                const rejecterRank = getRejecterRank(request);

                if (adminRank > rejecterRank && helpers.scopeMatches(admin, farmerScope)) {
                    canDelete = true;
                }
            }

            if (!canDelete) {
                return res.status(403).json({ message: 'You can only delete requests that you rejected or that were rejected in your scope' });
            }

            await db.query('DELETE FROM requests WHERE id=?', [id]);
            return res.json({ message: 'Rejected request deleted successfully' });
        } catch (err) {
            console.error('Delete rejected request error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }
};

// NEW: Helper function to check if admin can modify a request
function canAdminModifyRequest(admin, request) {
    const adminRole = admin.role;
    const adminRank = RANK[adminRole] || 0;

    // Federal admin can modify any request
    if (adminRole === 'Federal') return true;

    // Check the status at the admin's level and lower levels
    switch (adminRole) {
        case 'Region':
            // Region admin can only modify if zone has approved
            return request.zone_status === 'Approved' &&
                request.region_status === 'Pending';

        case 'Zone':
            // Zone admin can only modify if woreda has approved
            return request.woreda_status === 'Approved' &&
                request.zone_status === 'Pending';

        case 'Woreda':
            // Woreda admin can only modify if kebele has approved
            return request.kebele_status === 'Approved' &&
                request.woreda_status === 'Pending';

        case 'Kebele':
            // Kebele admin can modify any request in their scope that's pending at their level
            return request.kebele_status === 'Pending';

        default:
            return false;
    }
} // ====== Get farmers in admin's scope ======
exports.listFarmersInScope = async(req, res) => {
    try {
        const admin = req.user;
        let where = '1=1';
        const params = [];

        // Build WHERE clause based on admin's scope
        if (admin.role === 'Federal') {
            // Federal admin can see all farmers
            where = '1=1';
        } else if (admin.role === 'Region') {
            where = 'region_name = ?';
            params.push(admin.region_name);
        } else if (admin.role === 'Zone') {
            where = 'region_name = ? AND zone_name = ?';
            params.push(admin.region_name, admin.zone_name);
        } else if (admin.role === 'Woreda') {
            where = 'region_name = ? AND zone_name = ? AND woreda_name = ?';
            params.push(admin.region_name, admin.zone_name, admin.woreda_name);
        } else if (admin.role === 'Kebele') {
            where = 'region_name = ? AND zone_name = ? AND woreda_name = ? AND kebele_name = ?';
            params.push(admin.region_name, admin.zone_name, admin.woreda_name, admin.kebele_name);
        }

        // Get farmers with all agricultural fields
        const [farmers] = await db.query(
            `SELECT 
                id, full_name, phone_number, role, 
                region_name, zone_name, woreda_name, kebele_name,
                land_size_hectares, crop_types, land_type,crops_season, farming_experience,
                irrigation_type, farming_method, primary_crops, secondary_crops,
                soil_type, has_livestock, livestock_types, annual_income, education_level,
                created_at
             FROM farmers 
             WHERE ${where}
             ORDER BY created_at DESC`,
            params
        );

        return res.json({
            message: 'Farmers retrieved successfully',
            count: farmers.length,
            farmers: farmers
        });

    } catch (err) {
        console.error('List farmers in scope error:', err);
        return res.status(500).json({ message: 'Server error: ' + err.message });
    }
};
// NEW: Helper function to get the rank of the admin who rejected the request
function getRejecterRank(request) {
    if (request.federal_status === 'Rejected') return RANK['Federal'];
    if (request.region_status === 'Rejected') return RANK['Region'];
    if (request.zone_status === 'Rejected') return RANK['Zone'];
    if (request.woreda_status === 'Rejected') return RANK['Woreda'];
    if (request.kebele_status === 'Rejected') return RANK['Kebele'];
    return 0;
}
// Report Management
const reportManagement = {
    // Create a report about another admin
    createReport: async(req, res) => {
        try {
            const reporter = req.user;
            const { reported_admin_id, report_type, title, description, evidence, priority } = req.body;

            // Validation
            if (!reported_admin_id || !report_type || !title || !description) {
                return res.status(400).json({ message: 'Reported admin ID, type, title, and description are required' });
            }

            // Check if reported admin exists
            const [reportedAdminRows] = await db.query('SELECT * FROM admins WHERE id = ?', [reported_admin_id]);
            if (reportedAdminRows.length === 0) {
                return res.status(404).json({ message: 'Reported admin not found' });
            }

            const reportedAdmin = reportedAdminRows[0];

            // Authorization: Check if reporter can report this admin
            // Admins can only report admins in their scope or higher-level admins
            if (!helpers.scopeMatches(reporter, reportedAdmin)) {
                return res.status(403).json({ message: 'You can only report admins within your scope' });
            }

            // Check if reporter is trying to report themselves
            if (reporter.id === reported_admin_id) {
                return res.status(400).json({ message: 'You cannot report yourself' });
            }

            // Insert the report
            const [result] = await db.query(
                `INSERT INTO admin_reports 
                 (reporter_admin_id, reported_admin_id, report_type, title, description, evidence, priority, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`, [reporter.id, reported_admin_id, report_type, title, description, evidence || null, priority || 'Medium']
            );

            const [savedReport] = await db.query(`
                SELECT ar.*, 
                       reporter.full_name as reporter_name, reporter.role as reporter_role,
                       reported.full_name as reported_name, reported.role as reported_role
                FROM admin_reports ar
                JOIN admins reporter ON ar.reporter_admin_id = reporter.id
                JOIN admins reported ON ar.reported_admin_id = reported.id
                WHERE ar.id = ?
            `, [result.insertId]);

            return res.status(201).json({
                message: 'Report submitted successfully',
                report: savedReport[0]
            });

        } catch (err) {
            console.error('Create report error:', err);
            return res.status(500).json({ message: 'Server error: ' + err.message });
        }
    },

    // Get reports that the current admin can view (reports they made or reports about them)
    getMyReports: async(req, res) => {
        try {
            const admin = req.user;

            const [reports] = await db.query(`
                SELECT ar.*, 
                       reporter.full_name as reporter_name, reporter.role as reporter_role,
                       reporter.region_name as reporter_region, reporter.zone_name as reporter_zone,
                       reporter.woreda_name as reporter_woreda, reporter.kebele_name as reporter_kebele,
                       reported.full_name as reported_name, reported.role as reported_role,
                       reported.region_name as reported_region, reported.zone_name as reported_zone,
                       reported.woreda_name as reported_woreda, reported.kebele_name as reported_kebele,
                       resolver.full_name as resolver_name
                FROM admin_reports ar
                JOIN admins reporter ON ar.reporter_admin_id = reporter.id
                JOIN admins reported ON ar.reported_admin_id = reported.id
                LEFT JOIN admins resolver ON ar.resolved_by_admin_id = resolver.id
                WHERE ar.reporter_admin_id = ? OR ar.reported_admin_id = ?
                ORDER BY ar.created_at DESC
            `, [admin.id, admin.id]);

            return res.json({
                message: 'Reports retrieved successfully',
                reports: reports
            });

        } catch (err) {
            console.error('Get my reports error:', err);
            return res.status(500).json({ message: 'Server error: ' + err.message });
        }
    },

    // Higher-level admins can view all reports in their scope
    getReportsInScope: async(req, res) => {
        try {
            const admin = req.user;
            let where = '1=1';
            const params = [];

            // Build WHERE clause based on admin's scope
            if (admin.role === 'Region') {
                where = '(reporter.region_name = ? OR reported.region_name = ?)';
                params.push(admin.region_name, admin.region_name);
            } else if (admin.role === 'Zone') {
                where = '(reporter.zone_name = ? OR reported.zone_name = ?)';
                params.push(admin.zone_name, admin.zone_name);
            } else if (admin.role === 'Woreda') {
                where = '(reporter.woreda_name = ? OR reported.woreda_name = ?)';
                params.push(admin.woreda_name, admin.woreda_name);
            } else if (admin.role === 'Kebele') {
                where = '(reporter.kebele_name = ? OR reported.kebele_name = ?)';
                params.push(admin.kebele_name, admin.kebele_name);
            }
            // Federal admin can see all reports (no additional where clause)

            const [reports] = await db.query(`
                SELECT ar.*, 
                       reporter.full_name as reporter_name, reporter.role as reporter_role,
                       reporter.region_name as reporter_region, reporter.zone_name as reporter_zone,
                       reporter.woreda_name as reporter_woreda, reporter.kebele_name as reporter_kebele,
                       reported.full_name as reported_name, reported.role as reported_role,
                       reported.region_name as reported_region, reported.zone_name as reported_zone,
                       reported.woreda_name as reported_woreda, reported.kebele_name as reported_kebele,
                       resolver.full_name as resolver_name
                FROM admin_reports ar
                JOIN admins reporter ON ar.reporter_admin_id = reporter.id
                JOIN admins reported ON ar.reported_admin_id = reported.id
                LEFT JOIN admins resolver ON ar.resolved_by_admin_id = resolver.id
                WHERE ${where}
                ORDER BY ar.priority DESC, ar.created_at DESC
            `, params);

            return res.json({
                message: 'Reports retrieved successfully',
                count: reports.length,
                reports: reports
            });

        } catch (err) {
            console.error('Get reports in scope error:', err);
            return res.status(500).json({ message: 'Server error: ' + err.message });
        }
    },

    // Update report status (for higher-level admins to resolve reports)
    updateReportStatus: async(req, res) => {
        try {
            const admin = req.user;
            const { id } = req.params;
            const { status, resolution_notes } = req.body;

            if (!['Pending', 'Under Review', 'Resolved', 'Dismissed'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }

            // Get the report
            const [reportRows] = await db.query(`
                SELECT ar.*, 
                       reporter.region_name as reporter_region, reporter.zone_name as reporter_zone,
                       reporter.woreda_name as reporter_woreda, reporter.kebele_name as reporter_kebele,
                       reported.region_name as reported_region, reported.zone_name as reported_zone,
                       reported.woreda_name as reported_woreda, reported.kebele_name as reported_kebele
                FROM admin_reports ar
                JOIN admins reporter ON ar.reporter_admin_id = reporter.id
                JOIN admins reported ON ar.reported_admin_id = reported.id
                WHERE ar.id = ?
            `, [id]);

            if (reportRows.length === 0) {
                return res.status(404).json({ message: 'Report not found' });
            }

            const report = reportRows[0];

            // Check if admin has permission to update this report
            // Higher-level admins can manage reports in their scope
            const reporterScope = {
                region_name: report.reporter_region,
                zone_name: report.reporter_zone,
                woreda_name: report.reporter_woreda,
                kebele_name: report.reporter_kebele
            };

            const reportedScope = {
                region_name: report.reported_region,
                zone_name: report.reported_zone,
                woreda_name: report.reported_woreda,
                kebele_name: report.reported_kebele
            };

            const canManageReporter = helpers.scopeMatches(admin, reporterScope);
            const canManageReported = helpers.scopeMatches(admin, reportedScope);

            if (!canManageReporter && !canManageReported) {
                return res.status(403).json({ message: 'You do not have permission to manage this report' });
            }

            // Update the report
            const updateFields = ['status = ?'];
            const updateValues = [status];

            if (status === 'Resolved' || status === 'Dismissed') {
                updateFields.push('resolved_by_admin_id = ?', 'resolved_at = CURRENT_TIMESTAMP');
                updateValues.push(admin.id);
            }

            if (resolution_notes) {
                updateFields.push('resolution_notes = ?');
                updateValues.push(resolution_notes);
            }

            updateValues.push(id);

            await db.query(
                `UPDATE admin_reports SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            const [updatedReport] = await db.query(`
                SELECT ar.*, 
                       reporter.full_name as reporter_name, reporter.role as reporter_role,
                       reported.full_name as reported_name, reported.role as reported_role,
                       resolver.full_name as resolver_name
                FROM admin_reports ar
                JOIN admins reporter ON ar.reporter_admin_id = reporter.id
                JOIN admins reported ON ar.reported_admin_id = reported.id
                LEFT JOIN admins resolver ON ar.resolved_by_admin_id = resolver.id
                WHERE ar.id = ?
            `, [id]);

            return res.json({
                message: 'Report status updated successfully',
                report: updatedReport[0]
            });

        } catch (err) {
            console.error('Update report status error:', err);
            return res.status(500).json({ message: 'Server error: ' + err.message });
        }
    },

    // Get report statistics for dashboard
    getReportStatistics: async(req, res) => {
        try {
            const admin = req.user;
            let where = '1=1';
            const params = [];

            // Build WHERE clause based on admin's scope
            if (admin.role === 'Region') {
                where = '(reporter.region_name = ? OR reported.region_name = ?)';
                params.push(admin.region_name, admin.region_name);
            } else if (admin.role === 'Zone') {
                where = '(reporter.zone_name = ? OR reported.zone_name = ?)';
                params.push(admin.zone_name, admin.zone_name);
            } else if (admin.role === 'Woreda') {
                where = '(reporter.woreda_name = ? OR reported.woreda_name = ?)';
                params.push(admin.woreda_name, admin.woreda_name);
            } else if (admin.role === 'Kebele') {
                where = '(reporter.kebele_name = ? OR reported.kebele_name = ?)';
                params.push(admin.kebele_name, admin.kebele_name);
            }

            const [stats] = await db.query(`
                SELECT 
                    COUNT(*) as total_reports,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_reports,
                    SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review_reports,
                    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_reports,
                    SUM(CASE WHEN status = 'Dismissed' THEN 1 ELSE 0 END) as dismissed_reports,
                    SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical_priority,
                    SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high_priority,
                    SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END) as medium_priority,
                    SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END) as low_priority
                FROM admin_reports ar
                JOIN admins reporter ON ar.reporter_admin_id = reporter.id
                JOIN admins reported ON ar.reported_admin_id = reported.id
                WHERE ${where}
            `, params);

            return res.json({
                message: 'Report statistics retrieved successfully',
                statistics: stats[0]
            });

        } catch (err) {
            console.error('Get report statistics error:', err);
            return res.status(500).json({ message: 'Server error: ' + err.message });
        }
    }
};
// Export all controllers
module.exports = {
    ...auth,
    ...adminManagement,
    ...productManagement,
    ...requestManagement,
    ...reportManagement,
    listFarmersInScope: exports.listFarmersInScope,
    updateFarmerProfile: adminManagement.updateFarmerProfile

};