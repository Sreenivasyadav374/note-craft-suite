import { useState, useEffect } from "react";
import { useAuthContext } from '../context/AuthContext';
import { getNotes, createNote, updateNote, deleteNote as deleteNoteApi } from '../lib/api';
import { Search, Plus, FileText, Trash2, Edit3, Save, X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "./RichTextEditor";
import { aiService } from '../utils/aiService';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false); // NEW: State for AI loading
  const { toast } = useToast();


  const { token, isAuthenticated } = useAuthContext();

  // Load notes from backend on mount or when token changes
  useEffect(() => {
    if (!token) return;
    getNotes(token).then(data => {
      // Convert backend _id to id and parse dates
      const parsed = data.map((note: any) => ({
        id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
      }));
      setNotes(parsed);
    });
  }, [token]);

  const createNewNote = async () => {
    if (!token) return;
    const newNote = await createNote(token, "Untitled Note", "");
    const parsedNote = {
      id: newNote._id,
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags || [],
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
  };

  const deleteNote = async (noteId: string) => {
    if (!token) return;
    await deleteNoteApi(token, noteId);
    setNotes(notes.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
    toast({
      title: "Note deleted",
      description: "Note has been successfully removed.",
    });
  };

  const startEditing = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(", "));
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
      setEditTags(selectedNote.tags.join(", "));
    }
  };

  // NEW FUNCTION: Handle AI Suggestion
  const handleAISuggestion = async () => {
    if (!selectedNote || !token || isSuggesting) return;
    
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


  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAuthenticated) {
    return <div className="p-8 text-center text-lg">Please log in to view your notes.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero border-b shadow-elegant">
        <div className="container mx-auto px-6 py-8">
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
            <Button 
              onClick={createNewNote}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-spring"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Notes List */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card shadow-card border-0 focus:shadow-glow transition-smooth"
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <Card className="shadow-card border-0 bg-gradient-card">
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {notes.length === 0 ? "No notes yet. Create your first note!" : "No notes found."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`cursor-pointer transition-spring shadow-card border-0 bg-gradient-card hover:shadow-glow ${
                      selectedNote?.id === note.id ? "ring-2 ring-primary shadow-glow" : ""
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg truncate mr-2">
                          {note.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-smooth"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {note.content ? 
                          (() => {
                            // Convert HTML to readable preview
                            let preview = note.content
                              // Convert task items
                              .replace(/<li data-type="taskItem"[^>]*data-checked="true"[^>]*>/g, '☑ ')
                              .replace(/<li data-type="taskItem"[^>]*>/g, '☐ ')
                              // Convert headings
                              .replace(/<h[1-6][^>]*>/g, '\n')
                              .replace(/<\/h[1-6]>/g, ' ')
                              // Convert paragraphs and breaks
                              .replace(/<\/p>/g, ' ')
                              .replace(/<br\s*\/?>/g, ' ')
                              // Remove all remaining HTML tags
                              .replace(/<[^>]*>/g, '')
                              // Clean up whitespace
                              .replace(/\s+/g, ' ')
                              .trim();
                            return preview.substring(0, 150) || "No content";
                          })()
                          : "No content"}
                      </p>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{note.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {note.updatedAt.toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
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
                        placeholder="Note title..."
                      />
                    ) : (
                      <CardTitle className="text-2xl">{selectedNote.title}</CardTitle>
                    )}
                    <div className="flex items-center space-x-2">
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
                        <Button onClick={() => startEditing(selectedNote)} size="sm" className="bg-gradient-primary hover:opacity-90">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="mt-4">
                      <Input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="Tags (comma separated)..."
                        className="border-0 bg-transparent"
                      />
                    </div>
                  )}
                  
                  {!isEditing && selectedNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedNote.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-primary/10 border-primary/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-6 h-full overflow-y-auto">
                  {isEditing ? (
                    <RichTextEditor
                      content={editContent}
                      onChange={setEditContent}
                      placeholder="Start writing your note..."
                    />
                  ) : (
                    <div className="h-full overflow-y-auto">
                      <div 
                        className="prose prose-sm max-w-none text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: selectedNote.content || '<span class="text-muted-foreground italic">This note is empty. Click Edit to add content.</span>' 
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-elegant border-0 bg-gradient-card h-[calc(100vh-200px)]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Select a note to view</h3>
                    <p className="text-muted-foreground mb-6">
                      Choose a note from the sidebar or create a new one to get started.
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