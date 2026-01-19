"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Note_1 = __importDefault(require("../models/Note"));
const auth_1 = require("../middleware/auth");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
router.get("/", auth_1.authenticateToken, async (req, res) => {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const parentId = req.query.parentId;
    const filter = { user: userId };
    try {
        if (parentId === "null" || parentId === undefined) {
            // ✅ Root-level notes (no folder)
            filter.parentId = null;
        }
        else {
            // ✅ Notes inside a specific folder
            filter.parentId = new mongoose_1.default.Types.ObjectId(parentId);
        }
        const totalCount = await Note_1.default.countDocuments(filter);
        const notes = await Note_1.default.find(filter)
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
    }
    catch (error) {
        console.error("Error fetching paginated notes:", error);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});
// Get a single item (file or folder)
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    const note = await Note_1.default.findOne({ _id: req.params.id, user: req.userId });
    if (!note)
        return res.status(404).json({ error: 'Item not found' });
    res.json(note);
});
// notes.ts
// Create a note or folder
router.post('/', auth_1.authenticateToken, async (req, res) => {
    const { title, content, tags, type, parentId, reminderDate } = req.body;
    const note = new Note_1.default({
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
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    const { title, content, tags, type, parentId, reminderDate } = req.body;
    const updateFields = {
        title,
        content,
        tags,
        type,
        parentId,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        notificationSent: false
    };
    const note = await Note_1.default.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updateFields, { new: true });
    if (!note)
        return res.status(404).json({ error: 'Item not found' });
    res.json(note);
});
// Delete a note or folder (with cascading deletion for children)
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    const itemId = req.params.id;
    const userId = req.userId;
    // 1. Find and delete the specified item (the folder)
    const itemToDelete = await Note_1.default.findOneAndDelete({ _id: itemId, user: userId });
    if (!itemToDelete) {
        return res.status(404).json({ error: 'Item not found' });
    }
    // 2. Implement Cascading Delete
    // If the deleted item was a folder, delete all its direct children
    if (itemToDelete.type === 'folder') {
        // This efficiently deletes all notes/folders whose parentId matches the deleted folder's ID
        await Note_1.default.deleteMany({ parentId: itemId, user: userId });
    }
    // 3. Success response
    res.status(204).send();
});
router.get('/reminders/pending', auth_1.authenticateToken, async (req, res) => {
    const now = new Date();
    const notes = await Note_1.default.find({
        user: req.userId,
        reminderDate: { $lte: now, $ne: null },
        notificationSent: false
    });
    res.json(notes);
});
router.post('/reminders/:id/mark-sent', auth_1.authenticateToken, async (req, res) => {
    const note = await Note_1.default.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { notificationSent: true }, { new: true });
    if (!note)
        return res.status(404).json({ error: 'Note not found' });
    res.json(note);
});
exports.default = router;
