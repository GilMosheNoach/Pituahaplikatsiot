import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/auth';
import User from '../models/User';
import { JWT_SECRET } from '../config';

// Mock JWT_SECRET
jest.mock('../config', () => ({
  JWT_SECRET: 'test-secret'
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

// Mock User model
jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

// Mock request, response, and next function
const mockRequest = () => {
  const req: Partial<Request> = {};
  req.header = jest.fn();
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe('Auth Middleware Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should add user ID to request object with valid token', async () => {
    // Mock token in request header
    const req = mockRequest();
    (req.header as jest.Mock).mockReturnValue('Bearer valid-token');

    // Mock jwt.verify to return valid payload
    (jwt.verify as jest.Mock).mockReturnValue({ id: '123456789012345678901234' });

    // Call middleware
    await auth(req, mockResponse(), mockNext);

    // Check if req.user was set correctly and next() was called
    expect(req.user).toEqual({ 
      _id: '123456789012345678901234',
      id: '123456789012345678901234'
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 if no token provided', async () => {
    // Mock request with no token
    const req = mockRequest();
    (req.header as jest.Mock).mockReturnValue(undefined);

    const res = mockResponse();

    // Call middleware
    await auth(req, res, mockNext);

    // Check if 401 was returned
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'No auth token found'
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', async () => {
    // Mock request with token
    const req = mockRequest();
    (req.header as jest.Mock).mockReturnValue('Bearer invalid-token');

    // Mock jwt.verify to throw an error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const res = mockResponse();

    // Call middleware
    await auth(req, res, mockNext);

    // Check if 401 was returned
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Please authenticate'
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle server errors', async () => {
    // Mock request with token
    const req = mockRequest();
    (req.header as jest.Mock).mockReturnValue('Bearer valid-token');

    // Mock jwt.verify to throw a system error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error = new Error('System error');
      error.name = 'SystemError';
      throw error;
    });

    const res = mockResponse();

    // Call middleware
    await auth(req, res, mockNext);

    // Check if 401 was returned with error message
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Please authenticate'
    }));
    expect(mockNext).not.toHaveBeenCalled();
  });
}); 