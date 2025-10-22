import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, Plus, FolderPlus, FileText } from 'lucide-react';
import { Note, Folder as FolderType } from '../types'; 
import { Spinner } from './ui/spinner'; // Assuming you have a Spinner component
import SidebarActionButtons from './SidebarActionButtons';

interface SidebarControlsProps {
  activeFolderId: string | null;
  notes: Array<Note | FolderType>;
  navigateBack: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  createNewNote: () => void;
  createNewFolder: () => void;
  isCreating: boolean;
  notesLoading: boolean;
}

const SidebarControls: React.FC<SidebarControlsProps> = React.memo(({
  activeFolderId,
  notes,
  navigateBack,
  searchTerm,
  setSearchTerm,
  createNewNote,
  createNewFolder,
  isCreating,
  notesLoading
}) => {
  const currentFolderTitle = notes.find((n) => n.id === activeFolderId)?.title || "Root";

  if (notesLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner />
      </div>
    );
  }

  return (
    <>
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
          <h3 className="font-semibold text-lg truncate">{currentFolderTitle}</h3>
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
      <SidebarActionButtons
        createNewNote={createNewNote}
        createNewFolder={createNewFolder}
        isCreating={isCreating}
      />
    </>
  );
});

export default SidebarControls;