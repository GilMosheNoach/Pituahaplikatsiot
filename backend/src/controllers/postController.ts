import { Request, Response } from 'express';
import Post from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import mongoose, { Document, Schema } from 'mongoose';
import User from '../models/User';

// Extension of IPost to include image property
interface IPostWithImage extends Document {
  image?: string; // Add the image property that we're setting later
}

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
    console.log('=== SEARCH POSTS START ===');
    console.log('Request query:', req.query);
    console.log('Request headers:', req.headers);
    
    const { tag } = req.query;
    
    console.log('Search tag:', tag);
    console.log('Search tag type:', typeof tag);
    
    if (!tag) {
      console.log('No tag provided, returning 400');
      return res.status(400).json({ message: 'Search tag is required' });
    }

    // For debugging - convert tag to string
    const tagString = String(tag);
    console.log('Tag as string:', tagString);
    
    // Try to find posts with various matching criteria
    const regexPattern = new RegExp(tagString, 'i');
    console.log('Regex pattern:', regexPattern);
    
    // Log database connection
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    // Search in tags, location.country, and content fields with case-insensitive matching
    console.log('Executing search query...');
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
    console.log('Posts array type:', typeof posts);
    console.log('Posts array is Array?', Array.isArray(posts));
    
    if (posts.length > 0) {
      console.log('First post user:', posts[0].user);
      console.log('First post location:', posts[0].location);
      console.log('First post content:', posts[0].content);
      console.log('First post images:', posts[0].images);
      console.log('First post tags:', posts[0].tags);
    }

    // Transform posts to include image property for frontend compatibility
    console.log('Transforming posts...');
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      
      // Debug the images property
      console.log(`Post ${postObj._id} images:`, postObj.images);
      
      // Ensure images array exists
      if (!postObj.images) {
        postObj.images = [];
        console.log(`Post ${postObj._id} had undefined images, set to empty array`);
      }
      
      // If there are images, use the first one as the image property
      if (postObj.images && postObj.images.length > 0) {
        // Make sure image URL is complete
        let imageUrl = postObj.images[0];
        
        // Debug the image URL
        console.log(`Post ${postObj._id} first image URL:`, imageUrl);
        
        // If URL is not already absolute, make it relative to API base
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Make sure image path is formatted correctly
          if (!imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
          }
        }
        
        // Set the image property
        (postObj as any).image = imageUrl;
        console.log(`Post ${postObj._id} final image:`, (postObj as any).image);
      } else {
        // Set a placeholder image if no images
        (postObj as any).image = '/uploads/placeholder.jpg';
        console.log(`Post ${postObj._id} using placeholder image`);
      }
      
      return postObj;
    });

    console.log('Transformed posts count:', transformedPosts.length);
    if (transformedPosts.length > 0) {
      console.log('First transformed post image:', (transformedPosts[0] as any).image);
    }
    
    console.log('=== SEARCH POSTS END ===');
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

/**
 * @desc    Get post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', ['name', 'avatar'])
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(post);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

/**
 * @desc    Unlike a post
 * @route   POST /api/posts/:id/unlike
 * @access  Private
 */
export const unlikePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already liked the post
    if (req.user && !post.likes.includes(req.user.id)) {
      return res.status(400).json({ message: 'Post has not yet been liked' });
    }

    // Get remove index
    if (req.user) {
      const index = post.likes.indexOf(req.user.id);
      post.likes.splice(index, 1);
    }

    await post.save();

    return res.json({
      likes: post.likes,
      count: post.likes.length
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Improved test endpoint with sample data creation if needed
export const testSearch = async (req: Request, res: Response) => {
  try {
    console.log('=== TEST SEARCH FUNCTION ===');
    console.log('MongoDB connection state:', mongoose.connection.readyState);
    
    // Count total posts in the database
    const totalCount = await Post.countDocuments();
    console.log('Total posts in database:', totalCount);
    
    // If no posts exist, create a sample post for testing
    let sampleCreated = false;
    
    if (totalCount === 0) {
      console.log('No posts found. Creating a sample post for testing...');
      
      // Find an existing user or create a placeholder
      let testUser = await User.findOne();
      if (!testUser) {
        console.log('No users found. Cannot create sample post without a user.');
        return res.json({
          success: false, 
          message: 'No users or posts exist in the database',
          totalPosts: 0
        });
      }
      
      // Create a sample post with known destination tags
      const destinations = ['איטליה', 'ספרד', 'צרפת', 'גרמניה'];
      
      for (const destination of destinations) {
        const samplePost = await Post.create({
          user: testUser._id,
          content: `פוסט דוגמה עבור ${destination}`,
          images: ['/uploads/sample-image.jpg'],
          location: {
            country: destination
          },
          category: 'Other',
          tags: [destination, 'מדינה', 'אירופה']
        });
        console.log(`Created sample post for ${destination} with ID: ${samplePost._id}`);
      }
      
      sampleCreated = true;
      console.log('Sample posts created successfully');
    }
    
    // Get sample posts after potentially creating them
    const samplePosts = await Post.find().limit(5).populate('user', 'username avatar');
    console.log('Sample posts count after check:', samplePosts.length);
    
    if (samplePosts.length > 0) {
      const firstPost = samplePosts[0].toObject();
      console.log('Sample first post ID:', firstPost._id);
      console.log('Sample first post user:', firstPost.user);
      console.log('Sample first post content:', firstPost.content);
      console.log('Sample first post images:', firstPost.images);
      console.log('Sample first post tags:', firstPost.tags);
      
      // Transform the sample post
      if (firstPost.images && firstPost.images.length > 0) {
        (firstPost as any).image = firstPost.images[0];
      } else {
        (firstPost as any).image = '/uploads/placeholder.jpg';
      }
    }
    
    // Return success with diagnostics
    return res.json({
      success: true,
      totalPosts: sampleCreated ? await Post.countDocuments() : totalCount,
      sampleCount: samplePosts.length,
      sampleCreated,
      samplePosts: samplePosts.map(post => {
        const postObj = post.toObject();
        if (postObj.images && postObj.images.length > 0) {
          (postObj as any).image = postObj.images[0];
        } else {
          (postObj as any).image = '/uploads/placeholder.jpg';
        }
        return postObj;
      })
    });
    
  } catch (error) {
    console.error('Test search error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}; 