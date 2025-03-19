import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Favorite, FavoriteBorder, Comment, Place } from '@mui/icons-material';
import { likePost } from '../store/slices/postSlice';
import { AppDispatch, RootState } from '../store/store';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: {
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
      };
      content: string;
      createdAt: string;
    }[];
    createdAt: string;
  };
}

const PostCard = ({ post }: PostCardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user._id) : false);

  const handleLike = () => {
    if (user) {
      dispatch(likePost(post._id));
      setIsLiked(!isLiked);
    }
  };

  return (
    <Card sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={
          <Avatar
            src={post.user.profileImage}
            alt={post.user.username}
            component={Link}
            to={`/profile/${post.user._id}`}
          />
        }
        title={
          <Typography
            component={Link}
            to={`/profile/${post.user._id}`}
            color="inherit"
            sx={{ textDecoration: 'none' }}
          >
            {post.user.username}
          </Typography>
        }
        subheader={new Date(post.createdAt).toLocaleDateString('he-IL')}
      />
      {post.images[0] && (
        <CardMedia
          component="img"
          height="194"
          image={post.images[0]}
          alt={post.content}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {post.content}
        </Typography>
        <Box display="flex" alignItems="center" mt={1}>
          <Place fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            {post.location.country}
          </Typography>
        </Box>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton onClick={handleLike} disabled={!user}>
          {isLiked ? (
            <Favorite color="error" />
          ) : (
            <FavoriteBorder />
          )}
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {post.likes.length}
        </Typography>
        <IconButton component={Link} to={`/post/${post._id}`}>
          <Comment />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {post.comments.length}
        </Typography>
      </CardActions>
    </Card>
  );
};

export default PostCard; 