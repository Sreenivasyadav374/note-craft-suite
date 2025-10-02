import mongoose, { Document, Schema } from 'mongoose';

// Define the type for the note/folder
export type NoteType = 'file' | 'folder';

export interface INote extends Document {
  title: string;
  content: string;
  tags: string[]; // <-- NEW: Added tags
  user: mongoose.Types.ObjectId;
  type: NoteType; // <-- NEW: Added type
  parentId?: mongoose.Types.ObjectId | null; // <-- NEW: Added parentId
}

const NoteSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: false, default: "" },
  tags: { type: [String], required: false, default: [] }, // <-- NEW
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['file', 'folder'], default: 'file' }, // <-- NEW (ensures only 'file' or 'folder' are valid)
  parentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Note', 
    default: null, 
    required: false // Parent is optional (for root items)
  }, // <-- NEW
}, {
  timestamps: true // Tracks createdAt and updatedAt
});

export default mongoose.model<INote>('Note', NoteSchema);