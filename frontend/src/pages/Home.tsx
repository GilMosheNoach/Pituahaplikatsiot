import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import FlightIcon from '@mui/icons-material/Flight';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SearchIcon from '@mui/icons-material/Search';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import MapIcon from '@mui/icons-material/Map';
import { Link } from 'react-router-dom';
import Post from '../components/Post';
import DestinationCard from '../components/DestinationCard';
import { postAPI } from '../services/api';

interface Post {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar?: string;
  };
  image: string;
  description: string;
  location: string;
  tags: string[];
  createdAt: string;
  likes: number;
}

const Home = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(localStorage.getItem('userId'));

  useEffect(() => {
    fetchPopularTags();
  }, []);

  const fetchPopularTags = async () => {
    try {
      const response = await postAPI.getPopularTags();
      setPopularTags(response.data);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
    }
  };

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError('');

      // Remove # if it was added
      const searchTag = query.startsWith('#') ? query.substring(1) : query;

      const response = await postAPI.searchPosts(searchTag);
      setPosts(response.data);
    } catch (error) {
      console.error('Error searching posts:', error);
      setError('Failed to search posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    handleSearch(tag);
  };

  const europeanDestinations = [
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

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          height: '70vh',
          position: 'relative',
          backgroundImage: 'url(https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?auto=format&fit=crop&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.common.black, 0.5),
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography
            variant="h1"
            color="white"
            align="center"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            שתף את חוויות הטיול שלך
          </Typography>
          <Typography
            variant="h5"
            color="white"
            align="center"
            sx={{ mb: 4, maxWidth: '80%', margin: '0 auto' }}
          >
            התחבר למטיילים אחרים, שתף את ההרפתקאות שלך וגלה יעדים מדהימים בכל העולם.
          </Typography>
        </Container>
      </Box>

      {/* European Destinations Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" sx={{ mb: 2 }}>
          גלה יעדים באירופה
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          לחץ על יעד כדי לראות חוויות של מטיילים ולשתף את החוויה שלך
        </Typography>
        <Grid container spacing={3}>
          {europeanDestinations.map((destination) => (
            <Grid item xs={12} sm={6} md={4} lg={4} key={destination.id}>
              <DestinationCard
                id={destination.id}
                title={destination.title}
                image={destination.image}
                description={destination.description}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

    </Box>
  );
};

export default Home; 