"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const postController_1 = require("../controllers/postController");
const router = express_1.default.Router();
// Public routes
router.get('/', postController_1.getPosts);
router.get('/user/:userId', postController_1.getUserPosts);
router.get('/search', postController_1.searchPosts);
router.get('/tags/popular', postController_1.getPopularTags);
// Protected routes
router.post('/', auth_1.auth, postController_1.createPost);
router.post('/:id/like', auth_1.auth, postController_1.likePost);
router.put('/:id', auth_1.auth, postController_1.updatePost);
router.delete('/:id', auth_1.auth, postController_1.deletePost);
exports.default = router;
