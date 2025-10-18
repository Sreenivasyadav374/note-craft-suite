import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getNotes as fetchNotesFromAPI } from '../lib/api';
import { useAuthContext } from './AuthContext';
import { usePreferences, SortOrder } from './PreferencesContext';
import { dbPromise } from '../db'; // IndexedDB helper
import {
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
} from "../lib/api";

  // ---------- Add / Update / Delete ----------
  import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  reminderDate?: Date | null;
  notificationSent?: boolean;
  type: 'file' | 'folder';
  parentId?: string | null;
  synced?: boolean; // for offline notes
  action?: 'create' | 'update' | 'delete'; // <-- add this line
}

interface NotesContextType {
  notes: Note[];
  sortedNotes: Note[];
  setNotes: (notes: Note[]) => void;
  isLoading: boolean;
  refreshNotes: () => Promise<void>;
  addNoteOffline: (note: Note) => Promise<void>;
  updateNoteOffline: (note: Note) => Promise<void>;
  deleteNoteOffline: (noteId: string) => Promise<void>;
  syncOfflineNotes: () => Promise<void>;
  removeNoteFromIDB:(noteId: string)=>Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthContext();
  const { preferences } = usePreferences();

  // ---------- IndexedDB Helpers ----------
  const saveNotesToIDB = async (notesToSave: Note[]) => {
    const db = await dbPromise;
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    for (const note of notesToSave) {
      await store.put(note);
    }
    await tx.done;
  };

  const removeNoteFromIDB = async (noteId: string) => {
    const db = await dbPromise;
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    await store.delete(noteId);
    await tx.done;
  };

  const loadNotesFromIDB = async (): Promise<Note[]> => {
    const db = await dbPromise;
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    return store.getAll();
  };

  // ---------- Sorting ----------
  const sortNotes = (notesToSort: Note[], sortOrder: SortOrder): Note[] => {
    const sorted = [...notesToSort];
    switch (sortOrder) {
      case 'recent':
        return sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'oldest':
        return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      default:
        return sorted;
    }
  };

  const sortedNotes = useMemo(() => sortNotes(notes, preferences.defaultSortOrder), [
    notes,
    preferences.defaultSortOrder,
  ]);

  // ---------- Offline Load ----------
  useEffect(() => {
    const init = async () => {
      // Load from IndexedDB first (offline support)
      const offlineNotes = await loadNotesFromIDB();
      if (offlineNotes.length > 0) setNotes(offlineNotes);
      setIsLoading(false);

      // Then refresh from API if online
      if (token) await refreshNotes();
    };
    init();
  }, [token]);

  // ---------- Refresh from API ----------
  const refreshNotes = async () => {
  if (!token) return;

  setIsLoading(true);
  try {
    const data = await fetchNotesFromAPI(token);

    const parsed = data.map((note: any) => ({
      id: note._id,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
      updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
      reminderDate: note.reminderDate ? new Date(note.reminderDate) : null,
      notificationSent: note.notificationSent || false,
      type: note.type || 'file',
      parentId: note.parentId || null,
      synced: true,
    }));

    // Load offline notes from IndexedDB
    const offlineNotes = await loadNotesFromIDB();

    // Merge API notes with offline notes (offline notes overwrite API if same id)
    const mergedMap = new Map<string, Note>();
    parsed.forEach((n) => mergedMap.set(n.id, n));
    offlineNotes.forEach((n) => mergedMap.set(n.id, n));

    const mergedNotes = Array.from(mergedMap.values());

    // Update React state
    setNotes(mergedNotes);

    // Save merged notes to IndexedDB
    await saveNotesToIDB(mergedNotes);

  } catch (error) {
    console.error('Error fetching notes:', error);
  } finally {
    setIsLoading(false);
  }
};

const addNoteOffline = async (note: Note) => {
  // Ensure a unique ID is always present
  const safeNote = {
    ...note,
    id: note.id || uuidv4(), // generate one if it doesn't exist
    updatedAt: new Date(),
    createdAt: note.createdAt || new Date(),
  };

  // Update local state
  setNotes((prev) => [safeNote, ...prev]);

  // Save to IndexedDB
  await saveNotesToIDB([safeNote]);
};


const updateNoteOffline = async (note: Note) => {
  const updated: Note = {
    ...note,
    synced: false,
    action: 'update',
  };

  setNotes((prev) =>
    prev.map((n) => (n.id === note.id ? updated : n))
  );

  await saveNotesToIDB([updated]);
};


const deleteNoteOffline = async (noteId: string) => {
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;

  // Always mark delete — even for synced notes
  const marked: Note = {
    ...note,
    synced: false,
    action: 'delete',
  };

  // Save it back to IndexedDB for sync tracking
  await saveNotesToIDB([marked]);

  // Remove from UI immediately
  setNotes((prev) => prev.filter((n) => n.id !== noteId));
};



const syncOfflineNotes = async () => {
  if (!navigator.onLine || !token) return;

  const db = await dbPromise;
  const tx = db.transaction("notes", "readwrite");
  const store = tx.objectStore("notes");
  const allNotes: Note[] = await store.getAll();

  for (const note of allNotes) {
    // Process only unsynced or pending delete notes
    if (!note.synced || note.action === "delete") {
      try {
        // 🗑 DELETE flow
        if (note.action === "delete") {
          if (!note.id.includes("-")) {
            // Delete only if it exists on server (Mongo ObjectId)
            await deleteNoteApi(token, note.id);
          }

          // Remove from IndexedDB and UI
          await removeNoteFromIDB(note.id);
          setNotes((prev) => prev.filter((n) => n.id !== note.id));
          console.log("✅ Synced deletion:", note.id);
          continue;
        }

        // ✏️ UPDATE flow
        if (note.action === "update" && !note.id.includes("-")) {
          // Update only if it has a Mongo ObjectId
          const updated = await updateNote(
            token,
            note.id,
            note.title,
            note.content,
            note.tags,
            note.type,
            note.parentId,
            note.reminderDate ? note.reminderDate.toISOString() : null
          );

          const syncedNote: Note = {
            ...note,
            id: updated._id,
            synced: true,
            action: undefined,
            createdAt: new Date(updated.createdAt),
            updatedAt: new Date(updated.updatedAt),
          };

          await saveNotesToIDB([syncedNote]);
          setNotes((prev) =>
            prev.map((n) => (n.id === note.id ? syncedNote : n))
          );
          console.log("✅ Synced update:", note.id);
          continue;
        }

        // 🆕 CREATE flow (for UUID or action:create)
        if (note.action === "create" || note.id.includes("-")) {
          const saved = await createNote(
            token,
            note.title,
            note.content,
            note.tags,
            note.type,
            note.parentId
          );

          const syncedNote: Note = {
            ...note,
            id: saved._id, // replace UUID with Mongo _id
            synced: true,
            action: undefined,
            createdAt: new Date(saved.createdAt),
            updatedAt: new Date(saved.updatedAt),
          };

          // Remove old UUID version and save the new one
          await removeNoteFromIDB(note.id);
          await saveNotesToIDB([syncedNote]);

          setNotes((prev) => [
            syncedNote,
            ...prev.filter((n) => n.id !== note.id),
          ]);
          console.log("✅ Synced creation:", note.title);
          continue;
        }
      } catch (err) {
        console.error("❌ Failed to sync note:", note.id, err);
      }
    }
  }

  console.log("✨ Offline sync complete");
};



  return (
    <NotesContext.Provider
      value={{ notes, sortedNotes, setNotes, isLoading, refreshNotes, addNoteOffline, updateNoteOffline, deleteNoteOffline,syncOfflineNotes,removeNoteFromIDB }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within a NotesProvider');
  return context;
};
