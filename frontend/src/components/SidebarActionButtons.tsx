// src/components/SidebarActionButtons.tsx (New File)

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus } from 'lucide-react';
import { Spinner } from './ui/spinner'; // Assuming this path is correct

interface SidebarActionButtonsProps {
  createNewNote: () => void;
  createNewFolder: () => void;
  isCreating: boolean;
}

// 💥 CRITICAL STEP: Memoize this component.
const SidebarActionButtons: React.FC<SidebarActionButtonsProps> = React.memo(({
  createNewNote,
  createNewFolder,
  isCreating,
}) => {
  return (
    // This block was extracted from SidebarControls.tsx
    <div className="flex space-x-2 mb-4">
      <Button
        onClick={createNewNote} // Stable memoized prop from NotesApp.tsx
        disabled={isCreating} // Stable state
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
        onClick={createNewFolder} // Stable memoized prop from NotesApp.tsx
        disabled={isCreating} // Stable state
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
  );
});

SidebarActionButtons.displayName = 'SidebarActionButtons';
export default SidebarActionButtons;