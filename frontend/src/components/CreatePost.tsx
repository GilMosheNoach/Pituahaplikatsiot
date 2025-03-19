import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  Chip,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { postAPI } from '../services/api';

const categories = ['Nature', 'City', 'Culture', 'Food', 'Adventure', 'Other'];

interface CreatePostProps {
  onSubmit: (postData: any) => void;
  initialLocation?: string;
  initialTags?: string[];
}

const CreatePost: React.FC<CreatePostProps> = ({ 
  onSubmit, 
  initialLocation = '', 
  initialTags = [] 
}) => {
  const [formData, setFormData] = useState({
    description: '',
    location: initialLocation,
    category: 'Other',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [currentTag, setCurrentTag] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialLocation) {
      setFormData(prev => ({ ...prev, location: initialLocation }));
    }
    if (initialTags && initialTags.length > 0) {
      setTags(initialTags);
    }
  }, [initialLocation, initialTags]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e: any) => {
    setFormData({ ...formData, category: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTag(e.target.value);
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    if (!currentTag.trim()) return;
    
    let tagValue = currentTag.trim();
    // Add # if it doesn't start with one
    if (!tagValue.startsWith('#')) {
      tagValue = `#${tagValue}`;
    }
    
    // Avoid duplicates
    if (!tags.includes(tagValue)) {
      setTags([...tags, tagValue]);
    }
    setCurrentTag('');
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError('Please select an image');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Upload the image first
      const imageFormData = new FormData();
      imageFormData.append('image', imageFile);
      
      console.log('Uploading image:', imageFile.name);
      const uploadResponse = await postAPI.uploadImage(imageFormData);
      console.log('Upload response:', uploadResponse);
      const imageUrl = uploadResponse.data.imageUrl;
      
      // Prepare tags - remove # and transform as needed
      let processedTags = tags.map(tag => tag.startsWith('#') ? tag.substring(1) : tag);
      console.log('Tags before submission:', tags);
      
      // Add location as a tag if it's not already included
      if (formData.location && formData.location.trim() !== '') {
        const locationTag = formData.location.trim();
        const normalizedLocationTag = locationTag.startsWith('#') ? locationTag.substring(1) : locationTag;
        
        // Check if location is already in tags (case insensitive)
        const locationAlreadyInTags = processedTags.some(
          tag => tag.toLowerCase() === normalizedLocationTag.toLowerCase()
        );
        
        if (!locationAlreadyInTags) {
          processedTags.push(normalizedLocationTag);
        }
      }
      
      console.log('Processed tags for submission (with location):', processedTags);
      
      // Then create the post with the image URL
      const postData = {
        description: formData.description,
        location: formData.location,
        image: imageUrl,
        tags: processedTags,
      };
      
      console.log('Submitting post data:', postData);
      onSubmit(postData);
      
      // Reset form
      setFormData({
        description: '',
        location: '',
        category: 'Other',
      });
      setImageFile(null);
      setPreviewUrl('');
      setTags([]);
      
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={3}
            name="description"
            label="Share your travel experience..."
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            name="location"
            label="Location"
            value={formData.location}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              onChange={handleCategoryChange}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            name="tag"
            label="Add tags (press Enter to add)"
            value={currentTag}
            onChange={handleTagChange}
            onKeyPress={handleTagKeyPress}
            margin="normal"
            helperText="Add tags to help others find your post"
          />
          
          {tags.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, my: 2 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                />
              ))}
            </Stack>
          )}
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="image-upload">
              <Button 
                variant="contained" 
                component="span"
                startIcon={<PhotoCamera />}
              >
                Upload Image
              </Button>
            </label>
          </Box>
          
          {previewUrl && (
            <Box sx={{ mb: 2 }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }}
              />
            </Box>
          )}
          
          {error && (
            <Box sx={{ color: 'error.main', mb: 2 }}>
              {error}
            </Box>
          )}
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isSubmitting || !formData.description || !formData.location || !imageFile}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreatePost; 