import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import { generateToken } from '../config/jwt';
import { logInfo, logError } from '../utils/logger';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  logInfo('Register attempt', { userId: req.body.userId });
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { userId, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ userId }]
    });

    if (existingUser) {
      logInfo('Register failed: user already exists', { userId });
      res.status(400).json({
        message: 'User already exists with that email or username' 
      });
      return;
    }

    // Create new user
    const user = new User({
      userId,
      password
    });

    // Save user to database
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token (excluding password)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        userId: user.userId,
        createdAt: user.createdAt
      },
      token
    });
    logInfo('User registered successfully', { userId: user.userId, id: user._id });
  } catch (error) {
    logError('Registration error', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  logInfo('Login attempt', { userId: req.body.userId });
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { userId, password } = req.body;

    // Find user by email
    const user = await User.findOne({ userId });

    // Check if user exists
    if (!user) {
      logInfo('Login failed: user not found', { userId });
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logInfo('Login failed: invalid password', { userId });
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        userId: user.userId,
        createdAt: user.createdAt
      },
      token
    });
    logInfo('Login successful', { userId: user.userId, id: user._id });
  } catch (error) {
    logError('Login error', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // User is attached to request by auth middleware
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Find user by ID to get the most up-to-date information
    const currentUser = await User.findById(user.id).select('-password');

    if (!currentUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      user: currentUser
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  register,
  login,
  getCurrentUser
};