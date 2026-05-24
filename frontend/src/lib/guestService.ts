// Guest notes service for localStorage-based operations

const GUEST_NOTES_KEY = 'guest_notes';

export interface GuestNote {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  type: 'file' | 'folder';
  parentId: string | null;
  reminderDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return 'guest-note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export function getGuestNotes(): GuestNote[] {
  try {
    const stored = localStorage.getItem(GUEST_NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get guest notes:', error);
    return [];
  }
}

export function saveGuestNotes(notes: GuestNote[]): void {
  try {
    localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Failed to save guest notes:', error);
  }
}

export function createGuestNote(
  title: string,
  content: string,
  tags: string[] = [],
  type: 'file' | 'folder' = 'file',
  parentId: string | null = null
): GuestNote {
  const now = new Date().toISOString();
  return {
    _id: generateId(),
    title,
    content,
    tags,
    type,
    parentId,
    reminderDate: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateGuestNote(
  id: string,
  updates: Partial<GuestNote>
): GuestNote | null {
  const notes = getGuestNotes();
  const index = notes.findIndex(n => n._id === id);

  if (index === -1) return null;

  const updatedNote = {
    ...notes[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  notes[index] = updatedNote;
  saveGuestNotes(notes);

  return updatedNote;
}

export function deleteGuestNote(id: string): boolean {
  const notes = getGuestNotes();
  const filtered = notes.filter(n => n._id !== id);

  if (filtered.length === notes.length) return false;

  saveGuestNotes(filtered);
  return true;
}

export function getGuestNotesPaginated(
  limit: number,
  offset: number,
  folderId: string | null = null
): { notes: GuestNote[]; totalCount: number } {
  const allNotes = getGuestNotes();

  // Filter by folder if specified
  const filtered = folderId
    ? allNotes.filter(n => n.parentId === folderId)
    : allNotes.filter(n => !n.parentId || n.parentId === null);

  // Sort by creation date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalCount = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    notes: paginated,
    totalCount
  };
}
