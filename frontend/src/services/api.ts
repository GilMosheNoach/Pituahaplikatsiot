import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userAvatar');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: any) => api.post('/api/auth/register', data),
  login: async (data: any) => api.post('/api/auth/login', data),
  me: async () => api.get('/api/auth/me'),
};

// User API
export const userAPI = {
  getUser: async (id: string) => api.get(`/api/users/${id}`),
  updateUser: async (id: string, data: any) => api.patch(`/api/users/${id}`, data),
  uploadAvatar: async (formData: FormData) => api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// Post API
export const postAPI = {
  getPosts: async () => api.get('/api/posts'),
  getUserPosts: async (userId: string) => api.get(`/api/posts/user/${userId}`),
  createPost: async (data: any) => api.post('/api/posts', data),
  updatePost: async (postId: string, data: any) => api.patch(`/api/posts/${postId}`, data),
  deletePost: async (postId: string) => api.delete(`/api/posts/${postId}`),
  likePost: async (postId: string) => api.post(`/api/posts/${postId}/like`),
  uploadImage: async (formData: FormData) => api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getComments: (postId: string) => {
    return api.get(`/api/comments/${postId}`);
  },
  addComment: (postId: string, content: string) => {
    return api.post(`/api/comments/${postId}`, { content });
  },
  searchPosts: (tag: string) => {
    return api.get(`/api/posts/search`, { params: { tag } });
  },
  getPopularTags: () => {
    return api.get('/api/posts/tags/popular');
  },
  testSearch: () => {
    return api.get('/api/posts/test-search');
  }
};

export default api; 