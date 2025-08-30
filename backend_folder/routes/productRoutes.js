const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRoles } = require('../middlewares/authMiddleware');

// Use the correct function names that exist in adminController:
router.post('/products', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.addProduct);
router.get('/products', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.listProducts); // Changed from listMyProducts
router.put('/products/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.updateProduct); // Changed from updateMyProduct
router.delete('/products/:id', authenticate, requireRoles('Federal', 'Region', 'Zone', 'Woreda', 'Kebele'), adminController.deleteProduct); // Changed from deleteMyProduct

module.exports = router;