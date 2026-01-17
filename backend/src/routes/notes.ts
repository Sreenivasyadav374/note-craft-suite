import express, { Request, Response } from 'express';
import Note from '../models/Note';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Note ID
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         user:
 *           type: string
 *           description: User ID
 *         type:
 *           type: string
 *           enum: [file, folder]
 *         parentId:
 *           type: string
 *           nullable: true
 *         reminderDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         notificationSent:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     CreateNoteRequest:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         type:
 *           type: string
 *           enum: [file, folder]
 *         parentId:
 *           type: string
 *           nullable: true
 *         reminderDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 * 
 *     UpdateNoteRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         type:
 *           type: string
 *           enum: [file, folder]
 *         parentId:
 *           type: string
 *           nullable: true
 *         reminderDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 * 
 *     PaginatedNotesResponse:
 *       type: object
 *       properties:
 *         notes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Note'
 *         totalCount:
 *           type: integer
 *         limit:
 *           type: integer
 *         offset:
 *           type: integer
 */


/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Get all notes for the authenticated user with pagination
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notes per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notes to skip
 *     responses:
 *       200:
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedNotesResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  
  // 1. Get query parameters for pagination and set defaults
  // The 'limit' dictates how many items to return per request (e.g., 20)
  const limit = parseInt(req.query.limit as string) || 20; 
  // The 'offset' dictates how many items to skip (e.g., 0 for page 1, 20 for page 2)
  const offset = parseInt(req.query.offset as string) || 0; 
  
  // 2. Define the base filter (all items belonging to the user)
  const filter = { user: userId };
  
  try {
    // 3. Get the total count of documents matching the filter (important for frontend UI)
    const totalCount = await Note.countDocuments(filter);

    // 4. Fetch the notes with sorting, skipping, and limiting
    // We sort by 'updatedAt' descending to get the most recently modified notes first
    const notes = await Note.find(filter)
      .sort({ updatedAt: -1 }) 
      .skip(offset)             
      .limit(limit);            

    // 5. Send the paginated notes along with the total count
    res.json({
      notes,
      totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching paginated notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get a single item (file or folder)
/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     summary: Get a note or folder by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Item not found
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ error: 'Item not found' });
  res.json(note);
});

// notes.ts

// Create a note or folder
/**
 * @swagger
 * /notes:
 *   post:
 *     summary: Create a new note or folder
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNoteRequest'
 *           example:
 *             title: "Untitled Note"
 *             content: ""
 *             tags: []
 *             type: "file"
 *             parentId: null        # ✅ null for top-level note
 *             reminderDate: null
 *     responses:
 *       201:
 *         description: Note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         description: Invalid request (e.g., invalid parentId)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
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
/**
 * @swagger
 * /notes/{id}:
 *   put:
 *     summary: Update an existing note or folder
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: "ID of the note to update (ObjectId)"
 *         required: true
 *         schema:
 *           type: string
 *           example: "64e4c6f5a2c3b6d9f7e2c1a8"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNoteRequest'
 *           example:
 *             title: "Updated Note Title"
 *             content: "Updated content of the note"
 *             tags: ["work","important"]
 *             type: "file"
 *             parentId: null
 *             reminderDate: "2026-01-20T10:00:00.000Z"
 *     responses:
 *       200:
 *         description: Note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         description: Invalid request (e.g., invalid parentId)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Internal server error
 */
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
/**
 * @swagger
 * /notes/{id}:
 *   delete:
 *     summary: Delete a note or folder (cascading deletion for children)
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       204:
 *         description: Note deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /notes/reminders/pending:
 *   get:
 *     summary: Get pending reminders
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending reminders
 */
router.get('/reminders/pending', authenticateToken, async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const notes = await Note.find({
    user: req.userId,
    reminderDate: { $lte: now, $ne: null },
    notificationSent: false
  });
  res.json(notes);
});

/**
 * @swagger
 * /notes/reminders/{id}/mark-sent:
 *   post:
 *     summary: Mark reminder as sent
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
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