import React from 'react';
import { Note, Folder as FolderType } from '../types'; // Assuming your types are here
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, FileText, Trash2 } from 'lucide-react';

// Define Props for clarity
interface NoteListItemProps {
  item: Note | FolderType;
  isSelected: boolean;
  onSelect: (item: Note | FolderType) => void;
  onDeleteClick: (e: React.MouseEvent, item: Note | FolderType) => void;
}

const NoteListItem: React.FC<NoteListItemProps> = React.memo(({
  item,
  isSelected,
  onSelect,
  onDeleteClick
}) => {

  // Logic to generate content preview (extracted from original JSX)
  const getPreview = (content: string) => {
    if (!content) return "No content";
    let preview = content
      .replace(/<li data-type="taskItem"[^>]*data-checked="true"[^>]*>/g, "☑ ")
      .replace(/<li data-type="taskItem"[^>]*>/g, "☐ ")
      .replace(/<h[1-6][^>]*>/g, "\n")
      .replace(/<\/h[1-6]>/g, " ")
      .replace(/<\/p>/g, " ")
      .replace(/<br\s*\/?/g, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return preview.substring(0, 150) || "No content";
  };
  
  return (
    <Card
      key={item.id}
      className={`cursor-pointer transition-spring shadow-card border border-primary/20 bg-gradient-card hover:shadow-glow hover:border-primary/60 rounded-xl ${
        isSelected ? "ring-2 ring-primary shadow-glow" : ""
      }`}
      onClick={() => onSelect(item)}
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
            onClick={(e) => onDeleteClick(e, item)}
            className="text-muted-foreground hover:text-destructive transition-smooth"
            title="delete note"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {item.type === "file" && (
        <CardContent className="py-2">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
            {getPreview(item.content)}
          </p>
          {(item as Note).tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {(item as Note).tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {(item as Note).tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{(item as Note).tags.length - 3}
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
  );
});

export default NoteListItem;