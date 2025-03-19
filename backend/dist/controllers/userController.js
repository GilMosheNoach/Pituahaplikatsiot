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
exports.updateUser = exports.getUserById = void 0;
const User_1 = __importDefault(require("../models/User"));
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getUserById = getUserById;
// @desc    Update user
// @route   PATCH /api/users/:id
// @access  Private
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Check if user is updating their own profile
        if (req.user._id.toString() !== req.params.id) {
            return res.status(401).json({ message: 'Not authorized to update this profile' });
        }
        const updatedUser = yield User_1.default.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select('-password');
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateUser = updateUser;
