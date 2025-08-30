// File: approvalWorkflowRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');
const approvalWorkflowController = require('../controllers/approvalWorkflowController');

// Admins can see requests with detailed status in their scope
router.get('/requests/status', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalWorkflowController.listRequestsWithStatus);

// Admin updates request status at their level (FIXED: changed from /level to proper endpoint)
router.put('/requests/:id/status', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalWorkflowController.updateRequestStatusAtLevel);
// NEW: Filter requests by status
router.get('/requests/filter', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalWorkflowController.listRequestsByStatus);
router.get('/requests/filter?status=pending', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalWorkflowController.listRequestsByStatus);
router.get('/requests/filter?status=approved', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalWorkflowController.listRequestsByStatus);
router.get('/requests/filter?status=accepted', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalWorkflowController.listRequestsByStatus);
router.get('/requests/filter?status=rejected', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), approvalWorkflowController.listRequestsByStatus);
router.get('/requests/:id/status', authenticate, approvalWorkflowController.getRequestStatusDetail);

module.exports = router;