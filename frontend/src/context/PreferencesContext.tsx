import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SortOrder = 'recent' | 'alphabetical' | 'oldest';
export type EditorFontSize = 'small' | 'medium' | 'large';

interface Preferences {
  notificationsEnabled: boolean;
  defaultSortOrder: SortOrder;
  editorFontSize: EditorFontSize;
  autoSave: boolean;
  editorSpellCheck: boolean;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  resetPreferences: () => void;
}

const defaultPreferences: Preferences = {
  notificationsEnabled: true,
  defaultSortOrder: 'recent',
  editorFontSize: 'medium',
  autoSave: true,
  editorSpellCheck: true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem('appPreferences');
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('appPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.setItem('appPreferences', JSON.stringify(defaultPreferences));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
