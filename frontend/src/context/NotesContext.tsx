import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { getNotes as fetchNotesFromAPI } from "../lib/api";
import { useAuthContext } from "./AuthContext";
import { usePreferences, SortOrder } from "./PreferencesContext";
import {
  dbPromise,
  saveNotesToIDB,
  removeNoteFromIDB,
  getNotesFromIDB,
  getNotesForSyncFromIDB,
} from "../db"; // IndexedDB helper
import {
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
} from "../lib/api";
import { useConnection } from "../context/ConnectionContext";

// ---------- Add / Update / Delete ----------
import { v4 as uuidv4 } from "uuid";

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  reminderDate?: Date | null;
  notificationSent?: boolean;
  type: "file" | "folder";
  parentId?: string | null;
  synced?: boolean; // for offline notes
  action?: "create" | "update" | "delete"; // <-- add this line
}

interface NotesContextType {
  notes: Note[];
  sortedNotes: Note[];
  setNotes: (notes: Note[]) => void;
  isLoading: boolean;
  refreshNotes: (offset?: number,folderId?:string) => Promise<void>; // Modified to accept offset
  loadMoreNotes: () => Promise<void>; // New function to load the next page
  hasMore: boolean; // Indicates if there are more notes to load
  totalCount: number; // Total number of notes available on the server
  addNoteOffline: (note: Note) => Promise<void>;
  updateNoteOffline: (note: Note) => Promise<void>;
  deleteNoteOffline: (noteId: string) => Promise<void>;
  //syncOfflineNotes: () => Promise<void>;
  removeNoteFromIDB: (noteId: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const NOTES_LIMIT = 20; // Define the page size constant

export function NotesProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuthContext();
  const { isOffline } = useConnection();
  const { preferences } = usePreferences();
  const sortOrder = preferences.defaultSortOrder;
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- New Pagination State ---
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  // Determine if there are more notes to fetch (total fetched < total available)
  const hasMore = notes.length < totalCount;
  // ----------------------------

  const isReplacingRef = useRef(false);

const fetchNotes = useCallback(
  async (currentOffset: number, folderId: string | null = null) => {
    if (!token) return;
    setIsLoading(true);
    try {
      // ✅ Pass limit, offset, and folderId to the API
      const response = await fetchNotesFromAPI(
        token,
        NOTES_LIMIT,
        currentOffset,
        folderId
      );

      const remoteNotes: Note[] = response.notes.map((note: any) => ({
        id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        reminderDate: note.reminderDate ? new Date(note.reminderDate) : null,
        notificationSent: note.notificationSent,
        type: note.type,
        parentId: note.parentId,
        synced: true,
        action: undefined,
      }));

      setNotes((prevNotes) => {
        // ✅ For numbered pagination (refreshNotes), always replace.
        if (currentOffset === 0 || isReplacingRef.current) {
          return remoteNotes;
        } else {
          // Infinite scroll behavior
          const newNotesMap = new Map();
          prevNotes.forEach((note) => newNotesMap.set(note.id, note));
          remoteNotes.forEach((note) => newNotesMap.set(note.id, note));
          return Array.from(newNotesMap.values());
        }
      });

      // ✅ Update pagination state
      setTotalCount(response.totalCount);
      setOffset(currentOffset + NOTES_LIMIT);

      // ✅ Save fetched notes for offline access
      await saveNotesToIDB(remoteNotes);
    } catch (error) {
      console.error("Failed to fetch notes from API:", error);

      // ✅ Offline fallback: get from IndexedDB and filter by folder
      const idbNotes = await getNotesFromIDB();
      const filteredNotes = folderId
        ? idbNotes.filter((n) => n.parentId === folderId)
        : idbNotes.filter((n) => !n.parentId);
      setNotes(filteredNotes);
      setTotalCount(filteredNotes.length);
    } finally {
      setIsLoading(false);
    }
  },
  [token]
);


  // Combined fetch for initial load and data refresh
const refreshNotes = useCallback(
  async (newOffset = 0, folderId: string | null = null) => {
    if (!isAuthenticated) return;
    isReplacingRef.current = true; // ✅ tell fetchNotes to REPLACE notes
    try {
      if (!isOffline) {
        // 👇 Pass folderId to fetchNotes
        await fetchNotes(newOffset, folderId);
      } else {
        const idbNotes = await getNotesFromIDB();
        // 👇 Filter notes for the current folder if folderId is given
        const filteredNotes = folderId
          ? idbNotes.filter((n) => n.parentId === folderId)
          : idbNotes.filter((n) => !n.parentId);
        setNotes(filteredNotes);
        setTotalCount(filteredNotes.length);
        setOffset(filteredNotes.length);
      }
    } finally {
      isReplacingRef.current = false;
    }
  },
  [isAuthenticated, isOffline, fetchNotes]
);


  const loadMoreNotes = useCallback(async () => {
    if (isOffline || isLoading || !hasMore) return;
    await fetchNotes(offset);
  }, [isOffline, isLoading, hasMore, offset, fetchNotes]);

  // Initial Data Load (and refetch on auth/online status change)
  useEffect(() => {
    if (isAuthenticated) {
      // Start the initial load from offset 0
      refreshNotes(0);
    }
  }, [isAuthenticated, refreshNotes]);

  // ... [omitting sortedNotes useMemo for brevity]
  const sortedNotes = useMemo(() => {
    const sortKey = sortOrder === "recent" ? "updatedAt" : "title";
    return [...notes].sort((a, b) => {
      if (sortKey === "title") {
        return a.title.localeCompare(b.title);
      }
      // Sort in-memory to handle merged remote/offline notes
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [notes, sortOrder]);

  // Placeholder IDB helper functions (you would implement these fully in db.ts)
  // async function saveNotesToIDB(notes: Note[]): Promise<void> { /* ... */ }
  // async function removeNoteFromIDB(noteId: string): Promise<void> { /* ... */ }
  // async function getNotesFromIDB(): Promise<Note[]> { /* ... */ }
  // async function getNotesForSyncFromIDB(): Promise<Note[]> { /* ... */ }

  // ---------- Add / Update / Delete Offline Handlers ----------

  // Use the new simplified sync logic provided in the prompt's context snippet
  // const syncOfflineNotes = async () => {
  //   if (!token) return;
  //   console.log("Starting offline sync...");

  //   const offlineNotes = await getNotesForSyncFromIDB();

  //   for (const note of offlineNotes) {
  //     try {
  //       if (note.action === "delete") {
  //         await deleteNoteApi(token, note.id);
  //         await removeNoteFromIDB(note.id);
  //         setNotes((prev) => prev.filter((n) => n.id !== note.id));
  //         console.log("✅ Synced deletion:", note.id);
  //         continue;
  //       }

  //       // Handle updates (synced notes that have been modified)
  //       if (note.action === "update" && note.synced) {
  //         const saved = await updateNote(
  //           token,
  //           note.id,
  //           note.title,
  //           note.content,
  //           note.tags,
  //           note.type,
  //           note.parentId
  //         );

  //         const syncedNote: Note = {
  //           ...note,
  //           synced: true,
  //           action: undefined,
  //           createdAt: new Date(saved.createdAt),
  //           updatedAt: new Date(saved.updatedAt),
  //         };

  //         await saveNotesToIDB([syncedNote]);
  //         setNotes((prev) =>
  //           prev.map((n) => (n.id === note.id ? syncedNote : n))
  //         );
  //         console.log("✅ Synced update:", note.title);
  //         continue;
  //       }

  //       // Handle creations (notes with UUID, indicating a new offline creation)
  //       if (note.action === "create" || !note.synced || note.id.includes("-")) {
  //         const saved = await createNote(
  //           token,
  //           note.title,
  //           note.content,
  //           note.tags,
  //           note.type,
  //           note.parentId
  //         );

  //         const syncedNote: Note = {
  //           ...note,
  //           id: saved._id, // replace UUID with Mongo _id
  //           synced: true,
  //           action: undefined,
  //           createdAt: new Date(saved.createdAt),
  //           updatedAt: new Date(saved.updatedAt),
  //         };

  //         // Remove old UUID version and save the new one
  //         await removeNoteFromIDB(note.id);
  //         await saveNotesToIDB([syncedNote]);

  //         setNotes((prev) => [
  //           syncedNote,
  //           ...prev.filter((n) => n.id !== note.id),
  //         ]);
  //         console.log("✅ Synced creation:", note.title);
  //         continue;
  //       }
  //     } catch (err) {
  //       console.error("❌ Failed to sync note:", note.id, err);
  //     }
  //   }

  //   console.log("✨ Offline sync complete");
  // };

  const addNoteOffline = async (note: Note) => {
    const newNote = {
      ...note,
      id: uuidv4(), // Use UUID for temporary offline ID
      synced: false,
      action: "create",
      updatedAt: new Date(),
      createdAt: new Date(),
    } as Note;

    // Add to local state (at the start to appear immediately)
    setNotes((prev) => [
      newNote,
      ...prev.map((n) =>
        n.id === note.id ? { ...n, updatedAt: new Date() } : n
      ),
    ]);

    // Save to IDB
    await saveNotesToIDB([newNote]);

    // Optimistically sync if online
    //if (!isOffline) syncOfflineNotes();
  };

  const updateNoteOffline = async (updatedNote: Note) => {
    const noteToSave: Note = {
      ...updatedNote,
      synced: false,
      action: updatedNote.action === "create" ? "create" : "update", // Preserve 'create' action if it was a new note
      updatedAt: new Date(),
    };

    // Update local state
    setNotes((prev) =>
      prev.map((n) => (n.id === noteToSave.id ? noteToSave : n))
    );

    // Save to IDB
    await saveNotesToIDB([noteToSave]);

    // Optimistically sync if online
    //if (!isOffline) syncOfflineNotes();
  };

  const deleteNoteOffline = async (noteId: string) => {
    // 1. Update local state
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    // 2. Mark for deletion in IDB
    const noteToDelete = notes.find((n) => n.id === noteId);
    if (noteToDelete && noteToDelete.synced) {
      // If it was synced, mark for remote deletion
      await saveNotesToIDB([
        { ...noteToDelete, action: "delete", synced: false },
      ]);
    } else {
      // If it was a purely offline creation, just remove from IDB
      await removeNoteFromIDB(noteId);
    }

    // 3. Optimistically sync if online
    //if (!isOffline) syncOfflineNotes();
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        sortedNotes,
        setNotes,
        isLoading,
        refreshNotes,
        loadMoreNotes, // Exported new function
        hasMore, // Exported new state
        totalCount, // Exported new state
        addNoteOffline,
        updateNoteOffline,
        deleteNoteOffline,
        //syncOfflineNotes,
        removeNoteFromIDB,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
