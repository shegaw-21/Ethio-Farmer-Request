const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { rateLimitMiddleware } = require('../middlewares/rateLimitMiddleware');
const farmerController = require('../controllers/farmerController');

// Farmer login (public) with rate limiting
router.post('/login', rateLimitMiddleware, farmerController.login);

// Protected routes (require authentication)
router.get('/my', authenticate, farmerController.my);
router.post('/request', authenticate, farmerController.createRequest);
router.get('/requests', authenticate, farmerController.listMyRequests);
router.get('/request/:id', authenticate, farmerController.getRequest);
router.put('/request/:id', authenticate, farmerController.updateRequest);
router.delete('/request/:id', authenticate, farmerController.deleteRequest);

// Products
router.get('/products', authenticate, farmerController.getAllProducts);

// Request status details
router.get('/request/:id/status', authenticate, farmerController.getRequestStatusDetail);

// Delivery confirmation - FIXED: Added authenticate middleware
router.post('/requests/:id/confirm-delivery', authenticate, farmerController.confirmDelivery);
router.get('/deliveries', authenticate, farmerController.listMyDeliveries);
// Add this route
router.get('/check_availability', authenticate, farmerController.checkProductAvailability);
// Add this route
router.get('/requests/filter', authenticate, farmerController.listMyRequestsByStatus);
module.exports = router;