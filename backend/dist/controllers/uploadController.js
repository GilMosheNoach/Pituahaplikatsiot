"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at:', uploadDir);
}
// Configure multer for file upload
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        console.log('Destination directory:', uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        console.log('Original filename:', file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname);
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});
// File filter
const fileFilter = (req, file, cb) => {
    console.log('Checking file:', file.originalname, 'Type:', file.mimetype);
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        console.log('File rejected: not an allowed image type');
        return cb(new Error('Only image files are allowed!'));
    }
    console.log('File accepted');
    cb(null, true);
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
}).single('image');
// @desc    Upload file
// @route   POST /api/upload
// @access  Private
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Upload request received');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    (0, exports.upload)(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                message: 'File upload error',
                error: err.message
            });
        }
        else if (err) {
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
});
exports.uploadFile = uploadFile;
