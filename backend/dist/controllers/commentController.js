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
exports.getComments = exports.addComment = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' });
        }
        const comment = new Comment_1.default({
            content,
            user: userId,
            post: postId,
        });
        yield comment.save();
        const populatedComment = yield Comment_1.default.findById(comment._id)
            .populate('user', 'username avatar');
        res.status(201).json(populatedComment);
    }
    catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});
exports.addComment = addComment;
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postId } = req.params;
        const comments = yield Comment_1.default.find({ post: postId })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(comments);
    }
    catch (error) {
        console.error('Error getting comments:', error);
        res.status(500).json({ message: 'Error getting comments' });
    }
});
exports.getComments = getComments;
