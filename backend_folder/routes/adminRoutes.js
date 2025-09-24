const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');

const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

// Admin Authentication Routes with rate limiting
router.post('/login', rateLimitMiddleware, adminController.login);
router.get('/me', authenticate, adminController.me);

// Admin Management Routes
router.post('/register', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda'), adminController.createLowerAdmin);
router.get('/admins', authenticate, adminController.listInScope);
router.put('/edit/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.updateLowerAdmin);
router.post('/createfarmer', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.createLowerAdmin);

// Product Management Routes
router.post('/addproduct', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.addProduct);
router.get('/getproducts', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listProducts);
router.get('/myproducts', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listMyProducts);
router.put('/editproduct/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.updateProduct);
router.delete('/deleteproduct/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.deleteProduct);
router.get('/otherproducts', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listOtherAdminsProducts);

// Request Management Routes// NEW: Kebele admin specific routes for managing farmers

router.get('/getrequests', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listRequests);
router.put('/editrequest/:id/status', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.updateRequestStatus);
router.delete('/deleterequest/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.deleteRejectedRequest);
// Federal admin profile update route
router.put('/profile', authenticate, requireRoles('Federal'), adminController.updateFederalProfile);
router.get('/farmers', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listFarmersInScope);
// Approval Workflow Routes - FIXED MOUNTING// Add this line to adminRoutes.js
router.use('/', require('./approvalWorkflowRoutes'));
router.put('/farmers/:id/profile', authenticate, requireRoles('Kebele'), adminController.updateFarmerProfile);
router.post('/reports', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.createReport);
router.get('/reports/my', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.getMyReports);
router.get('/reports', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.getReportsInScope);
router.put('/reports/:id/status', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda'), adminController.updateReportStatus);
router.get('/reports/statistics', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.getReportStatistics);

module.exports = router;