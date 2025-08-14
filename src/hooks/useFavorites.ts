import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('favoriteListings');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const addFavorite = (listingId: string) => {
    if (!favorites.includes(listingId)) {
      const newFavorites = [...favorites, listingId];
      setFavorites(newFavorites);
      localStorage.setItem('favoriteListings', JSON.stringify(newFavorites));
    }
  };

  const removeFavorite = (listingId: string) => {
    const newFavorites = favorites.filter(id => id !== listingId);
    setFavorites(newFavorites);
    localStorage.setItem('favoriteListings', JSON.stringify(newFavorites));
  };

  const toggleFavorite = (listingId: string) => {
    if (favorites.includes(listingId)) {
      removeFavorite(listingId);
    } else {
      addFavorite(listingId);
    }
  };

  const isFavorite = (listingId: string) => favorites.includes(listingId);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite
  };
};