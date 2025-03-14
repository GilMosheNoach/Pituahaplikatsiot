import express from 'express';
import { auth } from '../middleware/auth';
import {
  getPosts,
  getUserPosts,
  createPost,
  likePost,
  updatePost,
  deletePost,
  searchPosts,
  getPopularTags
} from '../controllers/postController';

const router = express.Router();

// Public routes
router.get('/', getPosts);
router.get('/user/:userId', getUserPosts);
router.get('/search', searchPosts);
router.get('/tags/popular', getPopularTags);

// Protected routes
router.post('/', auth, createPost);
router.post('/:id/like', auth, likePost);
router.patch('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);

export default router; 