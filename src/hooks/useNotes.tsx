import { useState, useEffect } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '../lib/api';

export function useNotes(token: string | null) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getNotes(token);
      setNotes(data);
    } catch (e) {
      setError('Failed to fetch notes');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, [token]);

  const addNote = async (title: string, content: string) => {
    if (!token) return;
    setLoading(true);
    const note = await createNote(token, title, content);
    setNotes((prev) => [...prev, note]);
    setLoading(false);
  };

  const editNote = async (id: string, title: string, content: string) => {
    if (!token) return;
    setLoading(true);
    const updated = await updateNote(token, id, title, content);
    setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
    setLoading(false);
  };

  const removeNote = async (id: string) => {
    if (!token) return;
    setLoading(true);
    await deleteNote(token, id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
    setLoading(false);
  };

  return {
    notes,
    loading,
    error,
    fetchNotes,
    addNote,
    editNote,
    removeNote,
  };
}
