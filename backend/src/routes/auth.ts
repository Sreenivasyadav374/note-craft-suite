import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const REFRESH_TOKEN_EXP_DAYS = 7;

// Register
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ error: 'Username already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed });
  await user.save();
  res.status(201).json({ message: 'User registered' });
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
  // Invalidate old refresh tokens for this user
  await RefreshToken.deleteMany({ user: user._id });
  // Generate new refresh token
  const refreshTokenValue = crypto.randomBytes(40).toString('hex');
  const expires = new Date(Date.now() + REFRESH_TOKEN_EXP_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: user._id, token: refreshTokenValue, expires });
  res.json({ token, refreshToken: refreshTokenValue });
});

// Refresh token endpoint (rotation)
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'No refresh token provided' });
  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored || stored.expires < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
  const user = await User.findById(stored.user);
  if (!user) return res.status(401).json({ error: 'User not found' });
  // Invalidate the used refresh token
  await stored.deleteOne();
  // Issue new refresh token (rotation)
  const newRefreshTokenValue = crypto.randomBytes(40).toString('hex');
  const expires = new Date(Date.now() + REFRESH_TOKEN_EXP_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: user._id, token: newRefreshTokenValue, expires });
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
  res.json({ token, refreshToken: newRefreshTokenValue });
});

// Logout endpoint: invalidate refresh token
router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }
  res.json({ message: 'Logged out' });
});

export default router;
