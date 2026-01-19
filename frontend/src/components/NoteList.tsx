// src/components/NoteList.tsx

import React from "react";
import NoteListItem from "@/components/NoteListItem";
import CreateNoteCard from "@/components/CreateNoteCard"; // Assuming you'd move this or it's accessible
import { Note } from "../types"; // Adjust path as necessary, using the interface from NotesApp.tsx

// Define the Note interface locally or import it from a shared types file
// For this example, I'll redefine it based on the source file for completeness
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

interface NoteListProps {
  currentNotes: Note[];
  notesLength: number; // Total number of notes for CreateNoteCard
  selectedNoteId: string | null;
  handleItemSelect: (item: Note) => void;
  handleItemDeleteClick: (e: React.MouseEvent, item: Note) => void;
}

const NoteList: React.FC<NoteListProps> = ({
  currentNotes,
  notesLength,
  selectedNoteId,
  handleItemSelect,
  handleItemDeleteClick,
}) => {
  return (
    <div className="flex-1 flex flex-col premium-sidebar rounded-2xl border-2 border-primary/30 bg-gradient-card shadow-3d overflow-hidden min-h-[400px] max-h-[calc(100vh-220px)]">
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4 custom-scrollbar">
        {currentNotes.length === 0 ? (
          <CreateNoteCard notesLength={notesLength} />
        ) : (
          currentNotes.map((item) => (
            <NoteListItem
              key={item.id}
              item={item}
              isSelected={selectedNoteId === item.id && item.type === "file"}
              onSelect={handleItemSelect}
              onDeleteClick={handleItemDeleteClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Use React.memo to ensure the component only re-renders 
// when its props (currentNotes, selectedNoteId, etc.) change.
export default React.memo(NoteList);