const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

const registrationValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 }).withMessage('Password must be at least 8 characters and include uppercase, lowercase, and a number'),
  body('tenantId').trim().notEmpty().withMessage('Tenant ID is required').isLength({ max: 100 }).withMessage('Tenant ID must be at most 100 characters'),
  validateRequest
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

router.post('/register', registrationValidation, authController.register);
router.post('/login', loginValidation, authController.login);

module.exports = router;
