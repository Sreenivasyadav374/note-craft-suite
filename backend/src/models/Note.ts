import mongoose, { Document, Schema } from 'mongoose';

// Define the type for the note/folder
export type NoteType = 'file' | 'folder';

export interface INote extends Document {
  title: string;
  content: string;
  tags: string[];
  user: mongoose.Types.ObjectId;
  type: NoteType;
  parentId?: mongoose.Types.ObjectId | null;
  reminderDate?: Date | null;
  notificationSent?: boolean;
}

const NoteSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: false, default: "" },
  tags: { type: [String], required: false, default: [] },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['file', 'folder'], default: 'file' },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Note',
    default: null,
    required: false
  },
  reminderDate: { type: Date, required: false, default: null },
  notificationSent: { type: Boolean, required: false, default: false }
}, {
  timestamps: true
});

export default mongoose.model<INote>('Note', NoteSchema);