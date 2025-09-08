const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { recordFailedAttempt, clearAttempts } = require('../middlewares/rateLimitMiddleware');

// Helper function to determine correct overall status for farmers
const determineFarmerStatus = (request) => {
    const { kebele_status, woreda_status, zone_status, region_status, federal_status } = request;
    const allStatuses = [kebele_status, woreda_status, zone_status, region_status, federal_status];

    // Priority 1: If any level has rejected, overall is rejected
    if (allStatuses.includes('Rejected')) {
        return 'Rejected';
    }

    // Priority 2: If any level has accepted, overall is accepted
    if (allStatuses.includes('Accepted')) {
        return 'Accepted';
    }

    // Priority 3: If any level has approved (and no accept/reject), overall is approved
    if (allStatuses.includes('Approved')) {
        return 'Approved';
    }

    // Priority 4: If all levels are pending, overall is pending
    return 'Pending';
};

// ====== Farmer login ======
exports.login = async(req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        if (!phoneNumber || !password) return res.status(400).json({ message: 'phoneNumber and password are required' });

        const [rows] = await db.query('SELECT * FROM farmers WHERE phone_number=? LIMIT 1', [phoneNumber]);
        if (!rows.length) {
            const attemptResult = recordFailedAttempt(req);
            return res.status(401).json({
                message: 'Invalid credentials',
                attemptsRemaining: attemptResult.attemptsRemaining,
                blocked: attemptResult.blocked
            });
        }

        const farmer = rows[0];
        const match = await bcrypt.compare(password, farmer.password_hash || '');
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

        const token = jwt.sign({
            id: farmer.id,
            role: 'Farmer'
        }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '12h' });

        return res.json({
            token,
            farmer: {
                id: farmer.id,
                fullName: farmer.full_name,
                phoneNumber: farmer.phone_number,
                region_name: farmer.region_name,
                zone_name: farmer.zone_name,
                woreda_name: farmer.woreda_name,
                kebele_name: farmer.kebele_name,
                created_at: farmer.created_at
            }
        });
    } catch (err) {
        console.error('Farmer login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ====== Create a new request ======
exports.createRequest = async(req, res) => {
    const connection = await db.getConnection(); // Get a connection for transaction
    try {
        await connection.beginTransaction(); // Start transaction

        // Check if user is authenticated and is a farmer
        if (!req.user || !req.user.id) {
            await connection.rollback();
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (req.user.role !== 'Farmer') {
            await connection.rollback();
            return res.status(403).json({ message: 'Only farmers can create requests' });
        }

        const { product_id, quantity, note } = req.body;

        // Validation
        if (!product_id || !quantity) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Product ID and quantity are required'
            });
        }

        if (quantity <= 0) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Quantity must be greater than 0'
            });
        }

        // Check if product exists and has sufficient quantity
        const [productRows] = await connection.query(
            'SELECT * FROM products WHERE id=? LIMIT 1 FOR UPDATE', [product_id]
        );

        if (!productRows.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = productRows[0];

        // Check if there's enough product available
        if (product.amount < quantity) {
            await connection.rollback();
            return res.status(400).json({
                message: `Insufficient product quantity. Available: ${product.amount}, Requested: ${quantity}`
            });
        }

        // Get farmer details
        const [farmerRows] = await connection.query(
            'SELECT * FROM farmers WHERE id=? LIMIT 1', [req.user.id]
        );

        if (!farmerRows.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Farmer not found' });
        }

        const farmer = farmerRows[0];

        // Check if request is already pending for the same product
        const [existingRequest] = await connection.query(
            'SELECT id FROM requests WHERE farmer_id=? AND product_id=? AND status="Pending" LIMIT 1', [farmer.id, product_id]
        );

        if (existingRequest.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'You already have a pending request for this product' });
        }

        // Decrease the product amount
        await connection.query(
            'UPDATE products SET amount = amount - ? WHERE id = ?', [quantity, product_id]
        );

        // Create the request with level status fields
        const [result] = await connection.query(
            `INSERT INTO requests (farmer_id, product_id, quantity, note, 
             region_name, zone_name, woreda_name, kebele_name, status,
             kebele_status, woreda_status, zone_status, region_status, federal_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Pending')`, [farmer.id, product_id, quantity, note || null,
                farmer.region_name, farmer.zone_name, farmer.woreda_name, farmer.kebele_name
            ]
        );

        const [savedRequest] = await connection.query(`
            SELECT r.*, p.name as product_name, p.category as product_category, p.amount as remaining_stock
            FROM requests r 
            JOIN products p ON r.product_id = p.id 
            WHERE r.id=?
        `, [result.insertId]);

        await connection.commit(); // Commit transaction

        return res.status(201).json({
            message: 'Request created successfully',
            request: savedRequest[0],
            remaining_stock: product.amount - quantity
        });

    } catch (err) {
        await connection.rollback(); // Rollback on error
        console.error('createRequest error:', err);

        if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
            return res.status(400).json({
                message: 'Insufficient product quantity'
            });
        }

        return res.status(500).json({
            message: 'Server error: ' + err.message
        });
    } finally {
        connection.release(); // Always release connection
    }
};

// ====== Get my requests ======
exports.listMyRequests = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const [requests] = await db.query(`
            SELECT r.id, r.product_id, p.name as product_name, p.category, p.price,
                   r.quantity, r.status, r.note, r.created_at,
                   r.kebele_status, r.woreda_status, r.zone_status, r.region_status, r.federal_status,
                   a.full_name AS handled_by_admin 
            FROM requests r 
            JOIN products p ON r.product_id = p.id 
            LEFT JOIN admins a ON r.handled_by_admin_id = a.id 
            WHERE r.farmer_id = ?
            ORDER BY r.created_at DESC
        `, [req.user.id]);

        // Fix the status for each request based on farmer logic
        const correctedRequests = requests.map(request => {
            const correctStatus = determineFarmerStatus(request);
            return {
                ...request,
                status: correctStatus
            };
        });

        res.json(correctedRequests);
    } catch (err) {
        console.error('listMyRequests error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ====== Get single request ======
exports.getRequest = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { id } = req.params;

        const [request] = await db.query(`
            SELECT r.*, p.name as product_name, p.category, p.price, p.description,
                   a.full_name AS handled_by_admin 
            FROM requests r 
            JOIN products p ON r.product_id = p.id 
            LEFT JOIN admins a ON r.handled_by_admin_id = a.id 
            WHERE r.id = ? AND r.farmer_id = ?
        `, [id, req.user.id]);

        if (request.length === 0) {
            return res.status(404).json({ message: 'Request not found or access denied' });
        }

        // Fix the status based on farmer logic
        const requestData = request[0];
        requestData.status = determineFarmerStatus(requestData);

        res.json(requestData);
    } catch (err) {
        console.error('getRequest error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ====== Update my request ======
exports.updateRequest = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { id } = req.params;
        const { quantity, note } = req.body;

        // Validation
        if (quantity !== undefined && quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        // Check if request exists and belongs to farmer
        const [requestRows] = await db.query(
            `SELECT *, kebele_status, woreda_status, zone_status, region_status, federal_status 
             FROM requests WHERE id=? AND farmer_id=?`, [id, req.user.id]
        );

        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Request not found or access denied' });
        }

        const request = requestRows[0];

        // Check if request can be updated (only if all kebele and above statuses are Pending)
        const higherLevelStatuses = [
            request.kebele_status,
            request.woreda_status,
            request.zone_status,
            request.region_status,
            request.federal_status
        ];

        const hasProcessedBeyondFarmer = higherLevelStatuses.some(status => status !== 'Pending');

        if (hasProcessedBeyondFarmer) {
            return res.status(400).json({
                message: 'Cannot update request: It has been processed beyond farmer level'
            });
        }

        // Update the request
        await db.query(
            `UPDATE requests SET 
                quantity = COALESCE(?, quantity),
                note = COALESCE(?, note),
                created_at = CURRENT_TIMESTAMP
             WHERE id = ?`, [quantity, note, id]
        );

        // Get updated request
        const [updatedRequest] = await db.query(`
            SELECT r.*, p.name as product_name, p.category 
            FROM requests r 
            JOIN products p ON r.product_id = p.id 
            WHERE r.id=?
        `, [id]);

        // Fix the status based on farmer logic
        const requestData = updatedRequest[0];
        requestData.status = determineFarmerStatus(requestData);

        res.json({
            message: 'Request updated successfully',
            request: requestData
        });

    } catch (err) {
        console.error('updateRequest error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ====== Delete my request ======
exports.deleteRequest = async(req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        if (!req.user || !req.user.id) {
            await connection.rollback();
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { id } = req.params;

        // Check if request exists and belongs to farmer
        const [requestRows] = await connection.query(
            `SELECT *, kebele_status, woreda_status, zone_status, region_status, federal_status 
             FROM requests WHERE id=? AND farmer_id=?`, [id, req.user.id]
        );

        if (requestRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Request not found or access denied' });
        }

        const request = requestRows[0];

        // Check if request can be deleted (only if all kebele and above statuses are Pending)
        const higherLevelStatuses = [
            request.kebele_status,
            request.woreda_status,
            request.zone_status,
            request.region_status,
            request.federal_status
        ];

        const hasProcessedBeyondFarmer = higherLevelStatuses.some(status => status !== 'Pending');

        if (hasProcessedBeyondFarmer) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Cannot delete request: It has been processed beyond farmer level'
            });
        }

        // Restore the product amount
        await connection.query(
            'UPDATE products SET amount = amount + ? WHERE id = ?', [request.quantity, request.product_id]
        );

        // Delete the request
        await connection.query('DELETE FROM requests WHERE id=?', [id]);

        await connection.commit();

        res.json({ message: 'Request deleted successfully, product quantity restored' });

    } catch (err) {
        await connection.rollback();
        console.error('deleteRequest error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    } finally {
        connection.release();
    }
};

// ====== Get my profile ======
exports.my = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const [rows] = await db.query(`
            SELECT id, full_name, phone_number, region_name, zone_name, 
                   woreda_name, kebele_name, created_at 
            FROM farmers WHERE id = ? LIMIT 1
        `, [req.user.id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Farmer not found' });
        return res.json(rows[0]);
    } catch (err) {
        console.error('my error:', err);
        return res.status(500).json({ message: 'Server error: ' + err.message });
    }
};
// ====== Get all products for farmers ======
exports.getAllProducts = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const [products] = await db.query(`
            SELECT 
                p.*, -- All product columns
                a.full_name as created_by_admin_name,
                a.role as admin_role,
                a.region_name as admin_region,
                a.zone_name as admin_zone,
                a.woreda_name as admin_woreda,
                a.kebele_name as admin_kebele
            FROM products p 
            LEFT JOIN admins a ON p.created_by_admin_id = a.id 
            ORDER BY p.created_at DESC
        `);

        res.json(products);
    } catch (err) {
        console.error('getAllProducts error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ====== Get request status detail ======
exports.getRequestStatusDetail = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { id } = req.params;

        const [request] = await db.query(
            `SELECT r.*, f.full_name AS farmer_name, 
                    kebele_admin.full_name AS kebele_admin_name,
                    woreda_admin.full_name AS woreda_admin_name,
                    zone_admin.full_name AS zone_admin_name,
                    region_admin.full_name AS region_admin_name,
                    federal_admin.full_name AS federal_admin_name,
                    p.name as product_name, p.category as product_category
             FROM requests r
             JOIN farmers f ON r.farmer_id = f.id
             LEFT JOIN admins kebele_admin ON r.kebele_admin_id = kebele_admin.id
             LEFT JOIN admins woreda_admin ON r.woreda_admin_id = woreda_admin.id
             LEFT JOIN admins zone_admin ON r.zone_admin_id = zone_admin.id
             LEFT JOIN admins region_admin ON r.region_admin_id = region_admin.id
             LEFT JOIN admins federal_admin ON r.federal_admin_id = federal_admin.id
             LEFT JOIN products p ON r.product_id = p.id
             WHERE r.id = ? AND r.farmer_id = ?`, [id, req.user.id]
        );

        if (request.length === 0) {
            return res.status(404).json({ message: 'Request not found or access denied' });
        }

        // Fix the status based on farmer logic
        const requestData = request[0];
        requestData.status = determineFarmerStatus(requestData);

        res.json(requestData);
    } catch (err) {
        console.error('getRequestStatusDetail error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ====== Confirm delivery of an accepted request ======
exports.confirmDelivery = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { id } = req.params; // request id
        const { note } = req.body;
        const farmerId = req.user.id;

        // Ensure request belongs to farmer and get full details
        const [rows] = await db.query(
            `SELECT r.*, 
                    kebele_admin.full_name AS kebele_admin_name, r.kebele_admin_id,
                    woreda_admin.full_name AS woreda_admin_name, r.woreda_admin_id,
                    zone_admin.full_name AS zone_admin_name, r.zone_admin_id,
                    region_admin.full_name AS region_admin_name, r.region_admin_id,
                    federal_admin.full_name AS federal_admin_name, r.federal_admin_id
             FROM requests r
             LEFT JOIN admins kebele_admin ON r.kebele_admin_id = kebele_admin.id
             LEFT JOIN admins woreda_admin ON r.woreda_admin_id = woreda_admin.id
             LEFT JOIN admins zone_admin ON r.zone_admin_id = zone_admin.id
             LEFT JOIN admins region_admin ON r.region_admin_id = region_admin.id
             LEFT JOIN admins federal_admin ON r.federal_admin_id = federal_admin.id
             WHERE r.id = ? AND r.farmer_id = ?`, [id, farmerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found or access denied' });
        }

        const request = rows[0];

        // Check if request has been accepted based on farmer logic
        const correctStatus = determineFarmerStatus(request);
        if (correctStatus !== 'Accepted') {
            return res.status(400).json({ message: 'This request has not been accepted at any level' });
        }

        // Determine at what level it was accepted
        let acceptedRole = null;
        let acceptedAdminId = null;
        let acceptedAdminName = null;

        if (request.kebele_status === 'Accepted') {
            acceptedRole = 'Kebele';
            acceptedAdminId = request.kebele_admin_id;
            acceptedAdminName = request.kebele_admin_name;
        } else if (request.woreda_status === 'Accepted') {
            acceptedRole = 'Woreda';
            acceptedAdminId = request.woreda_admin_id;
            acceptedAdminName = request.woreda_admin_name;
        } else if (request.zone_status === 'Accepted') {
            acceptedRole = 'Zone';
            acceptedAdminId = request.zone_admin_id;
            acceptedAdminName = request.zone_admin_name;
        } else if (request.region_status === 'Accepted') {
            acceptedRole = 'Region';
            acceptedAdminId = request.region_admin_id;
            acceptedAdminName = request.region_admin_name;
        } else if (request.federal_status === 'Accepted') {
            acceptedRole = 'Federal';
            acceptedAdminId = request.federal_admin_id;
            acceptedAdminName = request.federal_admin_name;
        }

        // Check if delivery already confirmed
        const [existingDelivery] = await db.query(
            `SELECT id FROM deliveries WHERE request_id = ? AND farmer_id = ? LIMIT 1`, [request.id, farmerId]
        );

        if (existingDelivery.length > 0) {
            return res.status(409).json({ message: 'This delivery is already confirmed' });
        }

        // Insert into deliveries
        await db.query(
            `INSERT INTO deliveries 
             (request_id, farmer_id, product_id, quantity, confirmed, confirmation_date, confirmation_note, 
              accepted_role, accepted_admin_id, accepted_admin_name)
             VALUES (?, ?, ?, ?, 1, NOW(), ?, ?, ?, ?)`, [
                request.id,
                farmerId,
                request.product_id,
                request.quantity,
                note || null,
                acceptedRole,
                acceptedAdminId,
                acceptedAdminName
            ]
        );

        res.json({ message: 'Delivery confirmed successfully' });
    } catch (err) {
        console.error('confirmDelivery error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ====== Get my confirmed deliveries ======
exports.listMyDeliveries = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const [deliveries] = await db.query(
            `SELECT d.id, d.request_id, d.product_id, p.name AS product_name, p.category, p.price,
                    d.quantity, d.confirmed, d.confirmation_date, d.confirmation_note,
                    d.accepted_role, d.accepted_admin_name, d.delivered_at
             FROM deliveries d
             JOIN products p ON d.product_id = p.id
             WHERE d.farmer_id = ?
             ORDER BY d.confirmation_date DESC`, [req.user.id]
        );

        res.json(deliveries);
    } catch (err) {
        console.error('listMyDeliveries error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ====== Check product availability before creating request ======
exports.checkProductAvailability = async(req, res) => {
    try {
        const { product_id, quantity } = req.query;

        if (!product_id || !quantity) {
            return res.status(400).json({
                message: 'Product ID and quantity are required'
            });
        }

        const [productRows] = await db.query(
            'SELECT id, name, amount FROM products WHERE id=?', [product_id]
        );

        if (!productRows.length) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = productRows[0];
        const available = product.amount >= quantity;

        return res.json({
            product_id: product.id,
            product_name: product.name,
            requested_quantity: parseInt(quantity),
            available_quantity: product.amount,
            is_available: available,
            can_proceed: available
        });

    } catch (err) {
        console.error('checkProductAvailability error:', err);
        return res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// Fixed listMyRequestsByStatus function with correct farmer status logic
exports.listMyRequestsByStatus = async(req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const { status } = req.query;

        // Get all requests first
        const [requests] = await db.query(`
            SELECT r.id, r.product_id, p.name as product_name, p.category, p.price,
                   r.quantity, r.status, r.note, r.created_at,
                   r.kebele_status, r.woreda_status, r.zone_status, r.region_status, r.federal_status,
                   a.full_name AS handled_by_admin 
            FROM requests r 
            JOIN products p ON r.product_id = p.id 
            LEFT JOIN admins a ON r.handled_by_admin_id = a.id 
            WHERE r.farmer_id = ?
            ORDER BY r.created_at DESC
        `, [req.user.id]);

        // Apply farmer status logic and filtering
        let filteredRequests = requests;

        if (status && status !== 'all') {
            filteredRequests = requests.filter(request => {
                const correctStatus = determineFarmerStatus(request);
                return correctStatus.toLowerCase() === status.toLowerCase();
            });
        }

        // Fix the status for each request based on farmer logic
        const correctedRequests = filteredRequests.map(request => {
            const correctStatus = determineFarmerStatus(request);
            return {
                ...request,
                status: correctStatus
            };
        });

        res.json(correctedRequests);
    } catch (err) {
        console.error('listMyRequestsByStatus error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};