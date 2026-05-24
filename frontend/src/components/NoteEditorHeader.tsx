import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Edit3, Save, X, Lightbulb, Bell, Calendar, Download } from 'lucide-react';
import { Note, Folder } from '../types'; // Assuming types
import { Spinner } from './ui/spinner'; // Assuming Spinner component

interface NoteEditorHeaderProps {
  selectedNote: Note | Folder;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editTags: string;
  setEditTags: (tags: string) => void;
  editReminderDate: string;
  setEditReminderDate: (date: string) => void;
  isSuggesting: boolean;
  handleAISuggestion: () => void;
  saveNote: () => void;
  cancelEditing: () => void;
  startEditing: (note: Note | Folder) => void;
  exportToCalendar: (type: 'google' | 'outlook' | 'apple' | 'ics') => void;
}

const NoteEditorHeader: React.FC<NoteEditorHeaderProps> = React.memo(({
  selectedNote,
  isEditing,
  editTitle,
  setEditTitle,
  editTags,
  setEditTags,
  editReminderDate,
  setEditReminderDate,
  isSuggesting,
  handleAISuggestion,
  saveNote,
  cancelEditing,
  startEditing,
  exportToCalendar,
}) => {
  const isFile = selectedNote.type === 'file';
  const note = selectedNote as Note;

  return (
    <CardHeader className="border-b bg-white/50 backdrop-blur-sm rounded-t-2xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold border-0 bg-transparent p-0 focus:ring-0"
              placeholder={isFile ? "Note title..." : "Folder Name..."}
            />
          ) : (
            <CardTitle className="text-2xl">
              {selectedNote.title}
            </CardTitle>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* AI Suggest Button (Edit Mode) */}
          {isEditing && isFile && (
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

          {/* Save/Cancel Buttons (Edit Mode) */}
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
            /* Export/Edit Buttons (View Mode) */
            <>
              {note.reminderDate && isFile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Export"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportToCalendar("google")}>
                      Google Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCalendar("outlook")}>
                      Outlook Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCalendar("apple")}>
                      Apple Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCalendar("ics")}>
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

      {/* Edit Mode Tags and Reminder */}
      {isEditing && isFile && (
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
                title="Clear Reminder"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* View Mode Tags and Reminder */}
      {!isEditing && isFile && (
        <div className="mt-4 space-y-2">
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, index) => (
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
          {note.reminderDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span>
                Reminder:{" "}
                {new Date(note.reminderDate).toLocaleString()}
              </span>
              {note.notificationSent && (
                <Badge variant="secondary" className="text-xs">
                  Sent
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </CardHeader>
  );
});

export default NoteEditorHeader;