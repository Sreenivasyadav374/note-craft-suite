import React, {
  Suspense,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useNotes } from "../context/NotesContext";
import { usePreferences } from "../context/PreferencesContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import SidebarControls from "@/components/SidebarControls";
import PaginationControls from "@/components/PaginationControls";
import AppHeader from "@/components/AppHeader";
import NoteList from "./NoteList";
import SelectNoteCard from "./SelectNoteCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Lazy components
const LazyMainNoteContent = React.lazy(() => import("./MainNoteContent"));
const LazyProfileDrawer = React.lazy(() => import("./ProfileDrawer"));

// --- Custom hooks
import { useNoteActions } from "@/hooks/useNoteAction";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { usePagination } from "@/hooks/usePagination";

const NotesApp = () => {
  const navigate = useNavigate();
  const {
    notes,
    setNotes,
    isLoading: notesLoading,
    addNoteOffline,
    updateNoteOffline,
    deleteNoteOffline,
    removeNoteFromIDB,
    refreshNotes,
    totalCount,
    //syncOfflineNotes,
  } = useNotes();

  const { preferences } = usePreferences();
  const { token, isAuthenticated, userProfile } = useAuthContext();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // --- UI and editor states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "note">("list");

  // --- Editor content states
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editReminderDate, setEditReminderDate] = useState("");
  const [aiFixTrigger, setAiFixTrigger] = useState(0);

  // --- Folder navigation and pagination
  const { folderHistory, activeFolderId, openFolder, navigateBack } =
    useFolderNavigation();

  const { currentPage, totalPages, handlePageChange } = usePagination({
    totalCount,
    refreshNotes,
  });

  const memoizedStartEditing = useCallback(
    (note: any) => {
      setSelectedNote(note);
      setIsEditing(true);
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditTags(note.tags.join(", "));
      if (note.reminderDate) {
        const local = new Date(note.reminderDate);
        const localISOString = new Date(
          local.getTime() - local.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        setEditReminderDate(localISOString);
      } else {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const defaultISOString = new Date(
          today.getTime() - today.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        setEditReminderDate(defaultISOString);
      }
    },
    []
  );


  // --- Note actions (CRUD, AI, Calendar)
  const noteActions = useNoteActions({
    token,
    activeFolderId,
    addNoteOffline,
    updateNoteOffline,
    deleteNoteOffline,
    removeNoteFromIDB,
    refreshNotes,
    setNotes,
    notes,
    selectedNote,
    setSelectedNote,
    setIsEditing,
  });

  // --- Filter and sort notes
  const currentNotes = useMemo(() => {
    let items = notes.filter((n) => n.parentId === activeFolderId);

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(lower) ||
          (n.type === "file" && n.content.toLowerCase().includes(lower)) ||
          n.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }

    items.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      switch (preferences.defaultSortOrder) {
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "recent":
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

    return items;
  }, [notes, activeFolderId, searchTerm, preferences.defaultSortOrder]);

  // --- Cancel editing
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTags(selectedNote.tags.join(", "));
      setEditReminderDate(
        selectedNote.reminderDate
          ? new Date(selectedNote.reminderDate).toISOString().slice(0, 16)
          : ""
      );
    }
  }, [selectedNote]);

  // --- Select item (note or folder)
  const handleItemSelect = useCallback(
    (item: any) => {
      if (item.type === "folder") openFolder(item.id);
      else {
        setSelectedNote(item);
        setIsEditing(false);
        setMobileView("note");
        setEditTitle(item.title);
        setEditContent(item.content);
        setEditTags(item.tags.join(", "));
        setEditReminderDate(
          item.reminderDate
            ? new Date(item.reminderDate).toISOString().slice(0, 16)
            : ""
        );
      }
    },
    [openFolder]
  );

  const handleItemDeleteClick = useCallback((e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setNoteToDelete(item);
  }, []);

  const handleMobileBack = useCallback(() => {
    setMobileView("list");
  }, []);

  // --- Sync when online
  // useEffect(() => {
  //   window.addEventListener("online", syncOfflineNotes);
  //   return () => window.removeEventListener("online", syncOfflineNotes);
  // }, [syncOfflineNotes]);

  // --- Refresh when folder changes
  useEffect(() => {
    refreshNotes(0, activeFolderId);
  }, [activeFolderId]);

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center text-lg">
        Please log in to view your notes.
      </div>
    );
  }

  const navigateToCalendar = useCallback(() => {
    navigate("/calendar");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userProfile={userProfile}
        setIsDrawerOpen={setIsDrawerOpen}
        navigateToCalendar={navigateToCalendar}
      />

      <Suspense fallback={null}>
        {isDrawerOpen && (
          <LazyProfileDrawer
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
          />
        )}
      </Suspense>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!noteToDelete}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{noteToDelete?.title}"?
              {noteToDelete?.type === "folder" &&
                " All items inside this folder will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                noteActions.deleteNote(noteToDelete);
                setNoteToDelete(null);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Layout */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Sidebar */}
          <div
            className={`lg:col-span-1 flex flex-col h-full ${
              isMobile
                ? mobileView === "list"
                  ? "block"
                  : "hidden"
                : "block"
            }`}
          >
            <SidebarControls
              activeFolderId={activeFolderId}
              notes={notes}
              navigateBack={navigateBack}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              createNewNote={noteActions.createNewNote}
              createNewFolder={noteActions.createNewFolder}
              isCreating={noteActions.isCreating}
              notesLoading={notesLoading}
            />

            {!notesLoading && (
              <NoteList
                currentNotes={currentNotes}
                notesLength={notes.length}
                selectedNoteId={selectedNote?.id || null}
                handleItemSelect={handleItemSelect}
                handleItemDeleteClick={handleItemDeleteClick}
              />
            )}

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              handlePageChange={handlePageChange}
            />
          </div>

          {/* Main Content */}
          <div
            className={`lg:col-span-2 ${
              isMobile
                ? mobileView === "note"
                  ? "block"
                  : "hidden"
                : "block"
            }`}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  Loading Editor...
                </div>
              }
            >
              {selectedNote ? (
                <LazyMainNoteContent
                  isMobile={isMobile}
                  mobileView={mobileView}
                  handleMobileBack={handleMobileBack}
                  createNewNote={noteActions.createNewNote}
                  selectedNote={selectedNote}
                  isEditing={isEditing}
                  memoizedStartEditing={memoizedStartEditing}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  editTags={editTags}
                  setEditTags={setEditTags}
                  editReminderDate={editReminderDate}
                  setEditReminderDate={setEditReminderDate}
                  aiFixTrigger={aiFixTrigger}
                  memoizedSaveNote={() =>
                    noteActions.saveNote(selectedNote, {
                      title: editTitle,
                      content: editContent,
                      tags: editTags,
                      reminderDate: editReminderDate,
                    })
                  }
                  memoizedCancelEditing={cancelEditing}
                  memoizedHandleAISuggestion={() =>
                    noteActions.suggestAI(
                      editTitle,
                      editContent,
                      ({ title, tags }: any) => {
                        setEditTitle(title);
                        setEditTags(tags);
                      }
                    )
                  }
                  memoizedFixContentWithAI={() =>
                    noteActions.fixContentAI(editContent, setEditContent)
                  }
                  memoizedExportToCalendar={(provider: string) =>
                    noteActions.exportCalendar(selectedNote, provider)
                  }
                  isSuggesting={noteActions.isSuggesting}
                  isFixingContent={noteActions.isFixingContent}
                />
              ) : (
                !isMobile && (
                  <SelectNoteCard createNewNote={noteActions.createNewNote} />
                )
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesApp;
