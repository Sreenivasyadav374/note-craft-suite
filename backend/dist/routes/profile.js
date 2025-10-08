"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Ensure you have an import for your custom authenticateToken and User model
const auth_1 = require("../middleware/auth");
const User_1 = __importDefault(require("../models/User"));
// ADDED: Multer Import
const multer_1 = __importDefault(require("multer"));
// ADDED: Multer Configuration
// Use memoryStorage so the file buffer is available in req.file
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Enforces the 5MB limit
});
const router = express_1.default.Router();
// FIXED ROUTE:
// 1. Middleware order is swapped: upload.single runs before authenticateToken.
// 2. The route logic reads the user ID from req.userId and the file from req.file.
router.post('/update-picture', upload.single('profilePicture'), auth_1.authenticateToken, async (req, res) => {
    // Use 'any' type assertion to access properties added by middleware (userId and file)
    const augmentedReq = req;
    try {
        // FIX: Read userId from req.userId, as set by your authenticateToken middleware
        const userId = augmentedReq.userId;
        const file = augmentedReq.file; // File is provided by multer
        // Safety check after authentication
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!file) {
            return res.status(400).json({ error: 'Profile picture file is required' });
        }
        // --- LOGIC: Convert file buffer to Base64 Data URL ---
        // This maintains compatibility with your existing User schema that stores the image data.
        const profilePictureBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        // --- END LOGIC ---
        const user = await User_1.default.findByIdAndUpdate(userId, 
        // FIX: Update the database with the new Base64 string
        { profilePicture: profilePictureBase64 }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            profilePicture: user.profilePicture,
            user: {
                username: user.username,
                profilePicture: user.profilePicture
            }
        });
    }
    catch (error) {
        console.error('Update profile picture error:', error);
        res.status(500).json({ error: 'Failed to update profile picture' });
    }
});
router.get('/picture', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User_1.default.findById(userId).select('profilePicture username');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            profilePicture: user.profilePicture,
            username: user.username
        });
    }
    catch (error) {
        console.error('Get profile picture error:', error);
        res.status(500).json({ error: 'Failed to get profile picture' });
    }
});
exports.default = router;
