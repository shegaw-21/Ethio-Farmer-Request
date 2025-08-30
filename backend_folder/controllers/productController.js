// controllers/productController.js
const db = require('../config/db');

// Create product
exports.createProduct = async(req, res) => {
    try {
        const { name, description, category } = req.body;
        if (!name || !category) {
            return res.status(400).json({ message: 'Name and category are required' });
        }

        await db.query(
            'INSERT INTO products (name, description, category) VALUES (?, ?, ?)', [name, description, category]
        );

        res.status(201).json({ message: 'Product created successfully' });
    } catch (err) {
        console.error('createProduct error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all products
exports.getProducts = async(req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (err) {
        console.error('getProducts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update product
exports.updateProduct = async(req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category } = req.body;

        await db.query(
            'UPDATE products SET name = ?, description = ?, category = ? WHERE id = ?', [name, description, category, id]
        );

        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error('updateProduct error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete product
exports.deleteProduct = async(req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('deleteProduct error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};