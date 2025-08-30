// controllers/requestController.js
const db = require('../config/db');

const RANK = { Federal: 5, Region: 4, Zone: 3, Woreda: 2, Kebele: 1 };

function inScopeFilter(user) {
    // Returns { where, params } to filter by user scope
    if (user.role === 'Federal') return { where: '1=1', params: [] };
    if (user.role === 'Region') return { where: 'region_name=?', params: [user.region_name] };
    if (user.role === 'Zone') return { where: 'zone_name=?', params: [user.zone_name] };
    if (user.role === 'Woreda') return { where: 'woreda_name=?', params: [user.woreda_name] };
    if (user.role === 'Kebele') return { where: 'kebele_name=?', params: [user.kebele_name] };
    return { where: '0', params: [] };
}

// POST /api/requests  (Farmer only)
exports.createRequest = async(req, res) => {
    try {
        if (req.user.role !== 'Farmer') {
            return res.status(403).json({ message: 'Only farmers can create requests' });
        }

        const { product_id, quantity = 1, note } = req.body;
        if (!product_id) return res.status(400).json({ message: 'product_id is required' });

        // load farmer (from token id)
        const [farmerRows] = await db.query(`SELECT * FROM farmers WHERE id=? LIMIT 1`, [req.user.id]);
        if (!farmerRows.length) return res.status(404).json({ message: 'Farmer not found' });
        const f = farmerRows[0];

        const [r] = await db.query(
            `INSERT INTO requests (farmer_id, product_id, quantity, note,
        region_name, zone_name, woreda_name, kebele_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`, [f.id, product_id, quantity, note || null, f.region_name, f.zone_name, f.woreda_name, f.kebele_name]
        );
        const [saved] = await db.query(`SELECT * FROM requests WHERE id=?`, [r.insertId]);
        return res.status(201).json({ message: 'Request created', request: saved[0] });
    } catch (err) {
        console.error('createRequest error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/requests (Admins only; scoped)
exports.listInScope = async(req, res) => {
    try {
        if (!RANK[req.user.role]) {
            return res.status(403).json({ message: 'Only admins can view scoped requests' });
        }
        const { where, params } = inScopeFilter(req.user);
        const [rows] = await db.query(
            `SELECT r.*, p.name AS product_name, f.full_name AS farmer_name, f.phone_number AS farmer_phone
       FROM requests r
       JOIN products p ON p.id = r.product_id
       JOIN farmers f ON f.id = r.farmer_id
       WHERE ${where}
       ORDER BY r.created_at DESC`,
            params
        );
        return res.json(rows);
    } catch (err) {
        console.error('listInScope error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/requests/my (Farmer sees own)
exports.listMy = async(req, res) => {
    try {
        if (req.user.role !== 'Farmer') {
            return res.status(403).json({ message: 'Only farmers can view their requests' });
        }
        const [rows] = await db.query(
            `SELECT r.*, p.name AS product_name
       FROM requests r
       JOIN products p ON p.id = r.product_id
       WHERE r.farmer_id = ?
       ORDER BY r.created_at DESC`, [req.user.id]
        );
        return res.json(rows);
    } catch (err) {
        console.error('listMy error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/requests/:id/status  (Admins only)
exports.updateStatus = async(req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'Accept' | 'Approve' | 'Reject'
        const valid = ['Accept', 'Approve', 'Reject'];
        if (!valid.includes(action)) {
            return res.status(400).json({ message: "action must be one of 'Accept' | 'Approve' | 'Reject'" });
        }
        if (!RANK[req.user.role]) {
            return res.status(403).json({ message: 'Only admins can update request status' });
        }

        // load request
        const [rows] = await db.query(`SELECT * FROM requests WHERE id=?`, [id]);
        if (!rows.length) return res.status(404).json({ message: 'Request not found' });
        const r = rows[0];

        // scope guard
        const { where, params } = inScopeFilter(req.user);
        const [inScope] = await db.query(
            `SELECT id FROM requests WHERE id=? AND ${where} LIMIT 1`, [id, ...params]
        );
        if (!inScope.length) return res.status(403).json({ message: 'Request is outside your scope' });

        const statusMap = { Accept: 'Accepted', Approve: 'Approved', Reject: 'Rejected' };
        const newStatus = statusMap[action];

        await db.query(
            `UPDATE requests SET status=?, decided_by_admin_id=?, decided_by_admin_role=?, decided_at=NOW() WHERE id=?`, [newStatus, req.user.id, req.user.role, id]
        );
        const [updated] = await db.query(`SELECT * FROM requests WHERE id=?`, [id]);
        return res.json({ message: `Request ${newStatus}`, request: updated[0] });
    } catch (err) {
        console.error('updateStatus error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/requests/:id (Admins only; only if Rejected)
exports.deleteRejected = async(req, res) => {
    try {
        if (!RANK[req.user.role]) {
            return res.status(403).json({ message: 'Only admins can delete requests' });
        }
        const { id } = req.params;

        // must be rejected & in scope
        const { where, params } = inScopeFilter(req.user);
        const [rows] = await db.query(
            `SELECT id FROM requests WHERE id=? AND status='Rejected' AND ${where} LIMIT 1`, [id, ...params]
        );
        if (!rows.length) {
            return res.status(400).json({ message: 'Only rejected requests in your scope can be deleted' });
        }

        await db.query(`DELETE FROM requests WHERE id=?`, [id]);
        return res.json({ message: 'Request deleted' });
    } catch (err) {
        console.error('deleteRejected error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};