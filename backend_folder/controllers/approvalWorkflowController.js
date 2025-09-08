// File: approvalWorkflowController.js - UPDATED determineOverallStatus function
const db = require('../config/db');

// Constants
const RANK = { Federal: 5, Region: 4, Zone: 3, Woreda: 2, Kebele: 1 };

// Helper function to determine status based on admin role
const determineStatusForAdmin = (request, adminRole) => {
    switch (adminRole) {
        case 'Kebele':
            return request.kebele_status || 'Pending';
        case 'Woreda':
            return request.woreda_status || 'Pending';
        case 'Zone':
            return request.zone_status || 'Pending';
        case 'Region':
            return request.region_status || 'Pending';
        case 'Federal':
            return request.federal_status || 'Pending';
        default:
            // For farmers or unknown roles, use the original logic
            return determineOverallStatus(request);
    }
};

// Original helper function to determine detailed status based on level statuses
const determineOverallStatus = (request) => {
    const {
        kebele_status,
        woreda_status,
        zone_status,
        region_status,
        federal_status
    } = request;

    // Get all statuses in order of hierarchy
    const statuses = [
        { level: 'kebele', status: kebele_status },
        { level: 'woreda', status: woreda_status },
        { level: 'zone', status: zone_status },
        { level: 'region', status: region_status },
        { level: 'federal', status: federal_status }
    ];

    // Check if all statuses are Pending
    if (statuses.every(s => s.status === 'Pending')) {
        return 'Pending for all';
    }

    // Check if any level has rejected
    const rejectedLevel = statuses.find(s => s.status === 'Rejected');
    if (rejectedLevel) {
        const approvedLevels = statuses
            .filter(s => s.status === 'Approved' && RANK[s.level] < RANK[rejectedLevel.level])
            .map(s => s.level);

        const pendingLevels = statuses
            .filter(s => s.status === 'Pending' && RANK[s.level] > RANK[rejectedLevel.level])
            .map(s => s.level);

        let statusText = '';
        if (approvedLevels.length > 0) {
            statusText += `approved for (${approvedLevels.join(', ')}) `;
        }
        statusText += `rejected for ${rejectedLevel.level}`;
        if (pendingLevels.length > 0) {
            statusText += ` and pending for ${pendingLevels.join(', ')}`;
        }

        return statusText;
    }

    // Check if any level has accepted
    const acceptedLevel = statuses.find(s => s.status === 'Accepted');
    if (acceptedLevel) {
        const approvedLevels = statuses
            .filter(s => s.status === 'Approved' && RANK[s.level] < RANK[acceptedLevel.level])
            .map(s => s.level);

        const pendingLevels = statuses
            .filter(s => s.status === 'Pending' && RANK[s.level] > RANK[acceptedLevel.level])
            .map(s => s.level);

        let statusText = `Accepted for ${acceptedLevel.level}`;
        if (approvedLevels.length > 0) {
            statusText += `, approved for (${approvedLevels.join(', ')})`;
        }
        if (pendingLevels.length > 0) {
            statusText += `, pending for ${pendingLevels.join(', ')}`;
        }

        return statusText;
    }

    // Check for approval at any level
    const approvedLevels = statuses.filter(s => s.status === 'Approved');
    if (approvedLevels.length > 0) {
        const highestApprovedLevel = Math.max(...approvedLevels.map(al => RANK[al.level]));
        const pendingLevels = statuses
            .filter(s => s.status === 'Pending' && RANK[s.level] > highestApprovedLevel)
            .map(s => s.level);

        let statusText = `Approved for (${approvedLevels.map(al => al.level).join(', ')})`;
        if (pendingLevels.length > 0) {
            statusText += ` but pending for ${pendingLevels.join(', ')}`;
        }

        return statusText;
    }

    // If all levels are pending (should be caught by first condition, but just in case)
    return 'Pending for all';
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

        // Use the role-specific status for the response
        const statusForAdmin = determineStatusForAdmin(updatedRequest, admin.role);

        // Update the specific level status
        await db.query(
            `UPDATE requests SET 
          ${updateField} = ?,
          ${adminIdField} = ?,
          ${timestampField} = NOW(),
          ${feedbackField} = ?,
          status = ?
       WHERE id = ?`, [status, admin.id, feedback || '', statusForAdmin, id]
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

// File: approvalWorkflowController.js - UPDATED listRequestsByStatus function
exports.listRequestsByStatus = async(req, res) => {
    try {
        const user = req.user;
        const { status } = req.query;

        let where = '1=1';
        const params = [];

        // Handle farmer vs admin differently
        if (user.role === 'Farmer') {
            // Farmer can only see their own requests
            where = 'r.farmer_id=?';
            params.push(user.id);

            // Farmer-specific status filtering
            if (status && status !== 'all') {
                if (status === 'pending') {
                    // Pending: all levels are pending
                    where += ' AND r.kebele_status = "Pending" AND r.woreda_status = "Pending" AND r.zone_status = "Pending" AND r.region_status = "Pending" AND r.federal_status = "Pending"';
                } else if (status === 'accepted') {
                    // Accepted: accepted at any level
                    where += ' AND (r.kebele_status = "Accepted" OR r.woreda_status = "Accepted" OR r.zone_status = "Accepted" OR r.region_status = "Accepted" OR r.federal_status = "Accepted")';
                } else if (status === 'rejected') {
                    // Rejected: rejected at any level
                    where += ' AND (r.kebele_status = "Rejected" OR r.woreda_status = "Rejected" OR r.zone_status = "Rejected" OR r.region_status = "Rejected" OR r.federal_status = "Rejected")';
                } else if (status === 'approved') {
                    // Approved: has approvals but no accept/reject
                    where += ' AND r.kebele_status != "Accepted" AND r.woreda_status != "Accepted" AND r.zone_status != "Accepted" AND r.region_status != "Accepted" AND r.federal_status != "Accepted"';
                    where += ' AND r.kebele_status != "Rejected" AND r.woreda_status != "Rejected" AND r.zone_status != "Rejected" AND r.region_status != "Rejected" AND r.federal_status != "Rejected"';
                    where += ' AND (r.kebele_status = "Approved" OR r.woreda_status = "Approved" OR r.zone_status = "Approved" OR r.region_status = "Approved" OR r.federal_status = "Approved")';
                }
            }
        } else {
            // Admin-specific filtering with scope
            if (user.role === 'Region') {
                where = 'r.region_name=?';
                params.push(user.region_name);
            } else if (user.role === 'Zone') {
                where = 'r.zone_name=?';
                params.push(user.zone_name);
            } else if (user.role === 'Woreda') {
                where = 'r.woreda_name=?';
                params.push(user.woreda_name);
            } else if (user.role === 'Kebele') {
                where = 'r.kebele_name=?';
                params.push(user.kebele_name);
            }

            // Admin-specific status filtering based on their level
            if (status && status !== 'all') {
                let statusCondition = '';

                switch (status) {
                    case 'pending':
                        // Pending: requests that have any status below this role level
                        statusCondition = `${getAdminLevelField(user.role)} = "Pending"`;
                        break;
                    case 'accepted':
                        // Accepted: requests accepted by only this level
                        statusCondition = `${getAdminLevelField(user.role)} = "Accepted"`;
                        break;
                    case 'rejected':
                        // Rejected: requests rejected by only this level
                        statusCondition = `${getAdminLevelField(user.role)} = "Rejected"`;
                        break;
                    case 'approved':
                        // Approved: requests approved by this level
                        statusCondition = `${getAdminLevelField(user.role)} = "Approved"`;
                        break;
                }

                if (statusCondition) {
                    where += ` AND ${statusCondition}`;
                }
            }
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

        // For admins, update the status field to show their level-specific status
        if (user.role !== 'Farmer') {
            requests.forEach(request => {
                request.status = determineStatusForAdmin(request, user.role);
            });
        }

        res.json(requests);
    } catch (err) {
        console.error('listRequestsByStatus error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// Helper function to get the appropriate status field for an admin role
function getAdminLevelField(role) {
    switch (role) {
        case 'Kebele':
            return 'r.kebele_status';
        case 'Woreda':
            return 'r.woreda_status';
        case 'Zone':
            return 'r.zone_status';
        case 'Region':
            return 'r.region_status';
        case 'Federal':
            return 'r.federal_status';
        default:
            return 'r.kebele_status';
    }
}

exports.getRequestStatusDetail = async(req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

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
       WHERE r.id = ?`, [id]
        );

        if (request.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Update the status to show the role-specific status
        if (user.role !== 'Farmer') {
            request[0].status = determineStatusForAdmin(request[0], user.role);
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

        // Update the status to show the role-specific status
        requests.forEach(request => {
            request.status = determineStatusForAdmin(request, admin.role);
        });

        res.json(requests);
    } catch (err) {
        console.error('listRequestsWithStatus error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};