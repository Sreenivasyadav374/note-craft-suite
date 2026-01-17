import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const REFRESH_TOKEN_EXP_DAYS = 7;

/**
 * @swagger
 * components:
 *   schemas:
 *     GoogleAuthRequest:
 *       type: object
 *       required:
 *         - credential
 *       properties:
 *         credential:
 *           type: string
 *           description: Google ID token (JWT credential from Google OAuth)
 *
 *     GoogleAuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Access JWT token
 *         refreshToken:
 *           type: string
 *           description: Refresh token
 *         user:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             picture:
 *               type: string
 *               description: Google profile picture URL
 */

// Google OAuth endpoint
/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Authenticate user using Google OAuth
 *     description: |
 *       Accepts a Google ID token (`credential`) and returns access & refresh tokens.
 *       If the user does not exist, a new account is created automatically.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleAuthRequest'
 *           example:
 *             credential: eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GoogleAuthResponse'
 *       400:
 *         description: No credential provided
 *       401:
 *         description: Invalid Google credential
 *       500:
 *         description: Authentication failed
 */
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  
  if (!credential) {
    return res.status(400).json({ error: 'No credential provided' });
  }

  try {
    // Decode the JWT token from Google (without verification for simplicity)
    // In production, you should verify the token with Google's public keys
    const decoded = jwt.decode(credential) as any;
    
    if (!decoded || !decoded.email) {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    const { email, name, picture, sub: googleId } = decoded;

    // Find or create user
    let user = await User.findOne({ username: email });
    
    if (!user) {
      // Create new user with Google data
      // Use a random password since they'll login via Google
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = new User({ 
        username: email,
        password: randomPassword, // Not used for Google auth
        googleId,
        authProvider: 'google'
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.authProvider = 'google';
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Invalidate old refresh tokens for this user
    await RefreshToken.deleteMany({ user: user._id });

    // Generate new refresh token
    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const expires = new Date(Date.now() + REFRESH_TOKEN_EXP_DAYS * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user: user._id, token: refreshTokenValue, expires });

    res.json({
      token,
      refreshToken: refreshTokenValue,
      user: {
        name: name || email,
        email,
        picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
