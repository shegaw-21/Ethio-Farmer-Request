const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const db = require('./config/db');

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const cors = require('cors');

// Enhanced CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true, // This is crucial for authentication
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Body parser
app.use(bodyParser.json());

// Test DB connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Database connected successfully');
        connection.release();
    }
});

// Routes
const adminRoutes = require('./routes/adminRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const productRoutes = require('./routes/productRoutes');
const requestRoutes = require('./routes/requestRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const auditRoutes = require('./routes/auditRoutes');
const approvalWorkflowRoutes = require('./routes/approvalWorkflowRoutes');


app.use('/api/admins', adminRoutes);
app.use('/api/admins', approvalWorkflowRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/audits', auditRoutes);

// Default 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Database connected successfully');
});