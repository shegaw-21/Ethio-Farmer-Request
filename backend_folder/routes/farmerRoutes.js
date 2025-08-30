const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const farmerController = require('../controllers/farmerController');

// Farmer login (public)
router.post('/login', farmerController.login);

// Protected routes (require authentication)
router.get('/my', authenticate, farmerController.my);
router.post('/request', authenticate, farmerController.createRequest);
router.get('/requests', authenticate, farmerController.listMyRequests);
router.get('/request/:id', authenticate, farmerController.getRequest); // Get single request
router.put('/request/:id', authenticate, farmerController.updateRequest); // Update request
router.delete('/request/:id', authenticate, farmerController.deleteRequest); // Delete request

// NEW: Get all products for farmers
router.get('/products', authenticate, farmerController.getAllProducts);

router.get('/request/:id/status', authenticate, farmerController.getRequestStatusDetail);
module.exports = router;