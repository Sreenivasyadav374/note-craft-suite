import React, { Suspense, lazy } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from './ui/spinner'; // Assuming Spinner component
import { Sparkles } from 'lucide-react';
import { Note, Folder } from '../types';

// Assuming LazyRichTextEditor is defined using React.lazy
const LazyRichTextEditor = React.lazy(() =>
  import("./RichTextEditor").then((module) => ({
    default: module.RichTextEditor,
  }))
);

interface NoteContentViewProps {
  selectedNote: Note | Folder;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  isFixingContent: boolean;
  isSuggesting: boolean; // Passed for disabling fixContentWithAI button
  fixContentWithAI: () => void;
  aiFixTrigger: number;
}

const NoteContentView: React.FC<NoteContentViewProps> = React.memo(({
  selectedNote,
  isEditing,
  editContent,
  setEditContent,
  isFixingContent,
  isSuggesting,
  fixContentWithAI,
  aiFixTrigger
}) => {
  const isFile = selectedNote.type === 'file';
  const note = selectedNote as Note;

  return (
    <CardContent className="p-6 flex-1 min-h-0 overflow-auto">
      {isEditing && isFile ? (
        <div className="relative h-full">
          {/* AI Content Fix Button */}
          <Button
            onClick={fixContentWithAI}
            variant="ghost"
            className={`
              absolute top-2.5 right-4 z-10 transition-all duration-300 rounded-full h-8 w-8 p-0
              text-primary bg-white/70 backdrop-blur-sm shadow-md border border-primary/20
              sm:top-2.5 sm:right-4
              ${
                isFixingContent
                  ? "opacity-100"
                  : "opacity-70 hover:opacity-100"
              }
              ${
                typeof window !== "undefined" && window.innerWidth < 640
                  ? "mt-10"
                  : ""
              }
            `}
            style={{
              marginTop:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? 40
                  : 0,
            }}
            title="Enhance Content (AI)"
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

          {/* Lazy Loaded Rich Text Editor */}
          <Suspense
            fallback={<Spinner className="h-6 w-6 m-auto" />}
          >
            <LazyRichTextEditor
              key={`${selectedNote.id}-${aiFixTrigger}`}
              content={editContent}
              onChange={setEditContent}
              placeholder="Start writing your note..."
            />
          </Suspense>
        </div>
      ) : (
        /* View Mode Content */
        <div className="h-full overflow-y-auto">
          <div
            className="prose prose-sm max-w-none text-base leading-relaxed"
            dangerouslySetInnerHTML={{
              __html:
                note.content ||
                '<span class="text-muted-foreground italic">This note is empty. Click Edit to add content.</span>',
            }}
          />
        </div>
      )}
    </CardContent>
  );
});

export default NoteContentView;