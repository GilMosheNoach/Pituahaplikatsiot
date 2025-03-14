import { Request, Response } from 'express';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
      
    // Transform posts to include single image property for frontend compatibility
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      // If there are images, use the first one as the image property
      if (postObj.images && postObj.images.length > 0) {
        (postObj as any).image = postObj.images[0];
      }
      return postObj;
    });
    
    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user posts
// @route   GET /api/posts/user/:userId
// @access  Public
export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    
    // Transform posts to include single image property for frontend compatibility
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      // If there are images, use the first one as the image property
      if (postObj.images && postObj.images.length > 0) {
        (postObj as any).image = postObj.images[0];
      }
      return postObj;
    });
    
    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { description, location, image, tags } = req.body;
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    console.log('Creating post with data:', { description, location, image, tags });
    console.log('Tags type:', typeof tags);
    console.log('Tags value:', tags);
    
    // Ensure tags are properly formatted
    let processedTags: string[] = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map(tag => {
        // Remove # if present and convert to lowercase
        return typeof tag === 'string' 
          ? (tag.startsWith('#') ? tag.substring(1) : tag).toLowerCase() 
          : '';
      }).filter(tag => tag !== '');
    } else if (typeof tags === 'string') {
      // Handle case where tags might be sent as a string
      processedTags = [tags.startsWith('#') ? tags.substring(1) : tags].filter(tag => tag !== '');
    }
    
    console.log('Processed tags:', processedTags);
    
    // Handle location whether it's a string or an object
    let locationData = { country: '' };
    
    if (typeof location === 'string') {
      locationData.country = location;
    } else if (location && typeof location === 'object' && 'country' in location) {
      locationData.country = location.country;
    } else {
      locationData.country = 'Unknown';
    }
    
    const post = await Post.create({
      user: new mongoose.Types.ObjectId(userId),
      content: description,
      images: [image],
      location: locationData,
      category: 'Other',
      tags: processedTags
    });

    const populatedPost = await post.populate('user', 'username avatar');
    
    // Add image property for frontend compatibility using type assertion
    const responsePost = populatedPost.toObject();
    (responsePost as any).image = image;
    
    res.status(201).json(responsePost);
  } catch (error) {
    console.warn('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    // Convert userId string to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Check if user already liked the post
    const userLikedIndex = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (userLikedIndex === -1) {
      // User hasn't liked the post, so add like
      post.likes.push(userObjectId);
    } else {
      // User already liked the post, so remove like
      post.likes.splice(userLikedIndex, 1);
    }

    await post.save();
    
    // Transform response to include image property
    const responsePost = post.toObject();
    if (responsePost.images && responsePost.images.length > 0) {
      (responsePost as any).image = responsePost.images[0];
    }
    
    res.json(responsePost);
  } catch (error) {
    console.error('Error updating post likes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { tag } = req.query;
    
    console.log('Search tag:', tag);
    console.log('Search tag type:', typeof tag);
    
    if (!tag) {
      return res.status(400).json({ message: 'Search tag is required' });
    }

    // For debugging - convert tag to string
    const tagString = String(tag);
    console.log('Tag as string:', tagString);
    
    // Try to find posts with various matching criteria
    const regexPattern = new RegExp(tagString, 'i');
    
    // Search in tags, location.country, and content fields with case-insensitive matching
    const posts = await Post.find({
      $or: [
        { tags: { $regex: regexPattern } },  // Case-insensitive tag search
        { "location.country": { $regex: regexPattern } },  // Location country search
        { content: { $regex: regexPattern } }  // Content search
      ]
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
      
    console.log('Found posts count:', posts.length);
    if (posts.length > 0) {
      console.log('First post:', posts[0]);
    }

    // Transform posts to include single image property for frontend compatibility
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      // If there are images, use the first one as the image property
      if (postObj.images && postObj.images.length > 0) {
        (postObj as any).image = postObj.images[0];
      }
      return postObj;
    });

    res.json(transformedPosts);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ message: 'Error searching posts' });
  }
};

export const getPopularTags = async (req: Request, res: Response) => {
  try {
    const posts = await Post.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, tag: '$_id', count: 1 } }
    ]);

    const popularTags = posts.map(post => post.tag);
    res.json(popularTags);
  } catch (error) {
    console.error('Error getting popular tags:', error);
    res.status(500).json({ message: 'Error getting popular tags' });
  }
};

// @desc    Update post
// @route   PATCH /api/posts/:id
// @access  Private
export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { location, description, tags } = req.body;
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updateData: any = {};
    if (location) updateData.location = { country: location };
    if (description) updateData.content = description;
    if (tags) updateData.tags = tags;

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'username avatar');

    if (!updatedPost) {
      return res.status(404).json({ message: 'Updated post not found' });
    }

    // Add image property for frontend compatibility
    const responsePost = updatedPost.toObject();
    if (responsePost.images && responsePost.images.length > 0) {
      (responsePost as any).image = responsePost.images[0];
    }
    
    res.json(responsePost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post' });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
}; 