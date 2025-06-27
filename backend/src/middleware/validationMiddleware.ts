import { body } from 'express-validator';

// Validation rules for user registration
export const registerValidation = [
  body('userId')
    .notEmpty().withMessage('User id is required')
    .isLength({ min: 3 }).withMessage('User id must be at least 3 characters long')
    .trim(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Validation rules for user login
export const loginValidation = [
  body('userId')
    .notEmpty().withMessage('User id is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

export default {
  registerValidation,
  loginValidation
};