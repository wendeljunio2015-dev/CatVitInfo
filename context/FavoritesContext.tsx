"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "vitoria-informatica-favorites";

type FavoritesContextValue = {
  favoriteIds: string[];
  count: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setFavoriteIds(JSON.parse(saved));
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const value = useMemo<FavoritesContextValue>(() => ({
    favoriteIds,
    count: favoriteIds.length,
    isFavorite: (productId) => favoriteIds.includes(productId),
    toggleFavorite: (productId) => {
      setFavoriteIds((current) => current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]);
    },
    clearFavorites: () => setFavoriteIds([]),
  }), [favoriteIds]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within FavoritesProvider");
  return context;
}
