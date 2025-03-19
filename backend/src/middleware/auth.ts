import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

// Define AuthRequest interface for typed user access
export interface AuthRequest extends Request {
  user?: {
    _id: string;
    id?: string;
    [key: string]: any;
  };
}

// Define types for user in request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No auth token found' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Set user id in request object with both id and _id properties for compatibility
    req.user = { 
      _id: decoded.id,
      id: decoded.id
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
};

export const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
}; 