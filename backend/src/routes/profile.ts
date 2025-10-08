import express, { Request, Response } from 'express';
// Ensure you have an import for your custom authenticateToken and User model
import { authenticateToken, AuthRequest } from '../middleware/auth'; 
import User from '../models/User';

// ADDED: Multer Import
import multer from 'multer';

// ADDED: Multer Configuration
// Use memoryStorage so the file buffer is available in req.file
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Enforces the 5MB limit
});

const router = express.Router();

// FIXED ROUTE:
// 1. Middleware order is swapped: upload.single runs before authenticateToken.
// 2. The route logic reads the user ID from req.userId and the file from req.file.

router.post('/update-picture', upload.single('profilePicture'), authenticateToken, async (req: Request, res: Response) => {
  // Use 'any' type assertion to access properties added by middleware (userId and file)
  const augmentedReq = req as any; 
  
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

    const user = await User.findByIdAndUpdate(
      userId,
      // FIX: Update the database with the new Base64 string
      { profilePicture: profilePictureBase64 }, 
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
    const userId = (req as any).userId;

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
