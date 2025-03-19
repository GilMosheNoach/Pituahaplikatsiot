"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get comments for a post
router.get('/:postId', commentController_1.getComments);
// Add a comment to a post (requires authentication)
router.post('/:postId', auth_1.auth, commentController_1.createComment);
// Delete a comment (requires authentication)
router.delete('/:id', auth_1.auth, commentController_1.deleteComment);
exports.default = router;
