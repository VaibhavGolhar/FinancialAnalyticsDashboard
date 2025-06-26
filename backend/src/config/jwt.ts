import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { IUser } from '../models/User';

// Load environment variables
dotenv.config();

// Generate a secure random secret
const generateSecureSecret = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

// Update .env file with the generated secret
const updateEnvFile = (secret: string): void => {
  try {
    const envPath = path.resolve(process.cwd(), '.env');

    // Read the current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace the JWT_SECRET line with the new secret
    envContent = envContent.replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET=${secret}`
    );

    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, envContent);

    // Reload environment variables
    process.env.JWT_SECRET = secret;

    console.log('JWT_SECRET has been generated and saved to .env file');
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
};

// Get JWT secret with proper validation and update .env if needed
const getJwtSecret = (): string => {
  const envSecret = process.env.JWT_SECRET;

  // If environment variable is set and not the default value
  if (envSecret && envSecret !== 'your_jwt_secret_key_here') {
    // Validate that the secret is strong enough (at least 32 chars)
    if (envSecret.length < 32) {
      console.warn('WARNING: JWT_SECRET is set but too short. It should be at least 32 characters long for security.');
    }
    return envSecret;
  }

  // If JWT_SECRET is not set or is the default value, generate a new one and update .env
  const newSecret = generateSecureSecret();
  updateEnvFile(newSecret);

  return newSecret;
};

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Generate JWT token
export const generateToken = (user: IUser): string => {
  return jwt.sign(
    { 
      id: user._id,
      username: user.username,
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

export default {
  generateToken,
  verifyToken
};
