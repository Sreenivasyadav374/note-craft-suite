import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

export type SortOrder = 'recent' | 'alphabetical' | 'oldest';
export type EditorFontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'gold' | 'blue' | 'green' | 'rose';
export type FontSize = 'normal' | 'large' | 'extra-large';
export type ReducedMotion = boolean;

interface Preferences {
  notificationsEnabled: boolean;
  defaultSortOrder: SortOrder;
  editorFontSize: EditorFontSize;
  autoSave: boolean;
  editorSpellCheck: boolean;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  fontSize: FontSize;
  reducedMotion: ReducedMotion;
  highContrast: boolean;
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
  themeMode: 'system',
  themeColor: 'gold',
  fontSize: 'normal',
  reducedMotion: false,
  highContrast: false,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem('appPreferences');
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('appPreferences', JSON.stringify(preferences));
    applyThemePreferences(preferences);
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.setItem('appPreferences', JSON.stringify(defaultPreferences));
  }, []);

  const contextValue = useMemo(() => ({
    preferences,
    updatePreference,
    resetPreferences
  }), [preferences, updatePreference, resetPreferences]);

  return (
    <PreferencesContext.Provider value={contextValue}>
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

function applyThemePreferences(prefs: Preferences) {
  const root = document.documentElement;

  if (prefs.themeMode === 'dark') {
    root.classList.add('dark');
  } else if (prefs.themeMode === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  root.setAttribute('data-theme-color', prefs.themeColor);
  root.setAttribute('data-font-size', prefs.fontSize);
  root.setAttribute('data-reduced-motion', String(prefs.reducedMotion));
  root.setAttribute('data-high-contrast', String(prefs.highContrast));
}
