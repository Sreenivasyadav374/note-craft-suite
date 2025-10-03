import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
} from "../lib/api";
// UPDATED ICONS: Added Lightbulb, ArrowLeft, Folder, FolderPlus
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Edit3,
  Save,
  X,
  UserCircle,
  Lightbulb,
  ArrowLeft,
  Folder,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ProfileDrawer from "@/components/ProfileDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichTextEditor } from "@/components/RichTextEditor";

// Assuming you renamed llmModel.ts to aiService.ts and updated it
import { aiService } from "../utils/aiService";

// UPDATED INTERFACE
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  type: "file" | "folder"; // <-- NEW: Type to distinguish
  parentId?: string | null; // <-- NEW: Hierarchy tracking (null is root)
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]); // Set type to Note[]
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null); // Set type to Note | null
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false); // AI loading state
  const [isFixingContent, setIsFixingContent] = useState(false); // NEW STATE for content fix
  const [aiFixTrigger, setAiFixTrigger] = useState(0);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // <-- NEW STATE for current folder
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();
  const { token, isAuthenticated, logout, userProfile } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getNotes(token)
      .then((data: any[]) => {
        const parsed: Note[] = data.map((note) => ({
          id: note._id,
          title: note.title,
          content: note.content,
          tags: note.tags || [],
          createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
          updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
          type: note.type || "file", // <-- Use API type or default to 'file'
          parentId: note.parentId || null, // <-- Use API parentId or default to null
        }));
        setNotes(parsed);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching notes:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load notes. Please try again.",
          variant: "destructive",
        });
      });
  }, [token]);

  // NEW FUNCTION: Create Folder
  const createNewFolder = async () => {
    // <-- NOTE: Changed to async
    if (!token) return;

    // 1. Create a placeholder object with default values
    const newFolderData = {
      title: "New Folder",
      content: "",
      tags: [],
      type: "folder",
      parentId: activeFolderId, // New folder is created in the current active folder
    };

    try {
      // 2. IMPORTANT: Call the API to save the folder immediately
      const savedFolderApi = await createNote(
        token,
        newFolderData.title,
        newFolderData.content,
        newFolderData.tags,
        "folder",
        newFolderData.parentId
      );

      // 3. Create the final Note object using the real ID from the API
      const parsedFolder: Note = {
        id: savedFolderApi._id, // <-- THIS IS THE REAL MONGODB ID
        title: savedFolderApi.title,
        content: savedFolderApi.content,
        tags: savedFolderApi.tags || [],
        createdAt: new Date(savedFolderApi.createdAt),
        updatedAt: new Date(savedFolderApi.updatedAt),
        type: "folder",
        parentId: savedFolderApi.parentId || null,
      };

      // 4. Update the state and open the folder for navigation/editing
      setNotes([parsedFolder, ...notes]);
      openFolder(parsedFolder.id); // Navigate into the new folder immediately
      startEditing(parsedFolder); // Start editing the name

      toast({
        title: "New folder created",
        description: "Rename your new folder and start organizing!",
      });
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder.",
        variant: "destructive",
      });
    }
  };
  // UPDATED FUNCTION: Create Note (now accepts parentId)
  const createNewNote = async () => {
    if (!token) return;

    // Assuming createNote API is correctly defined to accept all fields
    const newNoteApi = await createNote(
      token,
      "Untitled Note",
      "",
      [],
      "file",
      activeFolderId // <-- This is now guaranteed to be a real ID or null
    );

    const parsedNote: Note = {
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
      type: "file",
      parentId: activeFolderId, // Assign to active folder
    };

    setNotes([parsedNote, ...notes]);
    setSelectedNote(parsedNote);
    setIsEditing(true);
    setEditTitle(parsedNote.title);
    setEditContent(parsedNote.content);
    setEditTags("");
    toast({
      title: "New note created",
      description: "Start writing your thoughts!",
    });
  };

  // UPDATED FUNCTION: Delete Note (handles folders and selection state)
  const deleteNote = async (noteId: string) => {
    if (!token) return;
    await deleteNoteApi(token, noteId);
    setNotes(notes.filter((note) => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
    toast({
      title: "Item deleted",
      description: "Item has been successfully removed.",
    });
  };

  // --- EDITING AND SAVING ---

  const startEditing = (item: Note) => {
    setSelectedNote(item);
    setIsEditing(true);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditTags(item.tags.join(", "));
  };

  const saveNote = async () => {
    if (!selectedNote || !token) return;

    const tagsArray = editTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    const contentToSave = selectedNote.type === "file" ? editContent : ""; // Folders have no content

    // Use updateNote with all necessary fields
    const updated = await updateNote(
      token,
      selectedNote.id,
      editTitle.trim() ||
        (selectedNote.type === "folder" ? "Untitled Folder" : "Untitled Note"),
      contentToSave,
      tagsArray,
      selectedNote.type, // Pass existing type
      selectedNote.parentId // Pass existing parentId
    );

    const updatedNote: Note = {
      id: updated._id,
      title: updated.title,
      content: updated.content,
      tags: updated.tags || [],
      createdAt: updated.createdAt ? new Date(updated.createdAt) : new Date(),
      updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : new Date(),
      type: updated.type,
      parentId: updated.parentId || null,
    };

    setNotes(
      notes.map((note) => (note.id === selectedNote.id ? updatedNote : note))
    );
    setSelectedNote(updatedNote);
    setIsEditing(false);
    toast({
      title: "Item saved",
      description: "Your changes have been saved successfully.",
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTags(selectedNote.tags.join(", "));
    }
  };

  // --- FOLDER NAVIGATION ---

  // NEW FUNCTION: Open Folder
  const openFolder = (folderId: string) => {
    setActiveFolderId(folderId);
    setSelectedNote(null);
    setIsEditing(false);
    setSearchTerm(""); // Clear search when navigating
  };

  // NEW FUNCTION: Navigate Back
  const navigateBack = () => {
    if (activeFolderId === null) return;

    // Find the current active folder to get its parent ID
    const currentFolder = notes.find(
      (n) => n.id === activeFolderId && n.type === "folder"
    );

    // Set the active folder ID to the parent ID (or null if the parent is root)
    setActiveFolderId(currentFolder?.parentId || null);
    setSelectedNote(null);
    setIsEditing(false);
    setSearchTerm(""); // Clear search when navigating
  };

  // --- AI SUGGESTION ---

  // NEW FUNCTION: Handle AI Suggestion
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
      description: "Gemini is analyzing your note content.",
      duration: 5000,
    });

    try {
      // Assuming aiService.generateNoteSuggestion is defined elsewhere
      const suggestions = await aiService.generateNoteSuggestion(
        currentTitle,
        currentContent
      );

      if (suggestions) {
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
          description: "Could not get suggestions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "AI Suggestion Error",
        description: "An error occurred during the suggestion process.",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const fixContentWithAI = async () => {
    if (!token || !selectedNote || selectedNote.type === "folder") return;
    if (isFixingContent) return;

    // Use the content currently in the editor
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

  const getVisibleItems = () => {
    // 1. Filter items by the current activeFolderId
    let items = notes.filter((note) => note.parentId === activeFolderId);

    // 2. Filter these items by the search term
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

    // 3. APPLY NEW SORTING LOGIC: Folders first, then by newest updatedAt date
    return items.sort((a, b) => {
      // Folders always come first
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      // If they are both the same type (both file or both folder), sort by newest date
      // Note: Dates must be compared using getTime()
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  };

  const visibleItems = getVisibleItems();

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center text-lg">
        Please log in to view your notes.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header (No UI Change) */}
      <header className="bg-gradient-hero border-b shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">NotesApp</h1>
                <p className="text-white/80">
                  Capture your thoughts beautifully
                </p>
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
          {/* Sidebar - Notes List (Folder Logic Added) */}
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
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-spring"
              >
                <Plus className="h-4 w-4 mr-1" /> Note
              </Button>
              <Button
                onClick={createNewFolder} // <-- New folder button
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary/10 transition-spring"
              >
                <FolderPlus className="h-4 w-4 mr-1" /> Folder
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
                  visibleItems
                    // NOTE: The sorting logic should be placed inside your getVisibleItems function.
                    // If it remains here, update it to sort by date as shown below:
                    .sort((a, b) => {
                      // 1. Sort: Folders first
                      if (a.type === "folder" && b.type === "file") return -1;
                      if (a.type === "file" && b.type === "folder") return 1;
                      // 2. Sort: Newest created/updated item on top
                      return b.updatedAt.getTime() - a.updatedAt.getTime();
                    })
                    .map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-spring shadow-card border-0 bg-gradient-card hover:shadow-glow ${
                          selectedNote?.id === item.id && item.type === "file"
                            ? "ring-2 ring-primary shadow-glow"
                            : ""
                        }`}
                        // Click logic: open folder or select file/note
                        onClick={() =>
                          item.type === "folder"
                            ? openFolder(item.id)
                            : startEditing(item)
                        }
                      >
                        <CardHeader className="py-2">
                          {" "}
                          {/* FIX: Reduced vertical padding here */}
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg truncate mr-2 flex items-center">
                              {/* Item Icon */}
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
                        {/* Content and tags only for files */}
                        {item.type === "file" && (
                          // FIX: Reduced padding and margins for a compact card
                          <CardContent className="py-2">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                              {" "}
                              {/* FIX: Reduced mb-3 to mb-1 */}
                              {item.content
                                ? (() => {
                                    // Convert HTML to readable preview
                                    let preview = item.content
                                      // Convert task items
                                      .replace(
                                        /<li data-type="taskItem"[^>]*data-checked="true"[^>]*>/g,
                                        "☑ "
                                      )
                                      .replace(
                                        /<li data-type="taskItem"[^>]*>/g,
                                        "☐ "
                                      )
                                      // Convert headings
                                      .replace(/<h[1-6][^>]*>/g, "\n")
                                      .replace(/<\/h[1-6]>/g, " ")
                                      // Convert paragraphs and breaks
                                      .replace(/<\/p>/g, " ")
                                      .replace(/<br\s*\/?>/g, " ")
                                      // Remove all remaining HTML tags
                                      .replace(/<[^>]*>/g, "")
                                      // Clean up whitespace
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
                                {" "}
                                {/* FIX: Reduced mb-3 to mb-1 */}
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
                      <CardTitle className="text-2xl">
                        {selectedNote.title}
                      </CardTitle>
                    )}
                    <div className="flex items-center space-x-2">
                      {/* AI Suggestion Button (Visible only for files and when editing) */}
                      {isEditing && selectedNote.type === "file" && (
                        <Button
                          onClick={handleAISuggestion}
                          size="sm"
                          variant="secondary"
                          disabled={isSuggesting}
                          className="text-primary hover:text-primary/80 transition-spring"
                        >
                          <Lightbulb
                            className={`h-4 w-4 mr-2 ${
                              isSuggesting ? "animate-pulse" : ""
                            }`}
                          />
                          {isSuggesting ? "Thinking..." : "AI Suggest"}
                        </Button>
                      )}

                      {isEditing ? (
                        <>
                          <Button
                            onClick={saveNote}
                            size="sm"
                            className="bg-gradient-primary hover:opacity-90"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => startEditing(selectedNote)}
                          size="sm"
                          className="bg-gradient-primary hover:opacity-90"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tags Input (Hidden for folders) */}
                  {isEditing && selectedNote.type === "file" && (
                    <div className="mt-4">
                      <Input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Tags (comma separated)..."
                        className="border-0 bg-transparent"
                      />
                    </div>
                  )}

                  {/* Tags Display (Hidden for folders) */}
                  {!isEditing &&
                    selectedNote.tags.length > 0 &&
                    selectedNote.type === "file" && (
                      <div className="flex flex-wrap gap-2 mt-4">
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
                </CardHeader>

                <CardContent className="p-6 h-full">
                  {/* Content Area (Hidden for folders) */}
                  {isEditing ? (
                    // IMPORTANT: Relative container for absolute positioning
                    <div className="relative h-full">
                      {/* START: NEW AI Enhancement Button (Sparkles) */}
                      {selectedNote.type === "file" && (
                        <Button
                          onClick={fixContentWithAI}
                          variant="ghost"
                          // Set the size to be a small, round icon
                          className={`
                  absolute top-2.5 right-4 z-10 transition-all duration-300 rounded-full h-8 w-8 p-0
                  text-primary bg-white/70 backdrop-blur-sm shadow-md border border-primary/20
                  // OPACITY LOGIC: Default 20% opacity, 100% on hover or when loading
                  ${
                    isFixingContent
                      ? "opacity-100"
                      : "opacity-70 hover:opacity-100"
                  }
                `}
                          title="Enhance Content (AI)" // Tooltip text on hover
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
                      {/* END: NEW AI Enhancement Button */}

                      <RichTextEditor
                        // FIX: Use the stable trigger state instead of editContent.length
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
              // Reverted to simple select-note view
              <Card className="shadow-elegant border-0 bg-gradient-card h-[calc(100vh-220px)]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      Select an item to view
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Choose an item from the sidebar or create a new one to get
                      started.
                    </p>
                    <Button
                      onClick={createNewNote}
                      className="bg-gradient-primary hover:opacity-90"
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
}
