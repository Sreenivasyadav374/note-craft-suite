// src/context/ConnectionContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ConnectionContextType {
  isOffline: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

interface ConnectionProviderProps {
  children: ReactNode;
}

export const ConnectionProvider = ({ children }: ConnectionProviderProps) => {
  // Initialize state based on the current connection status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    // Set initial state for immediate accuracy (in case it changes just before listeners are added)
    setIsOffline(!navigator.onLine);

    // Add event listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const value = { isOffline };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

// Custom hook for easy consumption
export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    // This provides a helpful error if the hook is used outside the provider
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};