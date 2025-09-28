"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const REFRESH_TOKEN_EXP_DAYS = 7;
// Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' });
    const existing = await User_1.default.findOne({ username });
    if (existing)
        return res.status(409).json({ error: 'Username already exists' });
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = new User_1.default({ username, password: hashed });
    await user.save();
    res.status(201).json({ message: 'User registered' });
});
// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User_1.default.findOne({ username });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    // Invalidate old refresh tokens for this user
    await RefreshToken_1.default.deleteMany({ user: user._id });
    // Generate new refresh token
    const refreshTokenValue = crypto_1.default.randomBytes(40).toString('hex');
    const expires = new Date(Date.now() + REFRESH_TOKEN_EXP_DAYS * 24 * 60 * 60 * 1000);
    await RefreshToken_1.default.create({ user: user._id, token: refreshTokenValue, expires });
    res.json({ token, refreshToken: refreshTokenValue });
});
// Refresh token endpoint (rotation)
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ error: 'No refresh token provided' });
    const stored = await RefreshToken_1.default.findOne({ token: refreshToken });
    if (!stored || stored.expires < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    const user = await User_1.default.findById(stored.user);
    if (!user)
        return res.status(401).json({ error: 'User not found' });
    // Invalidate the used refresh token
    await stored.deleteOne();
    // Issue new refresh token (rotation)
    const newRefreshTokenValue = crypto_1.default.randomBytes(40).toString('hex');
    const expires = new Date(Date.now() + REFRESH_TOKEN_EXP_DAYS * 24 * 60 * 60 * 1000);
    await RefreshToken_1.default.create({ user: user._id, token: newRefreshTokenValue, expires });
    const token = jsonwebtoken_1.default.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ token, refreshToken: newRefreshTokenValue });
});
// Logout endpoint: invalidate refresh token
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await RefreshToken_1.default.deleteOne({ token: refreshToken });
    }
    res.json({ message: 'Logged out' });
});
exports.default = router;
