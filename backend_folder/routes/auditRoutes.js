const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

// Only admins can view audit logs
router.get(
    '/logs',
    authenticate,
    requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'),
    auditController.listLogs
);

module.exports = router;