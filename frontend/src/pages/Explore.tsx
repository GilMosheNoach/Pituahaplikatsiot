import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardHeader,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

interface Post {
  _id: string;
  image: string;
  description: string;
  location: string;
  createdAt: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
  likes: number;
}

const Explore = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      // Refresh posts
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search posts by location, description or username"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Posts Grid */}
      <Grid container spacing={4}>
        {filteredPosts.map((post) => (
          <Grid item xs={12} sm={6} md={4} key={post._id}>
            <Card>
              <CardHeader
                avatar={
                  <Avatar
                    component={RouterLink}
                    to={`/profile/${post.user._id}`}
                    src={post.user.avatar}
                  />
                }
                title={
                  <Typography
                    component={RouterLink}
                    to={`/profile/${post.user._id}`}
                    sx={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {post.user.username}
                  </Typography>
                }
                subheader={new Date(post.createdAt).toLocaleDateString()}
              />
              <CardMedia
                component="img"
                height="240"
                image={post.image}
                alt={post.description}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  📍 {post.location}
                </Typography>
                <Typography variant="body1">
                  {post.description}
                </Typography>
                <Grid container alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <Grid item>
                    <IconButton onClick={() => handleLike(post._id)} color="primary">
                      <FavoriteIcon />
                    </IconButton>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      {post.likes} likes
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Explore; 