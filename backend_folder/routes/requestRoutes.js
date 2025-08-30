// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/authMiddleware');
const requestController = require('../controllers/requestController');

// Farmer routes
router.post('/create', authenticate, requestController.createRequest);
router.get('/my', authenticate, requestController.listMy);

// Admin routes
router.get('/all', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), requestController.listInScope);
router.put('/:id/status', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), requestController.updateStatus);
router.delete('/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), requestController.deleteRejected);

module.exports = router;