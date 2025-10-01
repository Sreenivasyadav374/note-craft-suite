import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
} from "../lib/api";
import { Search, Plus, FileText, Trash2, Edit3, Save, X, UserCircle,Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ProfileDrawer from "@/components/ProfileDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { aiService } from '../utils/aiService';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const { toast } = useToast();
  const { token, isAuthenticated, logout, userProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false); // NEW: State for AI loading
  
  const userInitials = userProfile?.name 
    ? userProfile.name.substring(0, 2).toUpperCase()
    : "U";

  useEffect(() => {
    if (!token) return;
    setIsInitialLoading(true);
    getNotes(token)
      .then((data) => {
        const parsed = data.map((note) => ({
          ...note,
          id: note._id,
          createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
          updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
        }));
        setNotes(parsed);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to load notes." });
      })
      .finally(() => setIsInitialLoading(false));
  }, [token]);

  const createNewNote = async () => {
    if (!token) return;
    setLoadingAction("create");
    setLoading(true);
    try {
      const newNote = await createNote(token, "Untitled Note", "");
      const parsedNote = {
        ...newNote,
        id: newNote._id,
        createdAt: newNote.createdAt ? new Date(newNote.createdAt) : new Date(),
        updatedAt: newNote.updatedAt ? new Date(newNote.updatedAt) : new Date(),
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
    } catch (e) {
      toast({ title: "Error", description: "Failed to create note." });
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const deleteNote = async (noteId) => {
    if (!token) return;
    setLoadingAction("delete-" + noteId);
    setLoading(true);
    try {
      await deleteNoteApi(token, noteId);
      setNotes(
        notes.filter((note) => note.id !== noteId && note._id !== noteId)
      );
      if (selectedNote?.id === noteId || selectedNote?._id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      toast({
        title: "Note deleted",
        description: "Note has been successfully removed.",
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete note." });
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const startEditing = (note) => {
    setSelectedNote(note);
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags((note.tags || []).join(", "));
  };

  const saveNote = async () => {
     if (!selectedNote || !token) return;
     
     // Parse tags from comma-separated string back to array
     const tagsArray = editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
 
     const updated = await updateNote(token, selectedNote.id, editTitle.trim() || "Untitled Note", editContent, tagsArray);
     const updatedNote: Note = {
       id: updated._id,
       title: updated.title,
       content: updated.content,
       tags: updated.tags || [],
       createdAt: updated.createdAt ? new Date(updated.createdAt) : new Date(),
       updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : new Date(),
     };
 
     setNotes(notes.map(note => 
       note.id === selectedNote.id ? updatedNote : note
     ));
     setSelectedNote(updatedNote);
     setIsEditing(false);
     toast({
       title: "Note saved",
       description: "Your changes have been saved successfully.",
     });
   };

  const cancelEditing = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTags((selectedNote.tags || []).join(", "));
    }
  };

   // NEW FUNCTION: Handle AI Suggestion
    const handleAISuggestion = async () => {
      if (!selectedNote || !token || isSuggesting) return;
      
      const currentTitle = editTitle;
      const currentContent = editContent;
  
      if (currentContent.trim().length < 10) {
        toast({
          title: "Cannot suggest yet",
          description: "Note content must be at least 10 characters long for AI analysis.",
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

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.tags || []).some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Only render NotesPage if authenticated and token is present
  if (!isAuthenticated || !token) {
    return null;
  }

  if (isInitialLoading) {
    return <div className="p-8 text-center text-lg">Loading your notes...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileDrawer open={profileDrawerOpen} onOpenChange={setProfileDrawerOpen} />
      {/* Header */}
      <header className="bg-gradient-hero border-b shadow-elegant relative overflow-hidden">

        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl animate-float"></div>

        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        ></div>
        <div className="container mx-auto px-6 py-1 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 animate-fade-in">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-luxury flex items-center justify-center"> 
                <FileText className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-1 tracking-tight">
                  Premium Notes
                </h1>
                <p className="text-base text-white/90 font-sans">Luxury note-taking reimagined
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-4 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <Button
                type="button"
                onClick={createNewNote}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md transition-spring shadow-luxury font-sans px-6 py-2 rounded-xl text-sm"
                size="lg"
                disabled={loadingAction === "create"}
              >
                {loadingAction === "create" ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                New Note
              </Button>
              <Button
                onClick={() => setProfileDrawerOpen(true)}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md transition-spring shadow-luxury font-sans rounded-xl"
                size="lg"
              >
                {isAuthenticated && userProfile?.picture ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile.picture} alt={userProfile.name} />
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                ) : isAuthenticated ? (
                  <div className="flex items-center gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">Profile</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-2">
                    <UserCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Sign In</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Sidebar - Notes List */}
          <div
            className="lg:col-span-1 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                Your Collection
              </h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search your notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-card/80 backdrop-blur-md shadow-card border-0 focus:shadow-glow transition-smooth text-lg py-6 rounded-xl font-sans placeholder:text-muted-foreground/70"
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-card h-[calc(100vh-280px)]">
              <div className="space-y-3 h-full overflow-y-auto overflow-x-hidden">
                {filteredNotes.length === 0 ? (
                <Card className="shadow-card border-0 bg-gradient-card animate-scale-in min-h-[280px]">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-6 opacity-60" />
                    <h3 className="text-xl font-display font-semibold mb-2 text-foreground">
                      {notes.length === 0
                        ? "Begin Your Journey"
                        : "No Results Found"}
                    </h3>
                    <p className="text-muted-foreground font-sans">
                      {notes.length === 0
                        ? "Create your first luxury note and start capturing brilliance."
                        : "Try a different search term to find your notes."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotes.map((note, index) => (
                  <Card
                    key={note.id}
                    className={`cursor-pointer transition-spring shadow-card border-0 bg-gradient-card hover:shadow-glow animate-fade-in ${
                      selectedNote?.id === note.id
                        ? "ring-2 ring-primary shadow-glow scale-[1.02]"
                        : "hover:scale-[1.01]"
                    }`}
                    onClick={() => setSelectedNote(note)}
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-display font-semibold truncate mr-3 text-foreground leading-tight">
                          {note.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-smooth rounded-lg p-1.5 h-auto"
                          disabled={loadingAction === "delete-" + note.id}
                        >
                          {loadingAction === "delete-" + note.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 font-sans leading-relaxed">
                        {note.content || "No content"}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {note.tags.slice(0, 2).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs font-sans px-2 py-0.5 rounded-full bg-primary/10 text-primary border-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 2 && (
                            <Badge
                              variant="secondary"
                              className="text-xs font-sans px-2 py-0.5 rounded-full bg-primary/10 text-primary border-0"
                            >
                              +{note.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground font-sans font-medium">
                        {note.updatedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
              </div>
            </div>
          </div>

          {/* Main Content - Note Editor */}
          <div
            className="lg:col-span-2 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            {selectedNote ? (
              <Card className="shadow-elegant border-0 bg-gradient-card animate-scale-in">
                <CardHeader className="border-b bg-white/30 backdrop-blur-md p-8">
                  <div className="flex items-center justify-between">
                  {isEditing ? (
                      <div className="flex-1 mr-4">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-3xl font-display font-bold bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-6 py-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth placeholder:text-muted-foreground/50 shadow-card"
                          placeholder="Enter your note title..."
                        />
                      </div>
                    ) : (
                      <CardTitle className="text-3xl font-display font-bold text-foreground leading-tight">
                        {selectedNote.title}
                      </CardTitle>
                    )}
                    <div className="flex items-center space-x-3">
                      {isEditing && ( // NEW: AI Suggestion Button appears while editing
                      <>
                        <Button 
                          onClick={handleAISuggestion} 
                          size="lg" 
                          variant="secondary" 
                          disabled={isSuggesting}
                          className="text-primary hover:text-primary/80 transition-spring"
                        >
                          <Lightbulb className={`h-4 w-4 mr-2 ${isSuggesting ? 'animate-pulse' : ''}`} />
                          {isSuggesting ? 'Thinking...' : 'AI Suggest'}
                        </Button>
                        </>
                      )}
                      {isEditing ? (
                        <>
                          <Button
                            onClick={saveNote}
                            className="bg-gradient-primary hover:opacity-90 shadow-glow font-sans font-medium px-6 py-3 rounded-xl"
                            disabled={loadingAction === "save"}
                          >
                            {loadingAction === "save" ? (
                              <Spinner className="h-5 w-5 mr-2" />
                            ) : (
                              <Save className="h-5 w-5 mr-2" />
                            )}
                            Save Changes
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            className="font-sans font-medium px-6 py-3 rounded-xl border-muted-foreground/20 hover:bg-muted/50"
                          >
                            <X className="h-5 w-5 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => startEditing(selectedNote)}
                          className="bg-gradient-primary hover:opacity-90 shadow-glow font-sans font-medium px-6 py-3 rounded-xl"
                        >
                          <Edit3 className="h-5 w-5 mr-2" />
                          Edit Note
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-card">
                        <label className="block text-sm font-sans font-medium text-foreground/80 mb-2">
                          Tags
                        </label>
                        <Input
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="Add tags (comma separated)..."
                          className="bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 text-lg font-sans placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth"
                        />
                      </div>
                    </div>
                  )}

                  {!isEditing &&
                    selectedNote.tags &&
                    selectedNote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-6">
                        {selectedNote.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-primary/10 border-primary/30 font-sans px-4 py-2 rounded-full text-sm"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                </CardHeader>

                <CardContent className="p-8 h-full">
                  {isEditing ? (
                    <div className="h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-card">
                      <label className="block text-sm font-sans font-medium text-foreground/80 mb-3">
                        Content
                      </label>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Begin crafting your masterpiece..."
                        className="w-full h-[calc(100%-60px)] resize-none text-lg leading-relaxed font-sans bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-smooth placeholder:text-muted-foreground/60 shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto">
                      <div className="whitespace-pre-wrap text-lg leading-relaxed font-sans text-foreground/90">
                        {selectedNote.content || (
                          <span className="text-muted-foreground italic text-xl font-display">
                            This canvas awaits your inspiration. Click Edit to
                            begin creating.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-elegant border-0 bg-gradient-card h-[calc(100vh-220px)] animate-scale-in">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center animate-fade-in">
                    <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-luxury animate-float">
                      <FileText className="h-16 w-16 text-white drop-shadow-lg" />
                    </div>
                    <h3 className="text-4xl font-display font-bold mb-4 text-foreground">
                      Choose Your Canvas
                    </h3>
                    <p className="text-xl text-muted-foreground mb-8 font-sans leading-relaxed max-w-md mx-auto">
                      Select a note from your collection or create a new
                      masterpiece to begin your creative journey.
                    </p>
                    <Button
                      onClick={createNewNote}
                      className="bg-gradient-primary hover:opacity-90 shadow-glow font-sans font-medium text-lg px-8 py-4 rounded-xl transition-spring"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      Create New Masterpiece
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
