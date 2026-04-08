import { useState } from "react";

const STORAGE_KEY = "wine-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  function toggle(wineId) {
    setFavorites((prev) => {
      const next = prev.includes(wineId)
        ? prev.filter((id) => id !== wineId)
        : [...prev, wineId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return { favorites, toggle };
}
