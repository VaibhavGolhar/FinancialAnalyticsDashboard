import {NextFunction, Request, Response} from 'express';
import {verifyToken} from '../config/jwt';
import {logInfo, logError} from '../utils/logger';

// Interface for the request with user
export interface AuthRequest extends Request {
  user?: any;
}

// Middleware to protect routes that require authentication
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logInfo('Authentication failed: No token provided', { url: req.originalUrl });
      res.status(401).json({ message: 'No token provided, authorization denied' });
      return;
    }
    // Extract token from header
    const token = authHeader.split(' ')[1];
    if (!token) {
      logInfo('Authentication failed: Token missing after Bearer', { url: req.originalUrl });
      res.status(401).json({ message: 'No token provided, authorization denied' });
      return;
    }
    try {
      req.user = verifyToken(token);
      logInfo('Authentication success', { userId: req.user?.userId, url: req.originalUrl });
      next();
    } catch (error) {
      logInfo('Authentication failed: Invalid token', { url: req.originalUrl });
      res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    logError('Authentication error', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

export default authenticate;