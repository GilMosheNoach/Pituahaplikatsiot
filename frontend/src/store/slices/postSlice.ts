import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface Post {
  _id: string;
  user: {
    _id: string;
    username: string;
    profileImage: string;
  };
  content: string;
  images: string[];
  location: {
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category: string;
  likes: string[];
  comments: {
    _id: string;
    user: {
      _id: string;
      username: string;
      profileImage: string;
    };
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
}

interface PostsState {
  posts: Post[];
  userPosts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  userPosts: [],
  currentPost: null,
  isLoading: false,
  error: null,
};

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get('http://localhost:5000/api/posts');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
  }
});

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/posts', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${postId}/like`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like post');
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<Post[]>) => {
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.isLoading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(likePost.fulfilled, (state, action: PayloadAction<{ postId: string; userId: string }>) => {
        const post = state.posts.find((p) => p._id === action.payload.postId);
        if (post) {
          const index = post.likes.indexOf(action.payload.userId);
          if (index === -1) {
            post.likes.push(action.payload.userId);
          } else {
            post.likes.splice(index, 1);
          }
        }
      });
  },
});

export default postSlice.reducer; 