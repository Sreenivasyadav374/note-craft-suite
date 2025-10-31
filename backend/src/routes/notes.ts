import express, { Request, Response } from 'express';
import Note from '../models/Note';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import mongoose from "mongoose";

const router = express.Router();

router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const parentId = req.query.parentId as string | undefined;

  const filter: any = { user: userId };

  try {
    if (parentId === "null" || parentId === undefined) {
      // ✅ Root-level notes (no folder)
      filter.parentId = null;
    } else {
      // ✅ Notes inside a specific folder
      filter.parentId = new mongoose.Types.ObjectId(parentId);
    }

    const totalCount = await Note.countDocuments(filter);

    const notes = await Note.find(filter)
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit);

    res.json({
      notes,
      totalCount,
      limit,
      offset,
      parentId: parentId || null,
    });
  } catch (error) {
    console.error("Error fetching paginated notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
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
  const { title, content, tags, type, parentId, reminderDate } = req.body;

  const note = new Note({
    title,
    content,
    tags,
    type,
    parentId,
    reminderDate: reminderDate ? new Date(reminderDate) : null,
    notificationSent: false,
    user: req.userId
  });

  await note.save();
  res.status(201).json(note);
});

// Update a note or folder
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, content, tags, type, parentId, reminderDate } = req.body;

  const updateFields: any = {
    title,
    content,
    tags,
    type,
    parentId,
    reminderDate: reminderDate ? new Date(reminderDate) : null,
    notificationSent: false
  };

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
  res.status(204).send();
});

router.get('/reminders/pending', authenticateToken, async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const notes = await Note.find({
    user: req.userId,
    reminderDate: { $lte: now, $ne: null },
    notificationSent: false
  });
  res.json(notes);
});

router.post('/reminders/:id/mark-sent', authenticateToken, async (req: AuthRequest, res: Response) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { notificationSent: true },
    { new: true }
  );
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

export default router;