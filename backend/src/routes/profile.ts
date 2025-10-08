import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

router.post('/update-picture', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ error: 'Profile picture is required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture },
      { new: true }
    ).select('-password');

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
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

router.get('/picture', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await User.findById(userId).select('profilePicture username');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      profilePicture: user.profilePicture,
      username: user.username
    });
  } catch (error) {
    console.error('Get profile picture error:', error);
    res.status(500).json({ error: 'Failed to get profile picture' });
  }
});

export default router;
