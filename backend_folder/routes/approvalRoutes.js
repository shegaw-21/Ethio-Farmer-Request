const express = require('express');
const router = express.Router();
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');
const approvalController = require('../controllers/approvalController');

// Admins can see requests in their scope
router.get('/requests', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalController.listRequests);

// Admin updates request status with intelligent decision making
router.put('/requests/:id/status', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalController.updateRequestStatus);

// Bulk update requests
router.post('/requests/bulk-update', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalController.bulkUpdateRequests);

module.exports = router;