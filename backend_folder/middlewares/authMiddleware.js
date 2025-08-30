// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Authenticate any logged-in user
exports.authenticate = async(req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ message: 'No token provided' });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Token missing' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
        req.user = decoded; // attach decoded info to req.user
        next();
    } catch (err) {
        console.error('authenticate error:', err);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Authorize roles (pass one or more roles)
exports.requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: insufficient role' });
        }
        next();
    };
};