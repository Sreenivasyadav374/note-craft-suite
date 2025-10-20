import { openDB } from 'idb';
import { Note } from './context/NotesContext';

/**
 * IndexedDB Database Promise Setup
 * Uses 'notes-db' database with 'notes' object store.
 * The 'id' field of the Note interface is used as the key path.
 */
export const dbPromise = openDB('notes-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('notes')) {
      db.createObjectStore('notes', { keyPath: 'id' });
    }
  },
});

/**
 * Saves or updates a list of notes in IndexedDB.
 * This supports saving notes fetched remotely (synced) and notes created/modified offline (unsynced).
 * @param notes The array of Note objects to save.
 */
export const saveNotesToIDB = async (notes: Note[]) => {
  const db = await dbPromise;
  // Use a transaction for multiple puts to ensure atomicity
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  for (const note of notes) {
    // put() updates if the key (id) exists, or inserts otherwise
    await store.put(note);
  }
  await tx.done;
};

/**
 * Retrieves all notes currently stored in IndexedDB.
 * This is used as the source of truth when the application is offline.
 * @returns A promise resolving to an array of all Note objects.
 */
export const getNotesFromIDB = async (): Promise<Note[]> => {
  const db = await dbPromise;
  return db.getAll('notes');
};

/**
 * Deletes a single note from IndexedDB by its ID.
 * This is used after a note is successfully synced for deletion, or if a newly created offline note is deleted before syncing.
 * @param noteId The ID of the note to remove.
 */
export const removeNoteFromIDB = async (noteId: string) => {
  const db = await dbPromise;
  await db.delete('notes', noteId);
};

/**
 * Retrieves all notes that are marked for synchronization (i.e., not yet synced with the server).
 * This supports the offline-first approach by identifying local changes that need to be pushed when connectivity is restored.
 * @returns A promise resolving to an array of unsynced Note objects.
 */
export const getNotesForSyncFromIDB = async (): Promise<Note[]> => {
  const db = await dbPromise;
  const notes = await db.getAll('notes');

  // Filter notes that are either unsynced OR have a pending action ('create', 'update', 'delete')
  // We check for the 'action' property which is set by the offline handlers in NotesContext.
  return notes.filter(note => !note.synced || note.action);
};