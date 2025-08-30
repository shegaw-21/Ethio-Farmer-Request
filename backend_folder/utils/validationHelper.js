const { body } = require('express-validator');

const registerAdminValidation = [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('phone_number').isMobilePhone().withMessage('Valid phone number required'),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    body('role').isIn(['Federal', 'Region', 'Zone', 'Woreda', 'Kebele']).withMessage('Invalid role')
];

const loginValidation = [
    body('phone_number').isMobilePhone().withMessage('Valid phone number required'),
    body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
    registerAdminValidation,
    loginValidation
};