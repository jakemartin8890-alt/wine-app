import { WineCard } from "./WineCard";
import styles from "./Favorites.module.css";

export function Favorites({ favoriteWines, onSelect, onToggleFavorite, ratings }) {
  if (favoriteWines.length === 0) {
    return (
      <div className={styles.empty}>
        <p>♡</p>
        <p>Your cellar is empty. Browse wines and tap the heart to add them here.</p>
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
          userRating={ratings?.[wine.id]}
        />
      ))}
    </div>
  );
}
