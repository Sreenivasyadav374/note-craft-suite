import { useState, useCallback } from "react";

export const useFolderNavigation = () => {
  const [folderHistory, setFolderHistory] = useState<string[]>([]);

  const activeFolderId =
    folderHistory.length > 0 ? folderHistory[folderHistory.length - 1] : null;

  const openFolder = useCallback((folderId: string) => {
    setFolderHistory((prev) => [...prev, folderId]);
  }, []);

  const navigateBack = useCallback(() => {
    setFolderHistory((prev) => prev.slice(0, -1));
  }, []);

  return { folderHistory, activeFolderId, openFolder, navigateBack };
};
