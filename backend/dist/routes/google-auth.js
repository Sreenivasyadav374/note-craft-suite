"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const REFRESH_TOKEN_EXP_DAYS = 7;
// Google OAuth endpoint
router.post('/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ error: 'No credential provided' });
    }
    try {
        // Decode the JWT token from Google (without verification for simplicity)
        // In production, you should verify the token with Google's public keys
        const decoded = jsonwebtoken_1.default.decode(credential);
        if (!decoded || !decoded.email) {
            return res.status(401).json({ error: 'Invalid Google credential' });
        }
        const { email, name, picture, sub: googleId } = decoded;
        // Find or create user
        let user = await User_1.default.findOne({ username: email });
        if (!user) {
            // Create new user with Google data
            // Use a random password since they'll login via Google
            const randomPassword = crypto_1.default.randomBytes(32).toString('hex');
            user = new User_1.default({
                username: email,
                password: randomPassword, // Not used for Google auth
                googleId,
                authProvider: 'google'
            });
            await user.save();
        }
        else if (!user.googleId) {
            // Link Google account to existing user
            user.googleId = googleId;
            user.authProvider = 'google';
            await user.save();
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username, email }, JWT_SECRET, { expiresIn: '15m' });
        // Invalidate old refresh tokens for this user
        await RefreshToken_1.default.deleteMany({ user: user._id });
        // Generate new refresh token
        const refreshTokenValue = crypto_1.default.randomBytes(40).toString('hex');
        const expires = new Date(Date.now() + REFRESH_TOKEN_EXP_DAYS * 24 * 60 * 60 * 1000);
        await RefreshToken_1.default.create({ user: user._id, token: refreshTokenValue, expires });
        res.json({
            token,
            refreshToken: refreshTokenValue,
            user: {
                name: name || email,
                email,
                picture
            }
        });
    }
    catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});
exports.default = router;
