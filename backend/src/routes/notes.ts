import express, { Request, Response } from 'express';
import Note from '../models/Note';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all notes (files and folders) for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  // This route remains the same; it fetches all items for the user. 
  // The frontend handles filtering by parentId.
  const notes = await Note.find({ user: req.userId });
  res.json(notes);
});

// Get a single item (file or folder)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ error: 'Item not found' });
  res.json(note);
});

// notes.ts

// Create a note or folder
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  // DESTRUCTURE NEW FIELDS: tags, type, and parentId
  const { title, content, tags, type, parentId } = req.body;
  
  const note = new Note({ 
    title, 
    content, 
    tags, // <-- Correctly passing tags
    type, // <-- Correctly passing type
    parentId, // <-- Correctly passing parentId
    user: req.userId 
  });
  
  await note.save();
  res.status(201).json(note);
});

// Update a note or folder
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  // DESTRUCTURE NEW FIELDS: tags, type, and parentId
  const { title, content, tags, type, parentId } = req.body;
  
  // Create an update object with all potential fields
  const updateFields: any = { 
    title, 
    content, 
    tags, 
    type, 
    parentId 
  };
  
  // Use findOneAndUpdate to save all fields
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    updateFields,
    { new: true }
  );
  
  if (!note) return res.status(404).json({ error: 'Item not found' });
  res.json(note);
});


// Delete a note or folder (with cascading deletion for children)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const itemId = req.params.id;
  const userId = req.userId;

  // 1. Find and delete the specified item (the folder)
  const itemToDelete = await Note.findOneAndDelete({ _id: itemId, user: userId });

  if (!itemToDelete) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // 2. Implement Cascading Delete
  // If the deleted item was a folder, delete all its direct children
  if (itemToDelete.type === 'folder') {
    // This efficiently deletes all notes/folders whose parentId matches the deleted folder's ID
    await Note.deleteMany({ parentId: itemId, user: userId });
  }

  // 3. Success response
  res.status(204).send(); // 204 No Content is the standard response for successful deletion
});

export default router;