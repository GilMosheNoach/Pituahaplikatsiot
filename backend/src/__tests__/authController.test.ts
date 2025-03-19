import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { register, login } from '../controllers/authController';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authMiddleware from '../middleware/auth';

// Mock bcrypt and jwt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token')
}));

// Mock User model
jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

// Mock middleware/auth module
jest.mock('../middleware/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mocked-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mocked-refresh-token')
}));

// Spy on mocked generateToken and generateRefreshToken functions
const generateTokenSpy = jest.spyOn(authMiddleware, 'generateToken');
const generateRefreshTokenSpy = jest.spyOn(authMiddleware, 'generateRefreshToken');

// Mock request and response
const mockRequest = () => {
  const req: Partial<Request> = {};
  req.body = {};
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

describe('Auth Controller Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set default mock values for tokens
    generateTokenSpy.mockReturnValue('mocked-token');
    generateRefreshTokenSpy.mockReturnValue('mocked-refresh-token');
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Set up request body
      const req = mockRequest();
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = mockResponse();

      // Mock user object
      const mockUser = {
        _id: '123456789012345678901234',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      // Add token and refreshToken to the response
      (res.json as jest.Mock).mockImplementation((data) => {
        data.token = 'mocked-token';
        data.refreshToken = 'mocked-refresh-token';
        return res;
      });

      // Mock User.findOne to return null (no existing user)
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Mock User.create to return a new user
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      // Call register function
      await register(req, res);

      // Check if User.create was called with correct parameters
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      // Check if generateToken and generateRefreshToken were called
      expect(generateTokenSpy).toHaveBeenCalledWith(mockUser._id);
      expect(generateRefreshTokenSpy).toHaveBeenCalledWith(mockUser._id);

      // Check response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '123456789012345678901234',
        username: 'testuser',
        email: 'test@example.com',
        token: 'mocked-token',
        refreshToken: 'mocked-refresh-token'
      }));
    });

    it('should return 400 if email already exists', async () => {
      // Set up request body
      const req = mockRequest();
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = mockResponse();

      // Mock User.findOne to return an existing user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: '123456789012345678901234',
        username: 'existinguser',
        email: 'test@example.com'
      });

      // Call register function
      await register(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User already exists'
      }));
    });

    it('should handle server errors', async () => {
      // Set up request body
      const req = mockRequest();
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = mockResponse();

      // Mock User.findOne to throw an error
      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Call register function
      await register(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Server error'
      }));
    });
  });

  describe('login', () => {
    it('should log in a user with valid credentials', async () => {
      // Set up request body
      const req = mockRequest();
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = mockResponse();

      // Mock user object with comparePassword method
      const mockUser = {
        _id: '123456789012345678901234',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      // Add token and refreshToken to the response
      (res.json as jest.Mock).mockImplementation((data) => {
        data.token = 'mocked-token';
        data.refreshToken = 'mocked-refresh-token';
        return res;
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Call login function
      await login(req, res);

      // Check if comparePassword was called with correct parameters
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');

      // Check if generateToken and generateRefreshToken were called
      expect(generateTokenSpy).toHaveBeenCalledWith(mockUser._id);
      expect(generateRefreshTokenSpy).toHaveBeenCalledWith(mockUser._id);

      // Check response
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: '123456789012345678901234',
        username: 'testuser',
        email: 'test@example.com',
        token: 'mocked-token',
        refreshToken: 'mocked-refresh-token'
      }));
    });

    it('should return 401 if email is not found', async () => {
      // Set up request body
      const req = mockRequest();
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const res = mockResponse();

      // Mock User.findOne to return null (user not found)
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Call login function
      await login(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid credentials'
      }));
    });

    it('should return 401 if password is incorrect', async () => {
      // Set up request body
      const req = mockRequest();
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = mockResponse();

      // Mock user object with comparePassword method returning false
      const mockUser = {
        _id: '123456789012345678901234',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Call login function
      await login(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid credentials'
      }));
    });

    it('should handle server errors', async () => {
      // Set up request body
      const req = mockRequest();
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = mockResponse();

      // Mock User.findOne to throw an error
      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Call login function
      await login(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Server error'
      }));
    });
  });
}); 