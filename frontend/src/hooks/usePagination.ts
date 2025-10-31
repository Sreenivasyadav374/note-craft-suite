import { useState, useEffect, useCallback } from "react";

export const usePagination = ({
  totalCount,
  NOTES_PER_PAGE = 20,
  refreshNotes,
}: any) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalCount / NOTES_PER_PAGE);

  const handlePageChange = useCallback(
    (page: number, activeFolderId?: string) => {
      if (page < 1 || page > totalPages) return;
      const offset = (page - 1) * NOTES_PER_PAGE;
      setCurrentPage(page);
      refreshNotes(offset, activeFolderId);
    },
    [totalPages, refreshNotes]
  );

  useEffect(() => {
    const savedPage = Number(localStorage.getItem("notesPage") || 1);
    setCurrentPage(savedPage);
    refreshNotes((savedPage - 1) * NOTES_PER_PAGE);
  }, []);

  useEffect(() => {
    localStorage.setItem("notesPage", currentPage.toString());
  }, [currentPage]);

  return { currentPage, totalPages, handlePageChange, setCurrentPage };
};
