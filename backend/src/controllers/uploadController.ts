import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at:', uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    console.log('Destination directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    console.log('Original filename:', file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('Checking file:', file.originalname, 'Type:', file.mimetype);
  
  // Check for allowed image types by mimetype and file extension
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/JPEG', 'image/PNG', 'image/GIF', 'image/WEBP'
  ];
  const allowedExtRegex = /\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)$/i;
  
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(allowedExtRegex)) {
    console.log('File accepted');
    cb(null, true);
  } else {
    console.log('File rejected: not an allowed image type. Mimetype:', file.mimetype);
    return cb(new Error('Only image files (JPG, JPEG, PNG, GIF, WEBP) are allowed!'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
}).single('image');

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
export const uploadFile = async (req: Request, res: Response) => {
  console.log('Upload request received');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);

  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      console.error('Other upload error:', err);
      return res.status(400).json({
        message: 'Error uploading file',
        error: err.message
      });
    }

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', req.file);

    // Create URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    console.log('Generated file URL:', fileUrl);

    res.json({
      message: 'File uploaded successfully',
      imageUrl: fileUrl
    });
  });
}; 