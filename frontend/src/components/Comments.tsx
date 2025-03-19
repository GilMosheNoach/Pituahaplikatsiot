import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import { postAPI } from '../services/api';

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

interface CommentsProps {
  postId: string;
  onCommentAdded?: () => void;
}

const Comments = ({ postId, onCommentAdded }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getComments(postId);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await postAPI.addComment(postId, newComment);
      setNewComment('');
      fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  if (loading) {
    return <Typography>Loading comments...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      
      {/* Comment Form */}
      <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button
          variant="contained"
          size="small"
          type="submit"
          disabled={!newComment.trim()}
        >
          Post Comment
        </Button>
      </Box>

      {/* Comments List */}
      <List>
        {comments.map((comment, index) => (
          <React.Fragment key={comment._id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar src={comment.user.avatar} alt={comment.user.username} />
              </ListItemAvatar>
              <ListItemText
                primary={comment.user.username}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {comment.content}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < comments.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>

      {comments.length === 0 && (
        <Typography color="text.secondary" align="center">
          No comments yet. Be the first to comment!
        </Typography>
      )}
    </Box>
  );
};

export default Comments; 