import { useState } from "react";

const KEY = "vino_ratings";

export function useRatings() {
  const [ratings, setRatings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  });

  function rate(wineId, stars) {
    setRatings((prev) => {
      const next = { ...prev, [wineId]: stars };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  return { ratings, rate };
}
