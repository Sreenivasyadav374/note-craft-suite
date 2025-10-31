import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { createNote, updateNote, deleteNote as deleteNoteApi } from "@/lib/api";
import { aiService } from "@/utils/aiService";
import { calendarService } from "@/services/calendarService";
import { useToast } from "@/hooks/use-toast";

export const useNoteActions = ({
  token,
  activeFolderId,
  addNoteOffline,
  updateNoteOffline,
  deleteNoteOffline,
  removeNoteFromIDB,
  refreshNotes,
  setNotes,
  notes,
  selectedNote,
  setSelectedNote,
  setIsEditing,
}: any) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isFixingContent, setIsFixingContent] = useState(false);

  // ---------------- CREATE NEW NOTE ----------------
  const createNewNote = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      let parsedNote;

      if (navigator.onLine && token) {
        const newNoteApi = await createNote(token, "Untitled Note", "", [], "file", activeFolderId);
        parsedNote = {
          id: newNoteApi._id,
          title: newNoteApi.title,
          content: newNoteApi.content,
          tags: newNoteApi.tags || [],
          createdAt: new Date(newNoteApi.createdAt),
          updatedAt: new Date(newNoteApi.updatedAt),
          type: "file",
          parentId: activeFolderId,
        };
      } else {
        parsedNote = {
          id: uuidv4(),
          title: "Untitled Note",
          content: "",
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          type: "file",
          parentId: activeFolderId,
          synced: false,
        };
      }
      // OFFLINECOMMENT
      //await addNoteOffline(parsedNote);
      setSelectedNote(parsedNote);
      setIsEditing(true);

      toast({
        title: "New note created",
        description: "Start writing your thoughts!",
      });
    } catch (error: any) {
      toast({
        title: "Error creating note",
        description: error.message || "Failed to create note.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, token, activeFolderId]);

  // ---------------- CREATE NEW FOLDER ----------------
  const createNewFolder = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const newFolderApi = await createNote(token, "New Folder", "", [], "folder", activeFolderId);
      await refreshNotes(0, activeFolderId);

      toast({
        title: "New folder created",
        description: "Rename your new folder and start organizing!",
      });
    } catch (error: any) {
      toast({
        title: "Error creating folder",
        description: error.message || "Failed to create folder.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, token, activeFolderId]);

  // ---------------- DELETE NOTE/FOLDER ----------------
  const deleteNote = useCallback(async (noteToDelete: any) => {
    if (!noteToDelete) return;

    try {
      if (navigator.onLine && token) {
        await deleteNoteApi(token, noteToDelete.id);
        await removeNoteFromIDB(noteToDelete.id);
      } else {
        await deleteNoteOffline(noteToDelete.id);
      }

      setNotes((prev: any) => prev.filter((n: any) => n.id !== noteToDelete.id));
      toast({
        title: "Deleted",
        description: navigator.onLine
          ? "Item removed successfully."
          : "Deleted offline — will sync later.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting note",
        description: error.message || "Failed to delete item.",
        variant: "destructive",
      });
    }
  }, [token]);

  // ---------------- SAVE NOTE ----------------
  const saveNote = useCallback(async (note: any, fields: any) => {
    try {
      const { title, content, tags, reminderDate } = fields;
      const tagsArray = tags.split(",").map((t: string) => t.trim()).filter(Boolean);

      let updatedNote;

      if (navigator.onLine && token && note.synced !== false) {
        const updated = await updateNote(
          token,
          note.id,
          title.trim() || "Untitled Note",
          content,
          tagsArray,
          note.type,
          note.parentId,
          reminderDate || null
        );
        updatedNote = { ...updated, synced: true };
      } else {
        updatedNote = { ...note, title, content, tags: tagsArray, updatedAt: new Date(), synced: false };
      }
      // OFFLINECOMMENT
      //await updateNoteOffline(updatedNote);
      setSelectedNote(updatedNote);
      setIsEditing(false);

      toast({
        title: "Saved",
        description: navigator.onLine
          ? "Changes saved successfully."
          : "Saved offline — will sync when online.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving note",
        description: error.message || "Failed to save changes.",
        variant: "destructive",
      });
    }
  }, [token]);

  // ---------------- AI: SUGGESTIONS ----------------
  const suggestAI = useCallback(async (title: string, content: string, setFields: Function) => {
    if (content.trim().length < 20) {
      toast({
        title: "Cannot suggest yet",
        description: "Note must be at least 20 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSuggesting(true);
    toast({ title: "AI Generating Suggestions..." });

    try {
      const suggestions = await aiService.generateNoteSuggestion(title, content);
      if (suggestions) {
        setFields({
          title: suggestions.suggestedTitle,
          tags: suggestions.suggestedTags.join(", "),
        });
        toast({
          title: "AI Suggestions Applied",
          description: `Title: ${suggestions.suggestedTitle}`,
        });
      }
    } catch {
      toast({
        title: "AI Suggestion Failed",
        description: "Error contacting AI service.",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  }, []);

  // ---------------- AI: FIX CONTENT ----------------
  const fixContentAI = useCallback(async (content: string, setContent: Function) => {
    if (!content.trim()) {
      toast({ title: "Cannot enhance empty note" });
      return;
    }
    setIsFixingContent(true);
    toast({ title: "Enhancing content..." });

    try {
      const fixed = await aiService.fixGrammarAndSpelling(content);
      if (fixed) {
        setContent(fixed);
        toast({ title: "Content Enhanced!" });
      }
    } catch {
      toast({
        title: "Enhancement Failed",
        description: "Error contacting AI service.",
        variant: "destructive",
      });
    } finally {
      setIsFixingContent(false);
    }
  }, []);

  // ---------------- EXPORT TO CALENDAR ----------------
  const exportCalendar = useCallback((note: any, provider: string) => {
    if (!note?.reminderDate) {
      toast({
        title: "No reminder set",
        description: "Please set a reminder date first.",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date(note.reminderDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = {
      title: note.title,
      description: note.content.replace(/<[^>]*>/g, "").substring(0, 500),
      startDate,
      endDate,
    };

    calendarService[`addTo${provider.charAt(0).toUpperCase() + provider.slice(1)}Calendar`](event);
    toast({ title: "Calendar export started" });
  }, []);

  return {
    createNewNote,
    createNewFolder,
    deleteNote,
    saveNote,
    suggestAI,
    fixContentAI,
    exportCalendar,
    isCreating,
    isSuggesting,
    isFixingContent,
  };
};
