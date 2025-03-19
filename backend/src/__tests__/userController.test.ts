import { Request, Response } from 'express';
import { getUserById, updateUser } from '../controllers/userController';
import User from '../models/User';

// Mock the request and response objects
const mockRequest = () => {
  const req: Partial<Request> = {};
  req.body = {};
  req.params = {};
  req.user = { id: '123456789012345678901234', _id: '123456789012345678901234' }; // Mock authenticated user
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

// Mock User model
jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(() => ({
      select: jest.fn().mockReturnThis()
    })),
    findByIdAndUpdate: jest.fn(() => ({
      select: jest.fn().mockReturnThis()
    }))
  }
}));

describe('User Controller Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should get a user by ID', async () => {
      // Mock user data
      const mockUser = {
        _id: '123456789012345678901234',
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        bio: 'Test bio'
      };
      
      // Mock User.findById().select() to return our mock user
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      const mockFindById = jest.fn(() => ({ select: mockSelect }));
      (User.findById as jest.Mock).mockImplementation(mockFindById);

      // Set up the request with user ID
      const req = mockRequest();
      req.params = { id: '123456789012345678901234' };

      const res = mockResponse();

      // Call the getUserById function
      await getUserById(req, res);

      // Check if findById was called with the correct ID
      expect(User.findById).toHaveBeenCalledWith('123456789012345678901234');
      
      // Check if select was called to exclude password
      expect(mockSelect).toHaveBeenCalledWith('-password');
      
      // Check if the user data was returned
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 if user not found', async () => {
      // Mock User.findById().select() to return null (user not found)
      const mockSelect = jest.fn().mockResolvedValue(null);
      const mockFindById = jest.fn(() => ({ select: mockSelect }));
      (User.findById as jest.Mock).mockImplementation(mockFindById);

      // Set up the request with user ID
      const req = mockRequest();
      req.params = { id: '123456789012345678901234' };

      const res = mockResponse();

      // Call the getUserById function
      await getUserById(req, res);

      // Check if 404 was returned
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found'
      }));
    });

    it('should handle server errors', async () => {
      // Mock User.findById to throw an error
      const mockSelect = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockFindById = jest.fn(() => ({ select: mockSelect }));
      (User.findById as jest.Mock).mockImplementation(mockFindById);

      // Set up the request with user ID
      const req = mockRequest();
      req.params = { id: '123456789012345678901234' };

      const res = mockResponse();

      // Call the getUserById function
      await getUserById(req, res);

      // Check if 500 was returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Server error'
      }));
    });
  });

  describe('updateUser', () => {
    it('should update a user profile', async () => {
      // Mock user data
      const mockUser = {
        _id: '123456789012345678901234',
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        bio: 'Test bio'
      };
      
      // Mock updated user data
      const mockUpdatedUser = {
        ...mockUser,
        username: 'updateduser',
        bio: 'Updated bio',
        avatar: 'new-avatar.jpg'
      };
      
      // Mock User.findById for auth check
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock User.findByIdAndUpdate().select() for actual update
      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedUser);
      const mockFindByIdAndUpdate = jest.fn(() => ({ select: mockSelect }));
      (User.findByIdAndUpdate as jest.Mock).mockImplementation(mockFindByIdAndUpdate);

      // Set up the request with user ID and update data
      const req = mockRequest();
      req.params = { id: '123456789012345678901234' };
      req.body = {
        username: 'updateduser',
        bio: 'Updated bio',
        avatar: 'new-avatar.jpg'
      };

      const res = mockResponse();

      // Call the updateUser function
      await updateUser(req, res);

      // Check if findByIdAndUpdate was called with the correct parameters
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '123456789012345678901234',
        { $set: req.body },
        { new: true }
      );
      
      // Check if select was called to exclude password
      expect(mockSelect).toHaveBeenCalledWith('-password');
      
      // Check if the updated user data was returned
      expect(res.json).toHaveBeenCalledWith(mockUpdatedUser);
    });

    it('should return 404 if user not found', async () => {
      // Mock User.findById to return null (user not found)
      (User.findById as jest.Mock).mockResolvedValue(null);

      // Set up the request with user ID and update data
      const req = mockRequest();
      req.params = { id: '123456789012345678901234' };
      req.body = {
        username: 'updateduser',
        bio: 'Updated bio'
      };

      const res = mockResponse();

      // Call the updateUser function
      await updateUser(req, res);

      // Check if 404 was returned
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User not found'
      }));
    });

    it('should return 401 if user is not authorized to update the profile', async () => {
      // Mock user data with different ID than the authenticated user
      const mockUser = {
        _id: '999888777666555444333222',
        username: 'otheruser',
        email: 'other@example.com'
      };
      
      // Mock User.findById to return a user with different ID
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      // Set up the request with user ID and update data
      const req = mockRequest();
      req.params = { id: '999888777666555444333222' };
      req.body = {
        username: 'updateduser',
        bio: 'Updated bio'
      };

      const res = mockResponse();

      // Call the updateUser function
      await updateUser(req, res);

      // Check if 401 was returned
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Not authorized to update this profile'
      }));
    });

    it('should handle server errors', async () => {
      // Mock User.findById to throw an error
      (User.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Set up the request with user ID and update data
      const req = mockRequest();
      req.params = { id: '123456789012345678901234' };
      req.body = {
        username: 'updateduser',
        bio: 'Updated bio'
      };

      const res = mockResponse();

      // Call the updateUser function
      await updateUser(req, res);

      // Check if 500 was returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Server error'
      }));
    });
  });
}); 