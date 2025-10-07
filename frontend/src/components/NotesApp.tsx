import { useState, useEffect } from "react";
import { useAuthContext } from '../context/AuthContext';
import { getNotes, createNote, updateNote, deleteNote as deleteNoteApi } from '../lib/api';
import { Search, Plus, FileText, Trash2, CreditCard as Edit3, Save, X, Lightbulb, Bell, Calendar, Download, CircleUser as UserCircle, ArrowLeft, Folder, FolderPlus, Sparkles } from "lucide-react";
import { notificationService } from '../services/notificationService';
import { reminderService } from '../services/reminderService';
import { calendarService } from '../services/calendarService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "./RichTextEditor";
import { aiService } from '../utils/aiService';
import ProfileDrawer from "@/components/ProfileDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

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

const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const { token, isAuthenticated, userProfile } = useAuthContext();

  useEffect(() => {
    const initNotifications = async () => {
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
  }, [isAuthenticated, toast]);

  useEffect(() => {
    if (!token) return;

    notificationService.startReminderCheck(token, async () => {
      await reminderService.checkPendingReminders(token);
    });

    return () => {
      notificationService.stopReminderCheck();
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getNotes(token)
      .then(data => {
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
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching notes:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: error.message || "Failed to load notes. Please try again.",
          variant: "destructive",
        });
      });
  }, [token, toast]);

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
        reminderDate: savedFolderApi.reminderDate ? new Date(savedFolderApi.reminderDate) : null,
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
    if (!token || isCreating) return;

    setIsCreating(true);
    try {
      const newNoteApi = await createNote(
        token,
        "Untitled Note",
        "",
        [],
        "file",
        activeFolderId
      );

      const parsedNote: Note = {
        id: newNoteApi._id,
        title: newNoteApi.title,
        content: newNoteApi.content,
        tags: newNoteApi.tags || [],
        createdAt: newNoteApi.createdAt ? new Date(newNoteApi.createdAt) : new Date(),
        updatedAt: newNoteApi.updatedAt ? new Date(newNoteApi.updatedAt) : new Date(),
        reminderDate: newNoteApi.reminderDate ? new Date(newNoteApi.reminderDate) : null,
        notificationSent: newNoteApi.notificationSent || false,
        type: "file",
        parentId: activeFolderId,
      };

      setNotes([parsedNote, ...notes]);
      setSelectedNote(parsedNote);
      setIsEditing(true);
      setEditTitle(parsedNote.title);
      setEditContent(parsedNote.content);
      setEditTags("");
      setEditReminderDate(parsedNote.reminderDate ? new Date(parsedNote.reminderDate).toISOString().slice(0, 16) : "");
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

  const deleteNote = async (noteId: string) => {
    if (!token) return;
    try {
      await deleteNoteApi(token, noteId);
      setNotes(notes.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      toast({
        title: "Item deleted",
        description: "Item has been successfully removed.",
      });
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete item.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(", "));
    setEditReminderDate(note.reminderDate ? new Date(note.reminderDate).toISOString().slice(0, 16) : "");
  };

  const saveNote = async () => {
    if (!selectedNote || !token) return;

    try {
      const tagsArray = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const contentToSave = selectedNote.type === "file" ? editContent : "";
      const reminderDateValue = editReminderDate ? new Date(editReminderDate).toISOString() : null;

      const updated = await updateNote(
        token,
        selectedNote.id,
        editTitle.trim() || (selectedNote.type === "folder" ? "Untitled Folder" : "Untitled Note"),
        contentToSave,
        tagsArray,
        selectedNote.type,
        selectedNote.parentId,
        reminderDateValue
      );

      const updatedNote: Note = {
        id: updated._id,
        title: updated.title,
        content: updated.content,
        tags: updated.tags || [],
        createdAt: updated.createdAt ? new Date(updated.createdAt) : new Date(),
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : new Date(),
        reminderDate: updated.reminderDate ? new Date(updated.reminderDate) : null,
        notificationSent: updated.notificationSent || false,
        type: updated.type,
        parentId: updated.parentId || null,
      };

      setNotes(notes.map(note =>
        note.id === selectedNote.id ? updatedNote : note
      ));
      setSelectedNote(updatedNote);
      setIsEditing(false);
      toast({
        title: "Item saved",
        description: "Your changes have been saved successfully.",
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
      setEditReminderDate(selectedNote.reminderDate ? new Date(selectedNote.reminderDate).toISOString().slice(0, 16) : "");
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
    if (!selectedNote || selectedNote.type === "folder" || !token || isSuggesting) return;
    
    const currentTitle = editTitle;
    const currentContent = editContent;

    if (currentContent.trim().length < 20) {
      toast({
        title: "Cannot suggest yet",
        description: "Note content must be at least 20 characters long for AI analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsSuggesting(true);
    toast({
      title: "Generating AI Suggestions...",
      description: "Gemini is analyzing your note content. This may take a moment.",
      duration: 5000,
    });

    try {
      const suggestions = await aiService.generateNoteSuggestion(currentTitle, currentContent);

      if (suggestions) {
        // Apply suggestions to the editing state
        setEditTitle(suggestions.suggestedTitle);
        setEditTags(suggestions.suggestedTags.join(", "));
        
        toast({
          title: "AI Suggestions Applied! ✨",
          description: `New Title: "${suggestions.suggestedTitle}". New Tags: ${suggestions.suggestedTags.join(', ')}`,
        });
      } else {
        toast({
          title: "AI Suggestion Failed",
          description: "Could not get suggestions. Check the console for errors.",
          variant: "destructive",
        });
      }
    } catch (error) {
       toast({
          title: "Error during AI Suggestion",
          description: "An unexpected error occurred while communicating with the AI service.",
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

  const exportToCalendar = (provider: 'google' | 'outlook' | 'apple' | 'ics') => {
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
      description: selectedNote.content.replace(/<[^>]*>/g, '').substring(0, 500),
      startDate,
      endDate,
    };

    switch (provider) {
      case 'google':
        calendarService.addToGoogleCalendar(event);
        break;
      case 'outlook':
        calendarService.addToOutlookCalendar(event);
        break;
      case 'apple':
        calendarService.addToAppleCalendar(event);
        break;
      case 'ics':
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
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  };

  const visibleItems = getVisibleItems();

  if (!isAuthenticated) {
    return <div className="p-8 text-center text-lg">Please log in to view your notes.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero border-b shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">NotesApp</h1>
                <p className="text-white/80">Capture your thoughts beautifully</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsDrawerOpen(true)}
                variant="ghost"
                className="p-0 h-auto"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.picture} />
                  <AvatarFallback>
                    <UserCircle className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ProfileDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Notes List */}
          <div className="lg:col-span-1">
            {/* Folder Navigation */}
            {activeFolderId !== null && (
              <div className="mb-4 flex items-center">
                <Button
                  variant="ghost"
                  onClick={navigateBack}
                  className="mr-2 px-2"
                  size="sm"
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
              >
                {isCreating ? (
                  <Spinner className="h-4 w-4 mr-1" />
                ) : (
                  <FolderPlus className="h-4 w-4 mr-1" />
                )}
                Folder
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
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
                      className={`cursor-pointer transition-spring shadow-card border-0 bg-gradient-card hover:shadow-glow ${
                        selectedNote?.id === item.id && item.type === "file"
                          ? "ring-2 ring-primary shadow-glow"
                          : ""
                      }`}
                      onClick={() =>
                        item.type === "folder"
                          ? openFolder(item.id)
                          : startEditing(item)
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
                              deleteNote(item.id);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-smooth"
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
                                    .replace(/<br\s*\/?>/g, " ")
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
            )}
          </div>

          {/* Main Content - Note Editor */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <Card className="shadow-elegant border-0 bg-gradient-card h-[calc(100vh-200px)]">
                <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
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
                      <CardTitle className="text-2xl">{selectedNote.title}</CardTitle>
                    )}
                    <div className="flex items-center space-x-2">
                      {isEditing && selectedNote.type === "file" && (
                        <Button
                          onClick={handleAISuggestion}
                          size="sm"
                          variant="secondary"
                          disabled={isSuggesting}
                          className="text-primary hover:text-primary/80 transition-spring"
                        >
                          {isSuggesting ? (
                            <Spinner className="h-4 w-4 mr-2" />
                          ) : (
                            <Lightbulb className="h-4 w-4 mr-2" />
                          )}
                          {isSuggesting ? 'Thinking...' : 'AI Suggest'}
                        </Button>
                      )}
                      
                      {isEditing ? (
                        <>
                          <Button onClick={saveNote} size="sm" className="bg-gradient-primary hover:opacity-90">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={cancelEditing} variant="outline" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          {selectedNote.reminderDate && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Export
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => exportToCalendar('google')}>
                                  Google Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportToCalendar('outlook')}>
                                  Outlook Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportToCalendar('apple')}>
                                  Apple Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportToCalendar('ics')}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download ICS
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button onClick={() => startEditing(selectedNote)} size="sm" className="bg-gradient-primary hover:opacity-90">
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
                            <Badge key={index} variant="outline" className="bg-primary/10 border-primary/30">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedNote.reminderDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Bell className="h-4 w-4" />
                          <span>
                            Reminder: {new Date(selectedNote.reminderDate).toLocaleString()}
                          </span>
                          {selectedNote.notificationSent && (
                            <Badge variant="secondary" className="text-xs">Sent</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-6 h-full">
                  {isEditing ? (
                    <div className="relative h-full">
                      {selectedNote.type === "file" && (
                        <Button
                          onClick={fixContentWithAI}
                          variant="ghost"
                          className={`
                            absolute top-2.5 right-4 z-10 transition-all duration-300 rounded-full h-8 w-8 p-0
                            text-primary bg-white/70 backdrop-blur-sm shadow-md border border-primary/20
                            ${
                              isFixingContent
                                ? "opacity-100"
                                : "opacity-70 hover:opacity-100"
                            }
                          `}
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
            ) : (
              <Card className="shadow-elegant border-0 bg-gradient-card h-[calc(100vh-220px)]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Select an item to view</h3>
                    <p className="text-muted-foreground mb-6">
                      Choose an item from the sidebar or create a new one to get started.
                    </p>
                    <Button onClick={createNewNote} className="bg-gradient-primary hover:opacity-90">
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