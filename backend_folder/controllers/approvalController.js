const db = require('../config/db');

// List requests in admin scope
exports.listRequests = async(req, res) => {
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
            `SELECT r.id, r.farmer_id, r.product_id, r.product_name, r.quantity, r.status, r.note, r.created_at,
                    f.full_name AS farmer_name, f.phone_number AS farmer_phone,
                    a.full_name AS handled_by_admin, p.amount as product_amount, p.category as product_category
             FROM requests r
             JOIN farmers f ON r.farmer_id = f.id
             LEFT JOIN admins a ON r.handled_by_admin_id = a.id
             LEFT JOIN products p ON r.product_id = p.id
             WHERE ${where}
             ORDER BY r.created_at DESC`,
            params
        );

        res.json(requests);
    } catch (err) {
        console.error('listRequests error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if product is available at admin level
const checkProductAvailability = async(adminRole, productId, adminLocation) => {
    try {
        // For Federal level, all products are considered available
        if (adminRole === 'Federal') return true;

        // For other levels, check if product exists in their scope
        const [products] = await db.query(
            `SELECT * FROM products p
             JOIN admins a ON p.created_by_admin_id = a.id
             WHERE p.id = ? AND a.role = ?`, [productId, adminRole]
        );

        return products.length > 0;
    } catch (error) {
        console.error('checkProductAvailability error:', error);
        return false;
    }
};

// Check if request is supported (basic validation)
const isRequestSupported = (request) => {
    // Basic validation - you can expand this with more complex logic
    if (!request.quantity || request.quantity <= 0) return false;
    if (!request.product_id) return false;
    return true;
};

// Update request status with intelligent decision making
exports.updateRequestStatus = async(req, res) => {
    try {
        const admin = req.user;
        const { id } = req.params;
        const { status, decisionReason } = req.body;

        if (!['pending', 'accepted', 'rejected', 'approved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        // Get request details
        const [rows] = await db.query(
            `SELECT r.*, f.region_name, f.zone_name, f.woreda_name, f.kebele_name 
             FROM requests r 
             JOIN farmers f ON r.farmer_id = f.id 
             WHERE r.id=?`, [id]
        );

        if (!rows.length) return res.status(404).json({ message: 'Request not found' });

        const request = rows[0];

        // Check scope permissions
        const hasPermission = (
            (admin.role === 'Region' && request.region_name === admin.region_name) ||
            (admin.role === 'Zone' && request.zone_name === admin.zone_name) ||
            (admin.role === 'Woreda' && request.woreda_name === admin.woreda_name) ||
            (admin.role === 'Kebele' && request.kebele_name === admin.kebele_name) ||
            admin.role === 'Federal'
        );

        if (!hasPermission) {
            return res.status(403).json({ message: 'Request is outside your scope' });
        }

        // Determine final status based on intelligent rules
        let finalStatus = status;

        if (status === 'approved') {
            // Check if request is supported and product is available
            const isSupported = isRequestSupported(request);
            const isAvailable = await checkProductAvailability(admin.role, request.product_id, admin);

            if (isSupported && isAvailable) {
                finalStatus = 'accepted';
            } else if (isSupported && !isAvailable) {
                finalStatus = 'approved'; // Approved but product not available at this level
            } else {
                finalStatus = 'rejected';
            }
        }

        // Update request status
        await db.query(
            'UPDATE requests SET status=?, handled_by_admin_id=?, decision_reason=?, updated_at=NOW() WHERE id=?', [finalStatus, admin.id, decisionReason || '', id]
        );

        // Get updated request with details
        const [updatedRequest] = await db.query(
            `SELECT r.*, f.full_name AS farmer_name, a.full_name AS handled_by_admin,
                    p.name as product_name, p.category as product_category
             FROM requests r
             JOIN farmers f ON r.farmer_id = f.id
             LEFT JOIN admins a ON r.handled_by_admin_id = a.id
             LEFT JOIN products p ON r.product_id = p.id
             WHERE r.id=?`, [id]
        );

        res.json({
            message: `Request ${finalStatus} successfully`,
            request: updatedRequest[0]
        });

    } catch (err) {
        console.error('updateRequestStatus error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Bulk update requests based on intelligent rules
exports.bulkUpdateRequests = async(req, res) => {
    try {
        const admin = req.user;
        const { requestIds, action } = req.body;

        if (!['accept', 'reject', 'approve'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        if (!Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({ message: 'No requests selected' });
        }

        const results = [];

        for (const requestId of requestIds) {
            try {
                // Get request details
                const [rows] = await db.query(
                    `SELECT r.*, f.region_name, f.zone_name, f.woreda_name, f.kebele_name 
                     FROM requests r 
                     JOIN farmers f ON r.farmer_id = f.id 
                     WHERE r.id=?`, [requestId]
                );

                if (rows.length && rows[0].status === 'pending') {
                    const request = rows[0];

                    // Check scope permissions
                    const hasPermission = (
                        (admin.role === 'Region' && request.region_name === admin.region_name) ||
                        (admin.role === 'Zone' && request.zone_name === admin.zone_name) ||
                        (admin.role === 'Woreda' && request.woreda_name === admin.woreda_name) ||
                        (admin.role === 'Kebele' && request.kebele_name === admin.kebele_name) ||
                        admin.role === 'Federal'
                    );

                    if (hasPermission) {
                        let finalStatus = action === 'accept' ? 'accepted' :
                            action === 'reject' ? 'rejected' : 'approved';

                        if (action === 'approve') {
                            const isSupported = isRequestSupported(request);
                            const isAvailable = await checkProductAvailability(admin.role, request.product_id, admin);

                            if (isSupported && isAvailable) {
                                finalStatus = 'accepted';
                            } else if (isSupported && !isAvailable) {
                                finalStatus = 'approved';
                            } else {
                                finalStatus = 'rejected';
                            }
                        }

                        await db.query(
                            'UPDATE requests SET status=?, handled_by_admin_id=?, updated_at=NOW() WHERE id=?', [finalStatus, admin.id, requestId]
                        );

                        results.push({ id: requestId, status: finalStatus, success: true });
                    } else {
                        results.push({ id: requestId, success: false, error: 'Outside scope' });
                    }
                } else {
                    results.push({ id: requestId, success: false, error: 'Not found or not pending' });
                }
            } catch (error) {
                results.push({ id: requestId, success: false, error: error.message });
            }
        }

        res.json({
            message: 'Bulk update completed',
            results
        });

    } catch (err) {
        console.error('bulkUpdateRequests error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};