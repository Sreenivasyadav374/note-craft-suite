import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  user: mongoose.Types.ObjectId;
}

const NoteSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: false, default: "" },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model<INote>('Note', NoteSchema);
