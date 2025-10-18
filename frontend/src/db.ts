import { openDB } from 'idb';
import { Note } from './context/NotesContext';

export const dbPromise = openDB('notes-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('notes')) {
      db.createObjectStore('notes', { keyPath: 'id' });
    }
  },
});

export const saveNotes = async (notes: Note[]) => {
  const db = await dbPromise;
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  for (const note of notes) {
    await store.put(note);
  }
  await tx.done;
};

export const getNotesFromIDB = async (): Promise<Note[]> => {
  const db = await dbPromise;
  const tx = db.transaction('notes', 'readonly');
  const store = tx.objectStore('notes');
  return store.getAll();
};
