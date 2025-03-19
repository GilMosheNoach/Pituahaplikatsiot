import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  TextField,
  Avatar,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { userAPI, postAPI, authAPI } from '../services/api';

interface Post {
  _id: string;
  image: string;
  description: string;
  location: {
    country: string;
  };
  createdAt: string;
  userId?: string;
}

interface User {
  _id: string;
  username: string;
  avatar: string;
  bio: string;
}

interface NewPost {
  image: string;
  description: string;
  location: string;
  tags: string[];
}

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState<NewPost>({
    image: '',
    description: '',
    location: '',
    tags: [],
  });
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const isOwnProfile = id === 'me' || id === localStorage.getItem('userId');

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      let userId = id;
      if (id === 'me') {
        const meResponse = await authAPI.me();
        userId = meResponse.data._id;
        localStorage.setItem('userId', userId);
      }

      const [userResponse, postsResponse] = await Promise.all([
        userAPI.getUser(userId),
        postAPI.getUserPosts(userId)
      ]);

      setUser(userResponse.data);
      
      // לוג את מבנה הנתונים כדי לראות את המבנה האמיתי
      console.log('Posts data from server:', postsResponse.data);
      
      // הוספת לוג מפורט יותר עבור כל פוסט
      if (postsResponse.data && postsResponse.data.length > 0) {
        console.log('First post details:');
        console.log('- ID:', postsResponse.data[0]._id);
        console.log('- Content:', postsResponse.data[0].content);
        console.log('- Images array:', postsResponse.data[0].images);
        console.log('- Image property:', postsResponse.data[0].image);
        console.log('- Location:', postsResponse.data[0].location);
      }
      
      // אם הנתונים מגיעים במבנה שונה, נבצע המרה
      const formattedPosts = postsResponse.data.map((post: any) => {
        // בדוק אם location הוא אובייקט או מחרוזת ובצע טיפול מתאים
        if (typeof post.location === 'string') {
          return {
            ...post,
            location: { country: post.location }
          };
        }
        return post;
      });
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Uploading avatar:', file.name, 'Type:', file.type, 'Size:', file.size);

    const formData = new FormData();
    formData.append('image', file);

    // Debug FormData content
    console.log('FormData entries for avatar:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      setUploadingImage(true);
      setError('');
      console.log('Sending avatar upload request to:', `${import.meta.env.VITE_API_URL}/api/upload`);
      console.log('Current authorization token:', localStorage.getItem('token'));
      
      const uploadResponse = await userAPI.uploadAvatar(formData);
      console.log('Upload response:', uploadResponse);
      
      const userId = localStorage.getItem('userId');
      console.log('Updating user', userId, 'with avatar:', uploadResponse.data.imageUrl);
      
      if (!userId) {
        console.error('No userId found in localStorage');
        setError('No user ID found. Please log in again.');
        return;
      }
      
      await userAPI.updateUser(userId, {
        avatar: uploadResponse.data.imageUrl,
      });

      fetchUserData();
      setMessage('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      console.error('Error message:', error.message);
      setError(error.response?.data?.message || error.message || 'Failed to update profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.error('No file selected');
      return;
    }

    console.log('Selected file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    const formData = new FormData();
    formData.append('image', file);

    // Log FormData contents
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      setUploadingImage(true);
      setError('');
      console.log('Sending upload request to:', `${import.meta.env.VITE_API_URL}/api/upload`);
      const response = await postAPI.uploadImage(formData);
      console.log('Upload response:', response);
      setNewPost({ ...newPost, image: response.data.imageUrl });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      console.error('Error message:', error.message);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to upload image'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.image || !newPost.description) {
      setError('Please add both an image and description');
      return;
    }

    try {
      const postData = {
        ...newPost,
        location: {
          country: newPost.location
        }
      };
      
      await postAPI.createPost(postData);
      setMessage('Post created successfully');
      setNewPost({ image: '', description: '', location: '', tags: [] });
      setShowNewPostForm(false);
      fetchUserData();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post');
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      await postAPI.updatePost(editingPost._id, {
        description: editingPost.description,
        location: editingPost.location.country,
      });
      setMessage('Post updated successfully');
      setEditDialogOpen(false);
      fetchUserData();
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postAPI.deletePost(postId);
      setMessage('Post deleted successfully');
      fetchUserData();
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post');
    }
  };

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault();
      const tag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
      if (!newPost.tags.includes(tag)) {
        setNewPost(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
      }
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setNewPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };

  const handleLogout = () => {
    // הסרת הטוקן ופרטי המשתמש מהאחסון המקומי
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userAvatar');
    // הצגת הודעה למשתמש
    setMessage('Logged out successfully');
    // העברה לדף הכניסה
    navigate('/login');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user && !loading) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'User not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 8 }}>
      {/* Profile Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={user?.avatar}
                sx={{ width: 120, height: 120 }}
              />
              {isOwnProfile && (
                <label htmlFor="avatar-upload">
                  <input
                    accept="image/*"
                    id="avatar-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                    disabled={uploadingImage}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                    component="span"
                    size="small"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? <CircularProgress size={24} /> : <PhotoCamera />}
                  </IconButton>
                </label>
              )}
            </Box>
          </Grid>
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4">{user?.username}</Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              {posts.length} Posts
            </Typography>
            
            {/* כפתור התנתקות */}
            {isOwnProfile && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ my: 1 }} />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{ mt: 1 }}
                >
                  Logout
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* New Post Button */}
      {isOwnProfile && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowNewPostForm(true)}
          sx={{ mb: 4 }}
        >
          Add New Post
        </Button>
      )}

      {/* New Post Form */}
      <Dialog 
        open={showNewPostForm} 
        onClose={() => setShowNewPostForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitPost} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="post-image-upload"
                  type="file"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <label htmlFor="post-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={uploadingImage ? <CircularProgress size={20} /> : <PhotoCamera />}
                    fullWidth
                    disabled={uploadingImage}
                  >
                    Upload Image
                  </Button>
                </label>
                {newPost.image && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={newPost.image}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover' }}
                    />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={newPost.location}
                  onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={newPost.description}
                  onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Add Tags"
                  placeholder="Type tag and press Enter (e.g. #italy)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleAddTag}
                  helperText="Press Enter to add a tag"
                />
                {newPost.tags.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    {newPost.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Stack>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewPostForm(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitPost}
            variant="contained"
            disabled={!newPost.image || !newPost.description || uploadingImage}
          >
            Create Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Posts Grid */}
      <Grid container spacing={4}>
        {posts.map((post) => (
          <Grid item xs={12} sm={6} md={4} key={post._id}>
            <Card>
              <CardMedia
                component="img"
                height="240"
                image={post.image}
                alt={post.description}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  📍 {post.location.country}
                </Typography>
                <Typography variant="body1">
                  {post.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(post.createdAt).toLocaleDateString()}
                </Typography>
                {isOwnProfile && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setEditingPost(post);
                        setEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeletePost(post._id)}
                    >
                      Delete
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Post Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleEditPost} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={editingPost?.location.country || ''}
                  onChange={(e) => setEditingPost(prev => 
                    prev ? { ...prev, location: { country: e.target.value } } : null
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={editingPost?.description || ''}
                  onChange={(e) => setEditingPost(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditPost} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setMessage('')} severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile; 