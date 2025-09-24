import express, { Request, Response } from 'express';
import Note from '../models/Note';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all notes for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const notes = await Note.find({ user: req.userId });
  res.json(notes);
});

// Get a single note
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// Create a note
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;
  const note = new Note({ title, content, user: req.userId });
  await note.save();
  res.status(201).json(note);
});

// Update a note
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { title, content },
    { new: true }
  );
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// Delete a note
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.status(204).send();
});

export default router;
