import { wines } from "../data/wines";
import { WineCard } from "./WineCard";
import styles from "./Favorites.module.css";

export function Favorites({ favorites, onSelect, onToggleFavorite }) {
  const favoriteWines = wines.filter((w) => favorites.includes(w.id));

  if (favoriteWines.length === 0) {
    return (
      <div className={styles.empty}>
        <p>♡</p>
        <p>No favorites yet. Browse wines and tap the heart to save them here.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {favoriteWines.map((wine) => (
        <WineCard
          key={wine.id}
          wine={wine}
          isFavorite
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
