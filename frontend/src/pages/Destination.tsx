import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import { postAPI } from '../services/api';

interface PostType {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  images: string[];
  location: {
    country: string;
  };
  likes: string[];
  tags: string[];
  createdAt: string;
}

const destinations = [
  { id: 'france', title: 'צרפת', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', description: 'מדינת האהבה, האורות והאוכל המשובח' },
  { id: 'spain', title: 'ספרד', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325', description: 'אדריכלות מרהיבה, חופים וסנגריה' },
  { id: 'italy', title: 'איטליה', image: 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee', description: 'היסטוריה עתיקה ואוכל איטלקי משובח' },
  { id: 'turkey', title: 'טורקיה', image: 'https://images.unsplash.com/photo-1589561454226-796a8aa89b05', description: 'גשר בין מזרח למערב עם נופים מדהימים' },
  { id: 'germany', title: 'גרמניה', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b', description: 'יערות שחורים, טירות ובירה' },
  { id: 'uk', title: 'בריטניה', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad', description: 'אתרים היסטוריים ותרבות מגוונת' },
  { id: 'netherlands', title: 'הולנד', image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4', description: 'תעלות, אופניים ושדות פרחים' },
  { id: 'austria', title: 'אוסטריה', image: 'https://images.pexels.com/photos/2962595/pexels-photo-2962595.jpeg', description: 'מוזיקה קלאסית ונופים אלפיניים' },
  { id: 'greece', title: 'יוון', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff', description: 'איים יפהפיים ושקיעות מרהיבות' },
  { id: 'portugal', title: 'פורטוגל', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b', description: 'רחובות צבעוניים ונופי חוף מרהיבים' },
];

const Destination = () => {
  const { id } = useParams<{ id: string }>();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const destination = destinations.find(dest => dest.id === id);

  useEffect(() => {
    // Get current user ID from localStorage
    const userId = localStorage.getItem('userId');
    if (userId) {
      setCurrentUserId(userId);
    }

    fetchPosts();
  }, [id]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Search by destination name
      const destinationName = destination?.title || '';
      console.log('=== FETCH POSTS START ===');
      console.log('Destination object:', destination);
      console.log('Searching for posts with destination:', destinationName);
      console.log('API URL:', import.meta.env.VITE_API_URL);
      
      // First try normal search
      let response;
      try {
        response = await postAPI.searchPosts(destinationName);
        console.log('Search response status:', response.status);
        console.log('Search response data type:', typeof response.data);
        console.log('Search response data is array?', Array.isArray(response.data));
        console.log('Search response data length:', response.data.length);
        
        // If we got empty results, try the test API to verify connection
        if (Array.isArray(response.data) && response.data.length === 0) {
          console.log('No posts found, testing API connection...');
          const testResponse = await postAPI.testSearch();
          console.log('Test API response:', testResponse.data);
          
          // If test API created sample data, try the search again
          if (testResponse.data.sampleCreated) {
            console.log('Sample data created, retrying search...');
            response = await postAPI.searchPosts(destinationName);
            console.log('New search results after sample creation:', response.data.length);
          }
        }
      } catch (searchError) {
        console.error('Search API error:', searchError);
        // If the search fails, try the test API
        console.log('Trying test API as fallback...');
        const testResponse = await postAPI.testSearch();
        console.log('Test API response:', testResponse.data);
        
        // Use the test data if any exists
        if (testResponse.data.sampleCount > 0) {
          response = { 
            data: testResponse.data.samplePosts,
            status: 200 
          };
        } else {
          throw searchError; // Re-throw if test API doesn't help
        }
      }
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('First post image:', response.data[0].image);
        console.log('First post user:', response.data[0].user);
      }
      
      setPosts(response.data);
      console.log('=== FETCH POSTS END ===');
    } catch (error) {
      console.error('=== FETCH POSTS ERROR ===');
      console.error('Error fetching posts:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      setError('Failed to load posts for this destination');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData: any) => {
    try {
      // Ensure the post has the destination tag
      const destinationName = destination?.title || '';
      if (destinationName && !postData.tags.includes(destinationName)) {
        postData.tags.push(destinationName);
      }

      await postAPI.createPost(postData);
      fetchPosts(); // Refresh posts after creating a new one
      setOpenDialog(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (!destination) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">Destination not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper
        sx={{
          p: 4,
          mb: 4,
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${destination.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          {destination.title}
        </Typography>
        <Typography variant="h5" paragraph>
          {destination.description}
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h2">
          פוסטים על {destination.title}
        </Typography>
        {currentUserId && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            שתף את החוויה שלך
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : posts.length === 0 ? (
        <Alert severity="info">
          עדיין אין פוסטים על יעד זה. היה הראשון לשתף את החוויה שלך!
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {posts.map((post) => (
            <Grid item xs={12} key={post._id}>
              <Post 
                post={{
                  _id: post._id,
                  user: post.user,
                  location: post.location,
                  description: post.content,
                  image: post.image || (post.images && post.images.length > 0 ? post.images[0] : ''),
                  images: post.images,
                  tags: post.tags,
                  createdAt: post.createdAt,
                  likes: post.likes.length,
                }}
                currentUserId={currentUserId || undefined}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Post Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>שתף את החוויה שלך ב{destination.title}</DialogTitle>
        <DialogContent>
          <CreatePost 
            onSubmit={handleCreatePost} 
            initialLocation={destination.title}
            initialTags={[destination.title]}
          />
        </DialogContent>
      </Dialog>

      {/* Floating Action Button on Mobile */}
      {currentUserId && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { md: 'none' }
          }}
          onClick={() => setOpenDialog(true)}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default Destination; 