import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getNotes } from '../lib/api';
import { useAuthContext } from './AuthContext';
import { usePreferences, SortOrder } from './PreferencesContext';

interface Note {
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
}

interface NotesContextType {
  notes: Note[];
  sortedNotes: Note[];
  setNotes: (notes: Note[]) => void;
  isLoading: boolean;
  refreshNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthContext();
  const { preferences } = usePreferences();

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

  const sortedNotes = useMemo(() => {
    return sortNotes(notes, preferences.defaultSortOrder);
  }, [notes, preferences.defaultSortOrder]);

  const refreshNotes = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await getNotes(token);
      const parsed = data.map((note: any) => ({
        id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
        reminderDate: note.reminderDate ? new Date(note.reminderDate) : null,
        notificationSent: note.notificationSent || false,
        type: note.type || "file",
        parentId: note.parentId || null,
      }));
      setNotes(parsed);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshNotes();
  }, [token]);

  return (
    <NotesContext.Provider value={{ notes, sortedNotes, setNotes, isLoading, refreshNotes }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
