// File: approvalWorkflowController.js
const db = require('../config/db');

// Constants
const RANK = { Federal: 5, Region: 4, Zone: 3, Woreda: 2, Kebele: 1 };

// Helper function to determine overall status based on level statuses
const determineOverallStatus = (request) => {
    const { kebele_status, woreda_status, zone_status, region_status, federal_status } = request;

    // If any level has rejected, overall is rejected
    if (kebele_status === 'Rejected' || woreda_status === 'Rejected' ||
        zone_status === 'Rejected' || region_status === 'Rejected' || federal_status === 'Rejected') {
        return 'Rejected';
    }

    // If any level has accepted, overall is accepted (product is available at that level)
    if (kebele_status === 'Accepted') return 'Accepted';
    if (woreda_status === 'Accepted') return 'Accepted';
    if (zone_status === 'Accepted') return 'Accepted';
    if (region_status === 'Accepted') return 'Accepted';
    if (federal_status === 'Accepted') return 'Accepted';

    // Check for approval at each level
    if (federal_status === 'Approved') return 'Approved';
    if (region_status === 'Approved') return 'Approved';
    if (zone_status === 'Approved') return 'Approved';
    if (woreda_status === 'Approved') return 'Approved';
    if (kebele_status === 'Approved') return 'Approved';

    return 'Pending';
};

// NEW: Helper function to check if admin can modify a request at their level
function canAdminModifyRequestAtLevel(admin, request) {
    const adminRole = admin.role;

    // Federal admin can modify any request
    if (adminRole === 'Federal') return true;

    // Check the status at the admin's level and lower levels
    switch (adminRole) {
        case 'Region':
            // Region admin can only modify if zone has approved and region is pending
            return request.zone_status === 'Approved' &&
                request.region_status === 'Pending';

        case 'Zone':
            // Zone admin can only modify if woreda has approved and zone is pending
            return request.woreda_status === 'Approved' &&
                request.zone_status === 'Pending';

        case 'Woreda':
            // Woreda admin can only modify if kebele has approved and woreda is pending
            return request.kebele_status === 'Approved' &&
                request.woreda_status === 'Pending';

        case 'Kebele':
            // Kebele admin can modify any request in their scope that's pending at their level
            return request.kebele_status === 'Pending';

        default:
            return false;
    }
}

exports.updateRequestStatusAtLevel = async(req, res) => {
    try {
        const admin = req.user;
        const { id } = req.params;
        const { status, feedback } = req.body;

        if (!['Pending', 'Approved', 'Rejected', 'Accepted'].includes(status)) {
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
            (admin.role === 'Kebele' && request.kebele_name === admin.kebele_name) ||
            (admin.role === 'Woreda' && request.woreda_name === admin.woreda_name) ||
            (admin.role === 'Zone' && request.zone_name === admin.zone_name) ||
            (admin.role === 'Region' && request.region_name === admin.region_name) ||
            admin.role === 'Federal'
        );

        if (!hasPermission) {
            return res.status(403).json({ message: 'Request is outside your scope' });
        }

        // NEW: Check if admin can modify this request based on workflow
        if (!canAdminModifyRequestAtLevel(admin, request)) {
            return res.status(403).json({
                message: 'You can only modify requests that are pending at your level and have been approved by lower levels'
            });
        }

        // Prepare update based on admin role
        let updateField = '';
        let adminIdField = '';
        let timestampField = '';
        let feedbackField = '';

        switch (admin.role) {
            case 'Kebele':
                updateField = 'kebele_status';
                adminIdField = 'kebele_admin_id';
                timestampField = 'kebele_approved_at';
                feedbackField = 'kebele_feedback';
                break;
            case 'Woreda':
                updateField = 'woreda_status';
                adminIdField = 'woreda_admin_id';
                timestampField = 'woreda_approved_at';
                feedbackField = 'woreda_feedback';
                break;
            case 'Zone':
                updateField = 'zone_status';
                adminIdField = 'zone_admin_id';
                timestampField = 'zone_approved_at';
                feedbackField = 'zone_feedback';
                break;
            case 'Region':
                updateField = 'region_status';
                adminIdField = 'region_admin_id';
                timestampField = 'region_approved_at';
                feedbackField = 'region_feedback';
                break;
            case 'Federal':
                updateField = 'federal_status';
                adminIdField = 'federal_admin_id';
                timestampField = 'federal_approved_at';
                feedbackField = 'federal_feedback';
                break;
            default:
                return res.status(403).json({ message: 'Invalid role for approval' });
        }

        // Create updated request object for status determination
        const updatedRequest = {...request, [updateField]: status };
        const overallStatus = determineOverallStatus(updatedRequest);

        // Update the specific level status
        await db.query(
            `UPDATE requests SET 
                ${updateField} = ?,
                ${adminIdField} = ?,
                ${timestampField} = NOW(),
                ${feedbackField} = ?,
                status = ?
             WHERE id = ?`, [status, admin.id, feedback || '', overallStatus, id]
        );

        // Get updated request with details
        const [updatedRequestRows] = await db.query(
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
             WHERE r.id=?`, [id]
        );

        res.json({
            message: `Request ${status} at ${admin.role} level`,
            request: updatedRequestRows[0]
        });

    } catch (err) {
        console.error('updateRequestStatusAtLevel error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};
// NEW: Filter requests by status with proper status mapping
exports.listRequestsByStatus = async(req, res) => {
    try {
        const admin = req.user;
        const { status } = req.query; // Get status from query params

        let where = '1=1';
        const params = [];

        // Apply scope filtering based on admin role
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

        // Apply status filtering if provided
        if (status && status !== 'all') {
            // Map query status to database status values
            let dbStatus = status;
            if (status === 'accepted') dbStatus = 'Accepted';
            if (status === 'approved') dbStatus = 'Approved';
            if (status === 'rejected') dbStatus = 'Rejected';
            if (status === 'pending') dbStatus = 'Pending';

            where += ' AND r.status = ?';
            params.push(dbStatus);
        }

        const [requests] = await db.query(
            `SELECT r.id, r.farmer_id, r.product_id, r.quantity, r.status, 
                    r.kebele_status, r.woreda_status, r.zone_status, r.region_status, r.federal_status,
                    r.kebele_feedback, r.woreda_feedback, r.zone_feedback, r.region_feedback, r.federal_feedback,
                    r.kebele_approved_at, r.woreda_approved_at, r.zone_approved_at, r.region_approved_at, r.federal_approved_at,
                    r.region_name, r.zone_name, r.woreda_name, r.kebele_name,
                    f.full_name AS farmer_name, f.phone_number AS farmer_phone,
                    kebele_admin.full_name AS kebele_admin_name,
                    woreda_admin.full_name AS woreda_admin_name,
                    zone_admin.full_name AS zone_admin_name,
                    region_admin.full_name AS region_admin_name,
                    federal_admin.full_name AS federal_admin_name,
                    p.name as product_name, p.category as product_category, p.amount as product_amount
             FROM requests r
             JOIN farmers f ON r.farmer_id = f.id
             LEFT JOIN admins kebele_admin ON r.kebele_admin_id = kebele_admin.id
             LEFT JOIN admins woreda_admin ON r.woreda_admin_id = woreda_admin.id
             LEFT JOIN admins zone_admin ON r.zone_admin_id = zone_admin.id
             LEFT JOIN admins region_admin ON r.region_admin_id = region_admin.id
             LEFT JOIN admins federal_admin ON r.federal_admin_id = federal_admin.id
             LEFT JOIN products p ON r.product_id = p.id
             WHERE ${where}
             ORDER BY r.created_at DESC`,
            params
        );

        res.json(requests);
    } catch (err) {
        console.error('listRequestsByStatus error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};
exports.getRequestStatusDetail = async(req, res) => {
    try {
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
             WHERE r.id = ?`, [id] // Removed farmer_id check for admin access
        );

        if (request.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json(request[0]);
    } catch (err) {
        console.error('getRequestStatusDetail error:', err);

        return res.status(500).json({
            message: 'Server error: ' + err.message,
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};
exports.listRequestsWithStatus = async(req, res) => {
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
            `SELECT r.id, r.farmer_id, r.product_id, r.quantity, r.status, 
                    r.kebele_status, r.woreda_status, r.zone_status, r.region_status, r.federal_status,
                    r.kebele_feedback, r.woreda_feedback, r.zone_feedback, r.region_feedback, r.federal_feedback,
                    r.kebele_approved_at, r.woreda_approved_at, r.zone_approved_at, r.region_approved_at, r.federal_approved_at,
                    r.region_name, r.zone_name, r.woreda_name, r.kebele_name,
                    f.full_name AS farmer_name, f.phone_number AS farmer_phone,
                    kebele_admin.full_name AS kebele_admin_name,
                    woreda_admin.full_name AS woreda_admin_name,
                    zone_admin.full_name AS zone_admin_name,
                    region_admin.full_name AS region_admin_name,
                    federal_admin.full_name AS federal_admin_name,
                    p.name as product_name, p.category as product_category, p.amount as product_amount
             FROM requests r
             JOIN farmers f ON r.farmer_id = f.id
             LEFT JOIN admins kebele_admin ON r.kebele_admin_id = kebele_admin.id
             LEFT JOIN admins woreda_admin ON r.woreda_admin_id = woreda_admin.id
             LEFT JOIN admins zone_admin ON r.zone_admin_id = zone_admin.id
             LEFT JOIN admins region_admin ON r.region_admin_id = region_admin.id
             LEFT JOIN admins federal_admin ON r.federal_admin_id = federal_admin.id
             LEFT JOIN products p ON r.product_id = p.id
             WHERE ${where}
             ORDER BY r.created_at DESC`,
            params
        );

        res.json(requests);
    } catch (err) {
        console.error('listRequestsWithStatus error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};