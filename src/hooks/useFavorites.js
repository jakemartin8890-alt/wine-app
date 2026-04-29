import { useState } from "react";

const STORAGE_KEY = "wine-favorites";

export function useFavorites() {
  const [favMap, setFavMap] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      // Migrate old format (array of IDs) to new format (id → wine object map)
      if (Array.isArray(parsed)) return {};
      return parsed;
    } catch {
      return {};
    }
  });

  const favorites = Object.keys(favMap);
  const favoriteWines = Object.values(favMap);

  function toggle(wine) {
    setFavMap((prev) => {
      const next = { ...prev };
      if (next[wine.id]) {
        delete next[wine.id];
      } else {
        next[wine.id] = wine;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return { favorites, favoriteWines, toggle };
}
