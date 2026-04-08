import styles from "./WineCard.module.css";

const typeEmoji = { red: "🍷", white: "🥂", rosé: "🌸", sparkling: "✨" };

export function WineCard({ wine, isFavorite, onSelect, onToggleFavorite }) {
  return (
    <div className={styles.card} onClick={() => onSelect(wine)}>
      <div className={styles.swatch} style={{ background: wine.color }} />
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.type}>{typeEmoji[wine.type]} {wine.type}</span>
          <button
            className={`${styles.fav} ${isFavorite ? styles.favActive : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(wine.id); }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>
        <h3 className={styles.name}>{wine.name}</h3>
        <p className={styles.meta}>{wine.grape} · {wine.region}, {wine.country}</p>
        {wine.vintage && <p className={styles.vintage}>{wine.vintage}</p>}
        <div className={styles.footer}>
          <span className={styles.price}>${wine.price}</span>
          <span className={styles.rating}>{"★".repeat(Math.round(wine.rating))} {wine.rating}</span>
        </div>
      </div>
    </div>
  );
}
