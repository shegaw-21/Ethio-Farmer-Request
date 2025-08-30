const AuditLog = require('../models/AuditLog');

const logAction = async(userId, action, details) => {
    try {
        await AuditLog.create({
            user_id: userId,
            action,
            details
        });
    } catch (err) {
        console.error('Audit log failed:', err.message);
    }
};

module.exports = logAction;