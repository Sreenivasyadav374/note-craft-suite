"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Note_1 = __importDefault(require("../models/Note"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all notes for the authenticated user
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const notes = await Note_1.default.find({ user: req.userId });
    res.json(notes);
});
// Get a single note
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    const note = await Note_1.default.findOne({ _id: req.params.id, user: req.userId });
    if (!note)
        return res.status(404).json({ error: 'Note not found' });
    res.json(note);
});
// Create a note
router.post('/', auth_1.authenticateToken, async (req, res) => {
    const { title, content } = req.body;
    const note = new Note_1.default({ title, content, user: req.userId });
    await note.save();
    res.status(201).json(note);
});
// Update a note
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    const { title, content } = req.body;
    const note = await Note_1.default.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { title, content }, { new: true });
    if (!note)
        return res.status(404).json({ error: 'Note not found' });
    res.json(note);
});
// Delete a note
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    const note = await Note_1.default.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!note)
        return res.status(404).json({ error: 'Note not found' });
    res.status(204).send();
});
exports.default = router;
