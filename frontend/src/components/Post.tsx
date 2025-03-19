import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Favorite as FavoriteIcon,
  ChatBubble as ChatBubbleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import Comments from './Comments';
import { postAPI } from '../services/api';

interface PostProps {
  post: {
    _id: string;
    user: {
      _id: string;
      username: string;
      avatar?: string;
    };
    location: {
      country: string;
    };
    description: string;
    image: string;
    images?: string[];
    tags?: string[];
    createdAt: string;
    likes: number;
  };
  currentUserId?: string;
  onEdit?: (postId: string, updatedData: { location: string; description: string }) => void;
  onDelete?: (postId: string) => void;
}

const Post = ({ post, currentUserId, onEdit, onDelete }: PostProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLocation, setEditLocation] = useState(post.location.country);
  const [editDescription, setEditDescription] = useState(post.description);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    // לטעון את מספר התגובות בעת טעינת הקומפוננטה
    const fetchCommentsCount = async () => {
      try {
        const response = await postAPI.getComments(post._id);
        setCommentsCount(response.data.length);
      } catch (error) {
        console.error('Error fetching comments count:', error);
      }
    };
    
    fetchCommentsCount();
  }, [post._id]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (onEdit) {
      onEdit(post._id, {
        location: editLocation,
        description: editDescription,
      });
    }
    setEditDialogOpen(false);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete(post._id);
    }
  };

  const handleLikeClick = async () => {
    if (!currentUserId || isLikeLoading) return;
    
    try {
      setIsLikeLoading(true);
      const response = await postAPI.likePost(post._id);
      
      setIsLiked(!isLiked);
      
      setLikesCount(prevLikes => isLiked ? prevLikes - 1 : prevLikes + 1);
      
      console.log('Like response:', response.data);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  // Handle fetching new comments when comments are shown
  const handleCommentsToggle = async () => {
    setShowComments(!showComments);
    
    // אם התגובות מוצגות כעת, נטען מחדש את ספירת התגובות
    if (!showComments) {
      try {
        const response = await postAPI.getComments(post._id);
        setCommentsCount(response.data.length);
      } catch (error) {
        console.error('Error updating comments count:', error);
      }
    }
  };

  const isOwner = currentUserId === post.user._id;

  // Add a debug log to see the post data
  console.log('Rendering post:', post);
  console.log('Image value:', post.image);
  console.log('Tags:', post.tags);
  
  // Get image from either post.image or post.images[0]
  let imageUrl = post.image || (post.images && post.images.length > 0 ? post.images[0] : '');
  
  // Fix image URL if needed
  if (imageUrl) {
    // If the URL doesn't start with http or /, prepend the API URL
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = '/' + imageUrl;
    }
    
    // If URL starts with / but not //, prepend the backend URL
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      imageUrl = `${apiUrl}${imageUrl}`;
    }
  } else {
    // Use a placeholder image if no image is available
    imageUrl = 'https://via.placeholder.com/400?text=No+Image+Available';
  }
  
  console.log('Final image URL:', imageUrl);

  return (
    <Card sx={{ maxWidth: 600, mb: 2, mx: 'auto' }}>
      <CardHeader
        avatar={
          <Link to={`/profile/${post.user._id}`} style={{ textDecoration: 'none' }}>
            <Avatar src={post.user.avatar} alt={post.user.username}>
              {post.user.username[0]}
            </Avatar>
          </Link>
        }
        action={
          isOwner && (
            <>
              <IconButton onClick={handleMenuClick}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleEditClick}>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit
                </MenuItem>
                <MenuItem onClick={handleDeleteClick}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete
                </MenuItem>
              </Menu>
            </>
          )
        }
        title={
          <Link
            to={`/profile/${post.user._id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {post.user.username}
          </Link>
        }
        subheader={post.location.country}
      />
      <CardMedia
        component="img"
        height="400"
        image={imageUrl}
        alt={post.description}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {post.description}
        </Typography>
        
        {/* Display tags if available */}
        {post.tags && post.tags.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tags: {post.tags.map(tag => `#${tag}`).join(', ')}
          </Typography>
        )}
      </CardContent>
      <CardActions disableSpacing>
        <IconButton 
          aria-label="like"
          onClick={handleLikeClick}
          disabled={isLikeLoading || !currentUserId}
          color={isLiked ? "primary" : "default"}
        >
          <FavoriteIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          {likesCount} likes
        </Typography>
        <IconButton
          aria-label="comments"
          onClick={handleCommentsToggle}
        >
          <ChatBubbleIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {commentsCount} comments
        </Typography>
      </CardActions>

      {showComments && <Comments postId={post._id} onCommentAdded={() => setCommentsCount(prev => prev + 1)} />}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Location"
            fullWidth
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default Post; 