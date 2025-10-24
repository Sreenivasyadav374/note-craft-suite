import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useNotes } from "../context/NotesContext";
import { usePreferences } from "../context/PreferencesContext";
import {
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
} from "../lib/api";
import { notificationService } from "../services/notificationService";
import { reminderService } from "../services/reminderService";
import { calendarService } from "../services/calendarService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { aiService } from "../utils/aiService";
import { useIsMobile } from "@/hooks/use-mobile";
import { v4 as uuidv4 } from "uuid";
import React, { Suspense } from "react";
import SidebarControls from "@/components/SidebarControls";
import PaginationControls from "@/components/PaginationControls";
import AppHeader from "@/components/AppHeader";
const LazyMainNoteContent = React.lazy(() => import("./MainNoteContent"));
import NoteList from "./NoteList";
import SelectNoteCard from "./SelectNoteCard";

const LazyProfileDrawer = React.lazy(() => import("./ProfileDrawer"));

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
  synced?: boolean; // for offline notes
}

const NotesApp = () => {
  const navigate = useNavigate();
  const {
    notes,
    setNotes,
    isLoading: notesLoading,
    addNoteOffline,
    updateNoteOffline,
    deleteNoteOffline,
    syncOfflineNotes,
    removeNoteFromIDB,
    totalCount,
    refreshNotes, // 👈 NEW
  } = useNotes();

  const { preferences } = usePreferences();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const memoizedSelectedNote = useMemo(() => selectedNote, [selectedNote]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editReminderDate, setEditReminderDate] = useState<string>("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isFixingContent, setIsFixingContent] = useState(false);
  const [aiFixTrigger, setAiFixTrigger] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const { toast } = useToast();

  const { token, isAuthenticated, userProfile } = useAuthContext();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"list" | "note">("list");

  const NOTES_PER_PAGE = 20; // same as NOTES_LIMIT
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalCount / NOTES_PER_PAGE);

  const [folderHistory, setFolderHistory] = useState<string[]>([]);

  // Derive the activeFolderId from the history stack.
  // If the stack is empty, we are in the root (parentId is null).
  const activeFolderId =
    folderHistory.length > 0 ? folderHistory[folderHistory.length - 1] : null;

  useEffect(() => {
    const initNotifications = async () => {
      if (!preferences.notificationsEnabled) return;

      const hasPermission = await notificationService.requestPermission();
      if (hasPermission) {
        toast({
          title: "Notifications enabled",
          description: "You'll receive reminders for your notes.",
        });
      }
    };

    if (isAuthenticated) {
      initNotifications();
    }
  }, [isAuthenticated, preferences.notificationsEnabled, toast]);

  useEffect(() => {
    if (!token || !preferences.notificationsEnabled) return;

    notificationService.startReminderCheck(token, async () => {
      await reminderService.checkPendingReminders(token);
    });

    return () => {
      notificationService.stopReminderCheck();
    };
  }, [token, preferences.notificationsEnabled]);

  const createNewFolder = async () => {
    if (!token || isCreating) return;

    setIsCreating(true);
    const newFolderData = {
      title: "New Folder",
      content: "",
      tags: [],
      type: "folder",
      parentId: activeFolderId,
    };

    try {
      const savedFolderApi = await createNote(
        token,
        newFolderData.title,
        newFolderData.content,
        newFolderData.tags,
        "folder",
        newFolderData.parentId
      );

      const parsedFolder: Note = {
        id: savedFolderApi._id,
        title: savedFolderApi.title,
        content: savedFolderApi.content,
        tags: savedFolderApi.tags || [],
        createdAt: new Date(savedFolderApi.createdAt),
        updatedAt: new Date(savedFolderApi.updatedAt),
        reminderDate: savedFolderApi.reminderDate
          ? new Date(savedFolderApi.reminderDate)
          : null,
        notificationSent: savedFolderApi.notificationSent || false,
        type: "folder",
        parentId: savedFolderApi.parentId || null,
      };

      setNotes([parsedFolder, ...notes]);
      openFolder(parsedFolder.id);
      startEditing(parsedFolder);

      toast({
        title: "New folder created",
        description: "Rename your new folder and start organizing!",
      });
    } catch (error: any) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create folder.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const createNewNote = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      let parsedNote: Note;

      if (navigator.onLine && token) {
        // Online mode: create note via API
        const newNoteApi = await createNote(
          token,
          "Untitled Note",
          "",
          [],
          "file",
          activeFolderId
        );

        parsedNote = {
          id: newNoteApi._id,
          title: newNoteApi.title,
          content: newNoteApi.content,
          tags: newNoteApi.tags || [],
          createdAt: newNoteApi.createdAt
            ? new Date(newNoteApi.createdAt)
            : new Date(),
          updatedAt: newNoteApi.updatedAt
            ? new Date(newNoteApi.updatedAt)
            : new Date(),
          reminderDate: newNoteApi.reminderDate
            ? new Date(newNoteApi.reminderDate)
            : null,
          notificationSent: newNoteApi.notificationSent || false,
          type: "file",
          parentId: activeFolderId,
        };
      } else {
        // Offline mode: create locally
        parsedNote = {
          id: uuidv4(),
          title: "Untitled Note",
          content: "",
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          reminderDate: null,
          notificationSent: false,
          type: "file",
          parentId: activeFolderId,
          synced: false, // mark as offline
        };
      }

      // Add note to state & IndexedDB using your NotesContext helper
      await addNoteOffline(parsedNote);

      // Set selected note and editing state
      setSelectedNote(parsedNote);
      setIsEditing(true);
      setEditTitle(parsedNote.title);
      setEditContent(parsedNote.content);
      setEditTags("");
      setEditReminderDate(
        parsedNote.reminderDate
          ? new Date(parsedNote.reminderDate).toISOString().slice(0, 16)
          : ""
      );

      toast({
        title: "New note created",
        description: "Start writing your thoughts!",
      });
    } catch (error: any) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create note.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // --- Delete (confirmDelete) ---
  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      if (navigator.onLine && token) {
        // ✅ Delete from server
        await deleteNoteApi(token, noteToDelete.id);

        // ✅ Also remove from IndexedDB (to prevent reappearing after refresh)
        await removeNoteFromIDB(noteToDelete.id);
      } else {
        // 📴 Offline delete
        await deleteNoteOffline(noteToDelete.id);
      }

      // ✅ Update UI
      setNotes(notes.filter((note) => note.id !== noteToDelete.id));

      if (selectedNote?.id === noteToDelete.id) {
        setSelectedNote(null);
        setIsEditing(false);
      }

      toast({
        title: "Item deleted",
        description: navigator.onLine
          ? "Item removed successfully."
          : "Deleted offline — will sync later.",
      });
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete item.",
        variant: "destructive",
      });
    } finally {
      setNoteToDelete(null);
    }
  };

  const startEditing = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(", "));
    if (note.reminderDate) {
      // Use the existing saved time correctly in local timezone
      const local = new Date(note.reminderDate);
      const localISOString = new Date(
        local.getTime() - local.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setEditReminderDate(localISOString);
    } else {
      // Default: same day 12:00 PM
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const defaultISOString = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      setEditReminderDate(defaultISOString);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTags(selectedNote.tags.join(", "));
      setEditReminderDate(
        selectedNote.reminderDate
          ? new Date(selectedNote.reminderDate).toISOString().slice(0, 16)
          : ""
      );
    }
  };

  const openFolder = useCallback(
    (folderId: string) => {
      // Only push if we are not already in that folder
      if (folderId !== activeFolderId) {
        setFolderHistory((prev) => [...prev, folderId]);
        setSearchTerm(""); // Clear search state on navigation
        setSelectedNote(null); // Deselect any currently selected item
      }
      // Set mobile view to list (if applicable)
      // setMobileView("list");
    },
    [
      activeFolderId,
      setSearchTerm,
      setSelectedNote /* add other state setters */,
    ]
  );

  const navigateBack = useCallback(() => {
    if (folderHistory.length > 0) {
      // 💥 CRITICAL: Remove the last item from the history stack
      setFolderHistory((prev) => prev.slice(0, -1));

      // Reset states
      setSearchTerm("");
      setSelectedNote(null);
      setIsEditing(false);
    }
    // setMobileView("list");
  }, [
    folderHistory.length,
    setSearchTerm,
    setSelectedNote,
    setIsEditing /* add other state setters */,
  ]);

  // You must pass this 'navigateBack' handler to the SidebarControls component.

  const fixContentWithAI = async () => {
    if (!token || !selectedNote || selectedNote.type === "folder") return;
    if (isFixingContent) return;

    const contentToFix = editContent;

    if (!contentToFix || contentToFix.trim().length === 0) {
      toast({
        title: "Cannot enhance empty note",
        description: "The content area is empty.",
      });
      return;
    }

    setIsFixingContent(true);
    toast({
      title: "Enhancing content...",
      description: "The AI is checking grammar and spelling.",
      duration: 3000,
    });

    try {
      const fixedContent = await aiService.fixGrammarAndSpelling(contentToFix);

      if (fixedContent) {
        setEditContent(fixedContent);
        setAiFixTrigger((prev) => prev + 1);

        toast({
          title: "Content Enhanced!",
          description: "Grammar and spelling have been polished.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Enhancement Failed",
          description: "The AI could not process the content.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("AI Content Fix Error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to AI service.",
        variant: "destructive",
      });
    } finally {
      setIsFixingContent(false);
    }
  };

  const currentNotes = useMemo(() => {
    // 'notes' is the full array of all notes and folders from your context
    let itemsToDisplay = notes.filter(
      // 💥 CRITICAL: Filter notes/folders whose parentId matches the current activeFolderId.
      (item) => item.parentId === activeFolderId
    );

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      itemsToDisplay = itemsToDisplay.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerSearchTerm) ||
          (note.type === "file" &&
            note.content.toLowerCase().includes(lowerSearchTerm)) ||
          note.tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm))
      );
    }

    itemsToDisplay.sort((a, b) => {
      // Always show folders first
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      // Then apply user's preferred sort order
      switch (preferences.defaultSortOrder) {
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "recent":
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

    return itemsToDisplay;
  }, [
    notes,
    activeFolderId,
    searchTerm /* add other dependencies like sorting state */,
  ]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      const offset = (page - 1) * NOTES_PER_PAGE;
      setCurrentPage(page);
      // Assuming refreshNotes is memoized or imported correctly
      refreshNotes(offset);
    },
    [totalPages, setCurrentPage, refreshNotes]
  );

  const memoizedHandleNoteSelect = useCallback(
    (note) => {
      setSelectedNote(note);
      setIsEditing(false);
      setMobileView("note");
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditTags(note.tags.join(", "));
      setEditReminderDate(
        note.reminderDate
          ? new Date(note.reminderDate).toISOString().slice(0, 16)
          : ""
      );
    },
    [
      setSelectedNote,
      setIsEditing,
      setMobileView,
      setEditTitle,
      setEditContent,
      setEditTags,
      setEditReminderDate,
    ]
  );

  const handleItemSelect = useCallback(
    (item: Note) => {
      // Use the combined Note | Folder type
      if (item.type === "folder") {
        openFolder(item.id);
      } else {
        // 💥 CORRECTED: Call the memoized note handler directly
        memoizedHandleNoteSelect(item);
      }
    },
    // 💥 CORRECTED DEPENDENCIES:
    // It now depends only on openFolder and the memoized note handler.
    [openFolder, memoizedHandleNoteSelect]
  );

  const handleItemDeleteClick = useCallback(
    (e: React.MouseEvent, item: Note) => {
      e.stopPropagation();
      setNoteToDelete(item);
    },
    [setNoteToDelete]
  );

  const memoizedSaveNote = useCallback(async () => {
    if (!selectedNote) return;

    try {
      const tagsArray = editTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      const contentToSave = selectedNote.type === "file" ? editContent : "";
      const reminderDateValue = editReminderDate
        ? new Date(editReminderDate).toISOString()
        : null;

      let updatedNote: Note;

      if (navigator.onLine && token && selectedNote.synced !== false) {
        // --- ONLINE UPDATE ---
        const updated = await updateNote(
          token,
          selectedNote.id,
          editTitle.trim() ||
            (selectedNote.type === "folder"
              ? "Untitled Folder"
              : "Untitled Note"),
          contentToSave,
          tagsArray,
          selectedNote.type,
          selectedNote.parentId,
          reminderDateValue
        );

        updatedNote = {
          id: updated._id,
          title: updated.title,
          content: updated.content,
          tags: updated.tags || [],
          createdAt: new Date(updated.createdAt),
          updatedAt: new Date(updated.updatedAt),
          reminderDate: updated.reminderDate
            ? new Date(updated.reminderDate)
            : null,
          notificationSent: updated.notificationSent || false,
          type: updated.type,
          parentId: updated.parentId || null,
          synced: true,
        };
      } else {
        // --- OFFLINE UPDATE ---
        updatedNote = {
          ...selectedNote,
          title: editTitle.trim(),
          content: contentToSave,
          tags: tagsArray,
          updatedAt: new Date(),
          reminderDate: reminderDateValue ? new Date(reminderDateValue) : null,
          synced: false,
        };
      }

      // Update locally (IndexedDB + Context)
      await updateNoteOffline(updatedNote);

      setSelectedNote(updatedNote);
      setIsEditing(false);

      toast({
        title: "Item saved",
        description: navigator.onLine
          ? "Changes saved successfully."
          : "Saved offline — will sync when online.",
      });
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save changes.",
        variant: "destructive",
      });
    }
  }, [
    selectedNote,
    editTitle,
    editContent,
    editTags,
    editReminderDate,
    token,
    updateNote,
    updateNoteOffline,
    setIsEditing,
    setSelectedNote,
    toast,
  ]);

  const memoizedCancelEditing = useCallback(() => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTags(selectedNote.tags.join(", "));
      setEditReminderDate(
        selectedNote.reminderDate
          ? new Date(selectedNote.reminderDate).toISOString().slice(0, 16)
          : ""
      );
    }
  }, [
    selectedNote,
    setIsEditing,
    setEditTitle,
    setEditContent,
    setEditTags,
    setEditReminderDate,
  ]);

  // 4. Memoize `handleAISuggestion`
  const memoizedHandleAISuggestion = useCallback(async () => {
    if (
      !selectedNote ||
      selectedNote.type === "folder" ||
      !token ||
      isSuggesting
    )
      return;

    const currentTitle = editTitle;
    const currentContent = editContent;

    if (currentContent.trim().length < 20) {
      toast({
        title: "Cannot suggest yet",
        description:
          "Note content must be at least 20 characters long for AI analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsSuggesting(true);
    toast({
      title: "Generating AI Suggestions...",
      description:
        "Gemini is analyzing your note content. This may take a moment.",
      duration: 5000,
    });

    try {
      const suggestions = await aiService.generateNoteSuggestion(
        currentTitle,
        currentContent
      );

      if (suggestions) {
        // Apply suggestions to the editing state
        setEditTitle(suggestions.suggestedTitle);
        setEditTags(suggestions.suggestedTags.join(", "));

        toast({
          title: "AI Suggestions Applied! ✨",
          description: `New Title: "${
            suggestions.suggestedTitle
          }". New Tags: ${suggestions.suggestedTags.join(", ")}`,
        });
      } else {
        toast({
          title: "AI Suggestion Failed",
          description:
            "Could not get suggestions. Check the console for errors.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error during AI Suggestion",
        description:
          "An unexpected error occurred while communicating with the AI service.",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  }, [
    selectedNote,
    editTitle,
    editContent,
    token,
    isSuggesting,
    setEditTitle,
    setEditTags,
    setIsSuggesting,
    toast /* aiService */, // Add aiService if it's not stable
  ]);

  // 4. Fix fixContentWithAI dependencies
  const memoizedFixContentWithAI = useCallback(fixContentWithAI, [
    token,
    selectedNote,
    isFixingContent,
    editContent,
    setEditContent,
    setAiFixTrigger,
    toast,
  ]);

  const memoizedStartEditing = useCallback(
    (note) => {
      setSelectedNote(note);
      setIsEditing(true);
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditTags(note.tags.join(", "));
      if (note.reminderDate) {
        const local = new Date(note.reminderDate);
        const localISOString = new Date(
          local.getTime() - local.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        setEditReminderDate(localISOString);
      } else {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const defaultISOString = new Date(
          today.getTime() - today.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        setEditReminderDate(defaultISOString);
      }
      // Note: The function itself is passed as a callback to create a stable reference.
    },
    [
      setSelectedNote,
      setIsEditing,
      setEditTitle,
      setEditContent,
      setEditTags,
      setEditReminderDate,
    ]
  );

  // ✅ NEW (Stable reference using useCallback):
  const handleMobileBack = useCallback(() => {
    setMobileView("list");
  }, [setMobileView]); // The dependency (setMobileView) is a stable state setter

  const memoizedExportToCalendar = useCallback(
    (provider) => {
      if (!selectedNote || !selectedNote.reminderDate) {
        toast({
          title: "No reminder set",
          description:
            "Please set a reminder date before exporting to calendar.",
          variant: "destructive",
        });
        return;
      }

      const startDate = new Date(selectedNote.reminderDate);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      const event = {
        title: selectedNote.title,
        description: selectedNote.content
          .replace(/<[^>]*>/g, "")
          .substring(0, 500),
        startDate,
        endDate,
      };

      switch (provider) {
        case "google":
          calendarService.addToGoogleCalendar(event);
          break;
        case "outlook":
          calendarService.addToOutlookCalendar(event);
          break;
        case "apple":
          calendarService.addToAppleCalendar(event);
          break;
        case "ics":
          calendarService.downloadICSFile(event);
          break;
      }

      toast({
        title: "Calendar export initiated",
        description: `Opening ${provider} calendar...`,
      });
    },
    [
      selectedNote,
      toast,
      calendarService, // Add calendarService if it's not stable
    ]
  );

  const memoizedCreateNewNote = useCallback(createNewNote, [
    isCreating,
    token,
    addNoteOffline,
    activeFolderId,
    setSelectedNote,
    setIsEditing,
    setEditTitle,
    setEditContent,
    setEditTags,
    setEditReminderDate,
    toast,
  ]);
  const memoizedCreateNewFolder = useCallback(createNewFolder, [
    token,
    activeFolderId,
    setSelectedNote,
    setIsEditing,
    toast,
  ]);

  const navigateToCalendar = useCallback(() => {
    navigate("/calendar");
  }, [navigate]);

  // When a note is selected or editing/creating, switch to note view on mobile
  useEffect(() => {
    if (isMobile) {
      if (selectedNote || isEditing) {
        setMobileView("note");
      } else {
        setMobileView("list");
      }
    }
  }, [isMobile, selectedNote, isEditing]);

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center text-lg">
        Please log in to view your notes.
      </div>
    );
  }

  useEffect(() => {
    const savedPage = Number(localStorage.getItem("notesPage") || 1);
    setCurrentPage(savedPage);
    refreshNotes((savedPage - 1) * NOTES_PER_PAGE);
  }, []);

  useEffect(() => {
    localStorage.setItem("notesPage", currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    window.addEventListener("online", syncOfflineNotes);
    return () => {
      window.removeEventListener("online", syncOfflineNotes);
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userProfile={userProfile} // Stable object from context
        setIsDrawerOpen={setIsDrawerOpen} // Stable state setter
        navigateToCalendar={navigateToCalendar} // Memoized with useCallback
      />

      <Suspense fallback={null}>
        {/* 💡 CRITICAL CHANGE: Only render the Lazy component when the drawer is open */}
        {isDrawerOpen && (
          <LazyProfileDrawer
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
          />
        )}
      </Suspense>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!noteToDelete}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{noteToDelete?.title}"?
              {noteToDelete?.type === "folder" &&
                " All items inside this folder will also be deleted."}{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Sidebar - Notes List */}
          <div
            className={
              `lg:col-span-1 flex flex-col h-full ` +
              (isMobile
                ? mobileView === "list"
                  ? "block"
                  : "hidden"
                : "block")
            }
          >
            <SidebarControls
              activeFolderId={activeFolderId}
              notes={notes}
              navigateBack={navigateBack}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm} // setSearchTerm is safe to pass directly
              createNewNote={memoizedCreateNewNote}
              createNewFolder={memoizedCreateNewFolder}
              isCreating={isCreating}
              notesLoading={notesLoading}
            />

            {/* The List View and Container */}
            {!notesLoading && (
              <NoteList
                currentNotes={currentNotes}
                notesLength={notes.length}
                selectedNoteId={selectedNote?.id || null}
                handleItemSelect={handleItemSelect}
                handleItemDeleteClick={handleItemDeleteClick}
              />
            )}

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              handlePageChange={handlePageChange}
            />
          </div>

          {/* Main Content - Note Editor */}
          <div
            className={
              `lg:col-span-2 ` +
              (isMobile
                ? mobileView === "note"
                  ? "block"
                  : "hidden"
                : "block")
            }
          >
            <React.Suspense
              fallback={
                // Placeholder while the editor chunk is loading
                <div className="flex items-center justify-center h-full">
                  Loading Editor...
                </div>
              }
            >
              {/* 💥 NEW: Conditionally render the Lazy component only if a note is selected */}
              {memoizedSelectedNote ? (
                <LazyMainNoteContent
                  isMobile={isMobile}
                  mobileView={mobileView}
                  handleMobileBack={handleMobileBack}
                  createNewNote={memoizedCreateNewNote}
                  // Editor State Props
                  selectedNote={memoizedSelectedNote}
                  isEditing={isEditing}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  editTags={editTags}
                  setEditTags={setEditTags}
                  editReminderDate={editReminderDate}
                  setEditReminderDate={setEditReminderDate}
                  isSuggesting={isSuggesting}
                  isFixingContent={isFixingContent}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  aiFixTrigger={aiFixTrigger}
                  // Memoized Editor Handlers
                  memoizedHandleAISuggestion={memoizedHandleAISuggestion}
                  memoizedSaveNote={memoizedSaveNote}
                  memoizedCancelEditing={memoizedCancelEditing}
                  memoizedStartEditing={memoizedStartEditing}
                  memoizedExportToCalendar={memoizedExportToCalendar}
                  memoizedFixContentWithAI={memoizedFixContentWithAI}
                />
              ) : isMobile ? null : (
                <SelectNoteCard createNewNote={memoizedCreateNewNote} />
              )}
            </React.Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesApp;
