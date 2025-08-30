const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Constants
const RANK = { Federal: 5, Region: 4, Zone: 3, Woreda: 2, Kebele: 1 };
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
        if (creator.role === 'Region' && target.region_name !== creator.region_name) return false;
        if (creator.role === 'Zone' && target.zone_name !== creator.zone_name) return false;
        if (creator.role === 'Woreda' && target.woreda_name !== creator.woreda_name) return false;
        if (creator.role === 'Kebele' && target.kebele_name !== creator.kebele_name) return false;
        return true;
    },

    roleIsLower: (creatorRole, targetRole) => {
        if (targetRole === 'Farmer') return true;
        return (RANK[targetRole] || 0) < (RANK[creatorRole] || 0);
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
            if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

            const admin = rows[0];
            const match = await bcrypt.compare(password, admin.password_hash || '');
            if (!match) return res.status(401).json({ message: 'Invalid credentials' });

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
        const { fullName, phoneNumber, password, role, region_name, zone_name, woreda_name, kebele_name } = req.body;

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

                // Insert into farmers table
                const [result] = await db.query(
                    `INSERT INTO farmers (full_name, phone_number, password_hash, region_name, zone_name, woreda_name, kebele_name, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`, [fullName, phoneNumber, password_hash, region_name, zone_name, woreda_name, kebele_name]
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
                `SELECT 'admin' AS type, id, full_name, phone_number, role,
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
                `SELECT 'farmer' AS type, id, full_name, phone_number, NULL AS role,
                region_name, zone_name, woreda_name, kebele_name, created_at
         FROM farmers
         WHERE ${where}
         ORDER BY created_at DESC`,
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
            const { fullName, phoneNumber, region_name, zone_name, woreda_name, kebele_name } = req.body;

            // Get target admin
            const [rows] = await db.query('SELECT * FROM admins WHERE id=?', [id]);
            if (!rows.length) return res.status(404).json({ message: 'Admin not found' });
            const target = rows[0];

            // Authorization checks
            if (!helpers.roleIsLower(creator.role, target.role)) {
                return res.status(403).json({ message: 'You can only edit lower-level admins' });
            }
            if (!helpers.scopeMatches(creator, target)) {
                return res.status(403).json({ message: 'Target admin is outside your scope' });
            }

            // Prepare update values
            const newVals = {
                role: target.role,
                region_name: region_name || target.region_name,
                zone_name: zone_name || target.zone_name,
                woreda_name: woreda_name || target.woreda_name,
                kebele_name: kebele_name || target.kebele_name
            };

            // Check uniqueness if location changed
            if (region_name || zone_name || woreda_name || kebele_name) {
                await helpers.ensureUniquePerScope(newVals);
            }

            // Check phone uniqueness if changed
            if (phoneNumber && phoneNumber !== target.phone_number) {
                const [existsA] = await db.query('SELECT id FROM admins WHERE phone_number=? AND id<>? LIMIT 1', [phoneNumber, id]);
                const [existsF] = await db.query('SELECT id FROM farmers WHERE phone_number=? LIMIT 1', [phoneNumber]);
                if (existsA.length || existsF.length) return res.status(409).json({ message: 'Phone number already in use' });
            }

            // Perform update
            await db.query(
                `UPDATE admins SET 
          full_name = COALESCE(?, full_name),
          phone_number = COALESCE(?, phone_number),
          region_name = ?,
          zone_name = ?,
          woreda_name = ?,
          kebele_name = ?
         WHERE id = ?`, [fullName, phoneNumber, newVals.region_name, newVals.zone_name, newVals.woreda_name, newVals.kebele_name, id]
            );

            const [updated] = await db.query('SELECT * FROM admins WHERE id=?', [id]);
            return res.json({ message: 'Admin updated successfully', admin: updated[0] });
        } catch (err) {
            console.error('Update lower admin error:', err);
            return res.status(500).json({ message: err.message || 'Server error' });
        }
    },

    deleteLowerAdmin: async(req, res) => {
        try {
            const creator = req.user;
            const { id } = req.params;

            const [rows] = await db.query('SELECT * FROM admins WHERE id=?', [id]);
            if (!rows.length) return res.status(404).json({ message: 'Admin not found' });
            const target = rows[0];

            if (!helpers.roleIsLower(creator.role, target.role)) {
                return res.status(403).json({ message: 'You can only delete lower-level admins' });
            }
            if (!helpers.scopeMatches(creator, target)) {
                return res.status(403).json({ message: 'Target admin is outside your scope' });
            }

            await db.query('DELETE FROM admins WHERE id=?', [id]);
            return res.json({ message: 'Admin deleted successfully' });
        } catch (err) {
            console.error('Delete lower admin error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }
};

// Product Management
const productManagement = {
    addProduct: async(req, res) => {
        try {
            const { name, description, category, amount, price } = req.body;
            if (!name || !description || !category || !amount || !price) return res.status(400).json({ message: 'Product name ,description ,amount,price and category are required' });

            const [result] = await db.query(
                'INSERT INTO products (name, description, amount,category, price,created_by_admin_id) VALUES (?, ?, ?, ?, ?, ?)', [name, description || null, amount || null, category || null, price, req.user.id]
            );
            const [product] = await db.query('SELECT * FROM products WHERE id=?', [result.insertId]);
            return res.status(201).json({ message: 'Product created successfully', product: product[0] });
        } catch (err) {
            console.error('Add product error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    },
    // All admins can view products added by other admins
    listProducts: async(req, res) => {
        try {
            // All admins can see ALL products
            const [products] = await db.query(
                'SELECT p.*, a.full_name as created_by_name FROM products p LEFT JOIN admins a ON p.created_by_admin_id = a.id ORDER BY p.created_at DESC'
            );
            return res.json(products);
        } catch (err) {
            console.error('List products error:', err);
            return res.status(500).json({ message: 'Server error' });
        }
    }, // NEW: Get products added by current admin
    listMyProducts: async(req, res) => {
        try {
            const [products] = await db.query(
                `SELECT p.*, a.full_name as created_by_name 
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
    }, // NEW: Get products added by other admins (excluding current admin)
    listOtherAdminsProducts: async(req, res) => {
        try {
            const [products] = await db.query(
                `SELECT p.*, a.full_name as created_by_name, 
                        a.role as admin_role, a.region_name, a.zone_name, a.woreda_name, a.kebele_name
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
            const { name, description, amount, category } = req.body;

            const [rows] = await db.query(
                'SELECT * FROM products WHERE id=? AND created_by_admin_id=?', [id, req.user.id]
            );
            if (!rows.length) return res.status(404).json({ message: 'Product not found or not owned by you' });

            await db.query(
                `UPDATE products SET 
          name = COALESCE(?, name),
          description = COALESCE(?, description),
                    amount =COALESCE(?,amount),

          category = COALESCE(?, category)
         WHERE id=?`, [name, description, amount, category, id]
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
const requestManagement = {
    listRequests: async(req, res) => {
        try {
            const admin = req.user;
            let where = '1=1';
            const params = [];

            if (admin.role === 'Region') {
                where = 'r.region_name=?';
                params.push(admin.region_name);
            } else if (admin.role === 'Zone') {
                where = 'r.zone_name=?';
                params.push(admin.zone_name);
            } else if (admin.role === 'Woreda') {
                where = 'r.woreda_name=?';
                params.push(admin.woreda_name);
            } else if (admin.role === 'Kebele') {
                where = 'r.kebele_name=?';
                params.push(admin.kebele_name);
            }

            const [requests] = await db.query(
                `SELECT r.id, r.farmer_id, r.product_id, r.quantity, r.status, r.created_at,
                    f.full_name AS farmer_name, p.name as product_name,
                    r.kebele_status, r.woreda_status, r.zone_status, r.region_status, r.federal_status
             FROM requests r
             JOIN farmers f ON r.farmer_id = f.id
             LEFT JOIN products p ON r.product_id = p.id
             WHERE ${where}
             ORDER BY r.created_at DESC`,
                params
            );

            return res.json(requests);
        } catch (err) {
            console.error('List requests error:', err);
            return res.status(500).json({ message: 'Server error: ' + err.message });
        }
    },

    updateRequestStatus: async(req, res) => {
        try {
            const admin = req.user;
            const { id } = req.params;
            const { status } = req.body;

            if (!['pending', 'accepted', 'rejected'].includes(status)) {
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

            // NEW: Check if admin can modify this request based on workflow
            if (!canAdminModifyRequest(admin, request)) {
                return res.status(403).json({
                    message: 'You can only modify requests that are pending or approved at your level'
                });
            }

            // Update status
            await db.query(
                'UPDATE requests SET status=?, handled_by_admin_id=? WHERE id=?', [status, admin.id, id]
            );

            const [updated] = await db.query('SELECT * FROM requests WHERE id=?', [id]);
            return res.json({ message: 'Request updated successfully', request: updated[0] });
        } catch (err) {
            console.error('Update request status error:', err);
            return res.status(500).json({ message: 'Server error' });
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
}

// NEW: Helper function to get the rank of the admin who rejected the request
function getRejecterRank(request) {
    if (request.federal_status === 'Rejected') return RANK['Federal'];
    if (request.region_status === 'Rejected') return RANK['Region'];
    if (request.zone_status === 'Rejected') return RANK['Zone'];
    if (request.woreda_status === 'Rejected') return RANK['Woreda'];
    if (request.kebele_status === 'Rejected') return RANK['Kebele'];
    return 0;
}

// Export all controllers
module.exports = {
    ...auth,
    ...adminManagement,
    ...productManagement,
    ...requestManagement
};