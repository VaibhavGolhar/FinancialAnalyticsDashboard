import {NextFunction, Request, Response} from 'express';
import {verifyToken} from '../config/jwt';

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
      res.status(401).json({ message: 'No token provided, authorization denied' });
      return;
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'No token provided, authorization denied' });
      return;
    }
    
    try {
      // Add user from payload to request object
      req.user = verifyToken(token);
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

export default authenticate;