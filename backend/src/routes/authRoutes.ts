import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { registerValidation, loginValidation } from '../middleware/validationMiddleware';
import authenticate from '../middleware/authMiddleware';

const router = express.Router();

// Register route
router.post('/register', registerValidation, register);

// Login route
router.post('/login', loginValidation, login);

// Get current user route (protected)
router.get('/me', authenticate, getCurrentUser);

export default router;