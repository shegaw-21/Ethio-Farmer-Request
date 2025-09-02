const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

// Admin Authentication Routes
router.post('/login', adminController.login);
router.get('/me', authenticate, adminController.me);

// Admin Management Routes
router.post('/register', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda'), adminController.createLowerAdmin);
router.get('/admins', authenticate, adminController.listInScope);
router.put('/edit/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.updateLowerAdmin);
router.delete('/delete/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.deleteLowerAdmin);
router.post('/createfarmer', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.createLowerAdmin);

// Product Management Routes
router.post('/addproduct', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.addProduct);
router.get('/getproducts', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listProducts);
router.get('/myproducts', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listMyProducts);
router.put('/editproduct/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.updateProduct);
router.delete('/deleteproduct/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.deleteProduct);
router.get('/otherproducts', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listOtherAdminsProducts);

// Request Management Routes// NEW: Kebele admin specific routes for managing farmers
router.put('/kebele/farmer/:id', authenticate, requireRoles('Kebele'), adminController.updateKebeleFarmer);
router.delete('/kebele/farmer/:id', authenticate, requireRoles('Kebele'), adminController.deleteKebeleFarmer);

router.get('/getrequests', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listRequests);
router.put('/editrequest/:id/status', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.updateRequestStatus);
router.delete('/deleterequest/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.deleteRejectedRequest);
// Federal admin profile update route
router.put('/profile', authenticate, requireRoles('Federal'), adminController.updateFederalProfile);
// Approval Workflow Routes - FIXED MOUNTING
router.use('/', require('./approvalWorkflowRoutes'));

module.exports = router;