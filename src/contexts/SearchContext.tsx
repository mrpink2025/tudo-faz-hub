import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
  currentSearchValue: string;
  setCurrentSearchValue: (value: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSearchValue, setCurrentSearchValue] = useState('');

  return (
    <SearchContext.Provider value={{ currentSearchValue, setCurrentSearchValue }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};