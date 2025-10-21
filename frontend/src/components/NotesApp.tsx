import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useNotes } from "../context/NotesContext";
import { usePreferences } from "../context/PreferencesContext";
import {
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
} from "../lib/api";
import {
  Search,
  Plus,
  FileText,
  Trash2,
  CreditCard as Edit3,
  Save,
  X,
  Lightbulb,
  Bell,
  Calendar,
  Download,
  CircleUser as UserCircle,
  ArrowLeft,
  Folder,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import { notificationService } from "../services/notificationService";
import { reminderService } from "../services/reminderService";
import { calendarService } from "../services/calendarService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "./RichTextEditor";
import { aiService } from "../utils/aiService";
import ProfileDrawer from "@/components/ProfileDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import QuickThemeToggle from "@/components/QuickThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { v4 as uuidv4 } from "uuid";

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
    loadMoreNotes, // 👈 NEW
    hasMore,
    totalCount,
    refreshNotes, // 👈 NEW
  } = useNotes();

  const { preferences } = usePreferences();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editReminderDate, setEditReminderDate] = useState<string>("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isFixingContent, setIsFixingContent] = useState(false);
  const [aiFixTrigger, setAiFixTrigger] = useState(0);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
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

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages) return;

    const offset = (page - 1) * NOTES_PER_PAGE;
    setCurrentPage(page);

    // Fetch only that page (replace notes)
    await refreshNotes(offset);

    // Scroll back to top smoothly
    const container = document.querySelector(".custom-scrollbar");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(false);
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

  // --- Update (saveNote) ---
  const saveNote = async () => {
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

  const openFolder = (folderId: string) => {
    setActiveFolderId(folderId);
    setSelectedNote(null);
    setIsEditing(false);
    setSearchTerm("");
  };

  const navigateBack = () => {
    if (activeFolderId === null) return;

    const currentFolder = notes.find(
      (n) => n.id === activeFolderId && n.type === "folder"
    );

    setActiveFolderId(currentFolder?.parentId || null);
    setSelectedNote(null);
    setIsEditing(false);
    setSearchTerm("");
  };

  const handleAISuggestion = async () => {
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
  };

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

  const exportToCalendar = (
    provider: "google" | "outlook" | "apple" | "ics"
  ) => {
    if (!selectedNote || !selectedNote.reminderDate) {
      toast({
        title: "No reminder set",
        description: "Please set a reminder date before exporting to calendar.",
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
  };

  const getVisibleItems = () => {
    let items = notes.filter((note) => note.parentId === activeFolderId);

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      items = items.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerSearchTerm) ||
          (note.type === "file" &&
            note.content.toLowerCase().includes(lowerSearchTerm)) ||
          note.tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm))
      );
    }

    return items.sort((a, b) => {
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
  };

  const visibleItems = getVisibleItems();

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
      {/* Header */}
      <header className="bg-gradient-hero border-b shadow-elegant">
        <div className="container mx-auto px-4 py-2 min-h-0">
          <div className="flex items-center justify-between min-h-0">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  NotesApp
                </h1>
                <p className="text-white/80 text-xs leading-tight">
                  Capture your thoughts beautifully
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate("/calendar")}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 px-2 py-1"
                title="calendar"
              >
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">Calendar</span>
              </Button>
              <div className="[&_button]:text-white [&_button]:hover:bg-white/10">
                <QuickThemeToggle />
              </div>
              <Button
                onClick={() => setIsDrawerOpen(true)}
                variant="ghost"
                className="p-0 h-auto"
                title="Profile"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.picture} alt="Profile Picture"/>
                  <AvatarFallback>
                    <UserCircle className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ProfileDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />

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
            {/* Folder Navigation */}
            {activeFolderId !== null && (
              <div className="mb-4 flex items-center">
                <Button
                  variant="ghost"
                  onClick={navigateBack}
                  className="mr-2 px-2"
                  size="sm"
                  title="navigate back"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <h3 className="font-semibold text-lg truncate">
                  {notes.find((n) => n.id === activeFolderId)?.title || "Root"}
                </h3>
              </div>
            )}

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes and folders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card shadow-card border-0 focus:shadow-glow transition-smooth"
                />
              </div>
            </div>

            {/* Folder and Note Creation Buttons */}
            <div className="flex space-x-2 mb-4">
              <Button
                onClick={createNewNote}
                disabled={isCreating}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-spring"
                title="create note"
              >
                {isCreating ? (
                  <Spinner className="h-4 w-4 mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Note
              </Button>
              <Button
                onClick={createNewFolder}
                disabled={isCreating}
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary/10 transition-spring"
                title="create folder"
              >
                {isCreating ? (
                  <Spinner className="h-4 w-4 mr-1" />
                ) : (
                  <FolderPlus className="h-4 w-4 mr-1" />
                )}
                Folder
              </Button>
            </div>

            {notesLoading ? (
              <div className="flex justify-center items-center h-48">
                <Spinner />
              </div>
            ) : (
              <div className="flex-1 flex flex-col premium-sidebar rounded-2xl border-2 border-primary/30 bg-gradient-card shadow-3d overflow-hidden min-h-[400px] max-h-[calc(100vh-220px)]">
                <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4 custom-scrollbar">
                  {visibleItems.length === 0 ? (
                    <Card className="shadow-card border-0 bg-gradient-card">
                      <CardContent className="p-6 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {notes.length === 0
                            ? "No items yet. Create your first note or folder!"
                            : "No items found in this location."}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    visibleItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-spring shadow-card border border-primary/20 bg-gradient-card hover:shadow-glow hover:border-primary/60 rounded-xl ${
                          selectedNote?.id === item.id && item.type === "file"
                            ? "ring-2 ring-primary shadow-glow"
                            : ""
                        }`}
                        onClick={() =>
                          item.type === "folder"
                            ? openFolder(item.id)
                            : selectNote(item)
                        }
                      >
                        <CardHeader className="py-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg truncate mr-2 flex items-center">
                              {item.type === "folder" ? (
                                <Folder className="h-5 w-5 mr-2 text-yellow-500/80" />
                              ) : (
                                <FileText className="h-5 w-5 mr-2 text-primary/80" />
                              )}
                              {item.title}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoteToDelete(item);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-smooth"
                              title="delete note"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        {item.type === "file" && (
                          <CardContent className="py-2">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                              {item.content
                                ? (() => {
                                    let preview = item.content
                                      .replace(
                                        /<li data-type="taskItem"[^>]*data-checked="true"[^>]*>/g,
                                        "☑ "
                                      )
                                      .replace(
                                        /<li data-type="taskItem"[^>]*>/g,
                                        "☐ "
                                      )
                                      .replace(/<h[1-6][^>]*>/g, "\n")
                                      .replace(/<\/h[1-6]>/g, " ")
                                      .replace(/<\/p>/g, " ")
                                      .replace(/<br\s*\/?/g, " ")
                                      .replace(/<[^>]*>/g, "")
                                      .replace(/\s+/g, " ")
                                      .trim();
                                    return (
                                      preview.substring(0, 150) || "No content"
                                    );
                                  })()
                                : "No content"}
                            </p>
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {item.tags.slice(0, 3).map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {item.updatedAt.toLocaleDateString()}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2 flex-wrap">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  title="previous page"
                >
                  Prev
                </Button>

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      title="select page"
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  title="Next page"
                >
                  Next
                </Button>
              </div>
            )}
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
            {/* Mobile Back Button OUTSIDE the note card */}
            {isMobile && selectedNote && (
              <div className="mb-2 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 px-2"
                  onClick={() => {
                    setSelectedNote(null);
                    setIsEditing(false);
                    setMobileView("list");
                  }}
                  title="Back"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
                </Button>
              </div>
            )}
            {selectedNote ? (
              <Card className="shadow-elegant border-2 border-primary/30 bg-gradient-card h-full rounded-2xl flex flex-col overflow-hidden">
                <CardHeader className="border-b bg-white/50 backdrop-blur-sm rounded-t-2xl">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-xl font-bold border-0 bg-transparent p-0 focus:ring-0"
                          placeholder={
                            selectedNote.type === "folder"
                              ? "Folder Name..."
                              : "Note title..."
                          }
                        />
                      ) : (
                        <CardTitle className="text-2xl">
                          {selectedNote.title}
                        </CardTitle>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {isEditing && selectedNote.type === "file" && (
                        <Button
                          onClick={handleAISuggestion}
                          size="sm"
                          variant="secondary"
                          disabled={isSuggesting}
                          className="text-primary hover:text-primary/80 transition-spring"
                          title="AI suggest"
                        >
                          {isSuggesting ? (
                            <Spinner className="h-4 w-4 mr-2" />
                          ) : (
                            <Lightbulb className="h-4 w-4 mr-2" />
                          )}
                          {isSuggesting ? "Thinking..." : "AI Suggest"}
                        </Button>
                      )}

                      {isEditing ? (
                        <>
                          <Button
                            onClick={saveNote}
                            size="sm"
                            className="bg-gradient-primary hover:opacity-90"
                            title="Save Edits"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            size="sm"
                            title="Cancel Editing"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          {selectedNote.reminderDate && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" title="Export">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Export
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => exportToCalendar("google")}
                                >
                                  Google Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => exportToCalendar("outlook")}
                                >
                                  Outlook Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => exportToCalendar("apple")}
                                >
                                  Apple Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => exportToCalendar("ics")}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download ICS
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button
                            onClick={() => startEditing(selectedNote)}
                            size="sm"
                            className="bg-gradient-primary hover:opacity-90"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing && selectedNote.type === "file" && (
                    <div className="mt-4 space-y-3">
                      <Input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Tags (comma separated)..."
                        className="border-0 bg-transparent"
                      />
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          value={editReminderDate}
                          onChange={(e) => setEditReminderDate(e.target.value)}
                          className="border-0 bg-transparent flex-1"
                          placeholder="Set reminder..."
                        />
                        {editReminderDate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditReminderDate("")}
                            className="text-muted-foreground hover:text-destructive"
                            title="Reminder date"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditing && selectedNote.type === "file" && (
                    <div className="mt-4 space-y-2">
                      {selectedNote.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedNote.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-primary/10 border-primary/30"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedNote.reminderDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Bell className="h-4 w-4" />
                          <span>
                            Reminder:{" "}
                            {new Date(
                              selectedNote.reminderDate
                            ).toLocaleString()}
                          </span>
                          {selectedNote.notificationSent && (
                            <Badge variant="secondary" className="text-xs">
                              Sent
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-6 flex-1 min-h-0 overflow-auto">
                  {isEditing ? (
                    <div className="relative h-full">
                      {selectedNote.type === "file" && (
                        <Button
                          onClick={fixContentWithAI}
                          variant="ghost"
                          className={`
                            absolute top-2.5 right-4 z-10 transition-all duration-300 rounded-full h-8 w-8 p-0
                            text-primary bg-white/70 backdrop-blur-sm shadow-md border border-primary/20
                            sm:top-2.5 sm:right-4
                            ${
                              isFixingContent
                                ? "opacity-100"
                                : "opacity-70 hover:opacity-100"
                            }
                            ${
                              typeof window !== "undefined" &&
                              window.innerWidth < 640
                                ? "mt-10"
                                : ""
                            }
                          `}
                          style={{
                            marginTop:
                              typeof window !== "undefined" &&
                              window.innerWidth < 640
                                ? 40
                                : 0,
                          }}
                          title="Enhance Content (AI)"
                          disabled={
                            isFixingContent ||
                            isSuggesting ||
                            !editContent ||
                            editContent.trim().length === 0
                          }
                        >
                          {isFixingContent ? (
                            <Spinner className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span className="sr-only">Enhance Content (AI)</span>
                        </Button>
                      )}

                      <RichTextEditor
                        key={`${selectedNote.id}-${aiFixTrigger}`}
                        content={editContent}
                        onChange={setEditContent}
                        placeholder="Start writing your note..."
                      />
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto">
                      <div
                        className="prose prose-sm max-w-none text-base leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedNote.content ||
                            '<span class="text-muted-foreground italic">This note is empty. Click Edit to add content.</span>',
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : isMobile ? null : (
              <Card className="shadow-elegant border-0 bg-gradient-card h-[calc(100vh-220px)]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                      Select an item to view
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Choose an item from the sidebar or create a new one to get
                      started.
                    </p>
                    <Button
                      onClick={createNewNote}
                      className="bg-gradient-primary hover:opacity-90"
                      title="New Note"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesApp;
