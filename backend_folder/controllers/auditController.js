const db = require('../config/db');

const RANK = { Federal: 5, Region: 4, Zone: 3, Woreda: 2, Kebele: 1 };

function inScopeFilter(user) {
    if (user.role === 'Federal') return { where: '1=1', params: [] };
    if (user.role === 'Region') return { where: 'region_name=?', params: [user.region_name] };
    if (user.role === 'Zone') return { where: 'zone_name=?', params: [user.zone_name] };
    if (user.role === 'Woreda') return { where: 'woreda_name=?', params: [user.woreda_name] };
    if (user.role === 'Kebele') return { where: 'kebele_name=?', params: [user.kebele_name] };
    return { where: '0', params: [] };
}

// GET /api/audit/logs
exports.listLogs = async(req, res) => {
    try {
        if (!RANK[req.user.role]) {
            return res.status(403).json({ message: 'Only admins can view audit logs' });
        }

        const { where, params } = inScopeFilter(req.user);

        const [rows] = await db.query(
            `SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC`,
            params
        );

        return res.json(rows);
    } catch (err) {
        console.error('listLogs error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};