import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
} from "../lib/api";
import { Search, Plus, FileText, Trash2, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const { toast } = useToast();
  const { token, isAuthenticated, logout } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

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
    setLoadingAction("save");
    setLoading(true);
    try {
      const updated = await updateNote(
        token,
        selectedNote.id || selectedNote._id,
        editTitle.trim() || "Untitled Note",
        editContent
      );
      const updatedNote = {
        ...updated,
        id: updated._id,
        createdAt: updated.createdAt ? new Date(updated.createdAt) : new Date(),
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : new Date(),
      };
      setNotes(
        notes.map((note) =>
          note.id === selectedNote.id || note._id === selectedNote._id
            ? updatedNote
            : note
        )
      );
      setSelectedNote(updatedNote);
      setIsEditing(false);
      toast({
        title: "Note saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save note." });
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTags((selectedNote.tags || []).join(", "));
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
      {/* Header */}
      <header className="bg-gradient-hero border-b shadow-elegant relative overflow-hidden">

        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl animate-float"></div>

        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        ></div>
        <div className="container mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 animate-fade-in">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-luxury"> 
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
                onClick={() => {
                  setLoadingAction("logout");
                  logout();
                  setTimeout(() => setLoadingAction(null), 1000);
                }}
                className="bg-red-600/80 hover:bg-red-600 text-white border border-red-500/30 backdrop-blur-md transition-spring shadow-luxury font-sans px-6 py-2 rounded-xl text-sm"
                size="lg"
                disabled={loadingAction === "logout"}
              >
                {loadingAction === "logout" ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : null}
               Sign Out
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

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-card">
              <div className="space-y-5 max-h-[calc(100vh-380px)] overflow-y-auto overflow-x-hidden">
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
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl font-display font-semibold truncate mr-3 text-foreground leading-tight">
                          {note.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-smooth rounded-lg p-2"
                          disabled={loadingAction === "delete-" + note.id}
                        >
                          {loadingAction === "delete-" + note.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-base text-muted-foreground line-clamp-3 mb-4 font-sans leading-relaxed">
                        {note.content || "No content"}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {note.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs font-sans px-3 py-1 rounded-full bg-primary/10 text-primary border-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-xs font-sans px-3 py-1 rounded-full bg-primary/10 text-primary border-0"
                            >
                              +{note.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground font-sans font-medium">
                        Last edited:{" "}
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
              <Card className="shadow-elegant border-0 bg-gradient-card h-[calc(100vh-220px)] animate-scale-in">
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
