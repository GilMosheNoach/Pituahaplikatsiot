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
exports.deletePost = exports.updatePost = exports.getPopularTags = exports.searchPosts = exports.likePost = exports.createPost = exports.getUserPosts = exports.getPosts = void 0;
const Post_1 = __importDefault(require("../models/Post"));
// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield Post_1.default.find()
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getPosts = getPosts;
// @desc    Get user posts
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield Post_1.default.find({ user: req.params.userId })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getUserPosts = getUserPosts;
// @desc    Create post
// @route   POST /api/posts
// @access  Private
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { description, location, image } = req.body;
        const post = yield Post_1.default.create({
            user: req.user._id,
            content: description,
            images: [image],
            location: {
                country: location,
            },
            category: 'Other',
        });
        const populatedPost = yield post.populate('user', 'username avatar');
        res.status(201).json(populatedPost);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createPost = createPost;
// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const post = yield Post_1.default.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const likeIndex = post.likes.indexOf(req.user._id);
        if (likeIndex === -1) {
            post.likes.push(req.user._id);
        }
        else {
            post.likes.splice(likeIndex, 1);
        }
        yield post.save();
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.likePost = likePost;
const searchPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tag } = req.query;
        if (!tag) {
            return res.status(400).json({ message: 'Search tag is required' });
        }
        const posts = yield Post_1.default.find({ tags: tag })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(posts);
    }
    catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({ message: 'Error searching posts' });
    }
});
exports.searchPosts = searchPosts;
const getPopularTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield Post_1.default.aggregate([
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, tag: '$_id', count: 1 } }
        ]);
        const popularTags = posts.map(post => post.tag);
        res.json(popularTags);
    }
    catch (error) {
        console.error('Error getting popular tags:', error);
        res.status(500).json({ message: 'Error getting popular tags' });
    }
});
exports.getPopularTags = getPopularTags;
// @desc    Update post
// @route   PATCH /api/posts/:id
// @access  Private
const updatePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { location, description } = req.body;
        const userId = req.user.id;
        const post = yield Post_1.default.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }
        const updatedPost = yield Post_1.default.findByIdAndUpdate(id, { location, description }, { new: true });
        res.json(updatedPost);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating post' });
    }
});
exports.updatePost = updatePost;
// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const post = yield Post_1.default.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }
        yield Post_1.default.findByIdAndDelete(id);
        res.json({ message: 'Post deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting post' });
    }
});
exports.deletePost = deletePost;
