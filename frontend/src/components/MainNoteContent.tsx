// src/components/MainNoteContent.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Plus } from "lucide-react";
// Assuming these imports are available via prop or local import
import NoteEditorHeader from "@/components/NoteEditorHeader";
import NoteContentView from "@/components/NoteContentView";

// Define the Note type (or import it if available in a types file)
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: "file" | "folder";
  // ... other properties
}

interface MainNoteContentProps {
  // Props for the Wrapper
  isMobile: boolean;
  mobileView: "list" | "note";
  handleMobileBack: () => void;
  createNewNote: () => Promise<void>; // The empty state handler
  
  // Props for the Editor/Content
  selectedNote: Note | null;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editTags: string;
  setEditTags: (tags: string) => void;
  editReminderDate: string;
  setEditReminderDate: (date: string) => void;
  isSuggesting: boolean;
  isFixingContent: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  aiFixTrigger: number;

  // Memoized Handlers (passed from NotesApp)
  memoizedHandleAISuggestion: () => Promise<void>;
  memoizedSaveNote: () => Promise<void>;
  memoizedCancelEditing: () => void;
  memoizedStartEditing: (note: Note) => void;
  memoizedExportToCalendar: (provider: "google" | "outlook" | "apple" | "ics") => void;
  memoizedFixContentWithAI: () => Promise<void>;
}

// 💥 CRITICAL STEP: Memoize this main container component
const MainNoteContent: React.FC<MainNoteContentProps> = React.memo(({
  isMobile,
  mobileView,
  handleMobileBack,
  createNewNote,
  selectedNote,
  isEditing,
  editTitle,
  setEditTitle,
  editTags,
  setEditTags,
  editReminderDate,
  setEditReminderDate,
  isSuggesting,
  isFixingContent,
  editContent,
  setEditContent,
  aiFixTrigger,
  memoizedHandleAISuggestion,
  memoizedSaveNote,
  memoizedCancelEditing,
  memoizedStartEditing,
  memoizedExportToCalendar,
  memoizedFixContentWithAI,
}) => {

  // This is the entire JSX you provided, extracted here:
  return (
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
            onClick={handleMobileBack} // Stable prop
            title="Back"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
          </Button>
        </div>
      )}


        <Card className="shadow-elegant border-2 border-primary/30 bg-gradient-card h-full rounded-2xl flex flex-col overflow-hidden">
          {/* Editor Header */}
          <NoteEditorHeader
            selectedNote={selectedNote}
            isEditing={isEditing}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editTags={editTags}
            setEditTags={setEditTags}
            editReminderDate={editReminderDate}
            setEditReminderDate={setEditReminderDate}
            isSuggesting={isSuggesting}
            handleAISuggestion={memoizedHandleAISuggestion}
            saveNote={memoizedSaveNote}
            cancelEditing={memoizedCancelEditing}
            startEditing={memoizedStartEditing}
            exportToCalendar={memoizedExportToCalendar}
          />

          {/* Content/Editor */}
          <NoteContentView
            selectedNote={selectedNote}
            isEditing={isEditing}
            editContent={editContent}
            setEditContent={setEditContent}
            isFixingContent={isFixingContent}
            isSuggesting={isSuggesting}
            fixContentWithAI={memoizedFixContentWithAI}
            aiFixTrigger={aiFixTrigger}
          />
        </Card>
      
    </div>
  );
});

MainNoteContent.displayName = 'MainNoteContent';
export default MainNoteContent;