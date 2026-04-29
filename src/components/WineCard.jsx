import styles from "./WineCard.module.css";

const typeEmoji = { red: "🍷", white: "🥂", rosé: "🌸", sparkling: "✨" };

export function WineCard({ wine, isFavorite, onSelect, onToggleFavorite, userRating }) {
  const label = wine.type && typeEmoji[wine.type]
    ? `${typeEmoji[wine.type]} ${wine.type}`
    : wine.colour || wine.type || "";

  const subtitle = wine.source === "lwin"
    ? `${wine.producer || ""}${wine.producer && wine.region ? " · " : ""}${wine.region || ""}${wine.country ? `, ${wine.country}` : ""}`
    : `${wine.grape || ""} · ${wine.region || ""}, ${wine.country || ""}`;

  return (
    <div className={styles.card} onClick={() => onSelect(wine)}>
      <div className={styles.swatch} style={{ background: wine.color || "#5a3a4a" }} />
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.type}>{label}</span>
          <button
            className={`${styles.fav} ${isFavorite ? styles.favActive : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(wine); }}
            aria-label={isFavorite ? "Remove from cellar" : "Add to cellar"}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>
        <h3 className={styles.name}>{wine.name}</h3>
        {subtitle && <p className={styles.meta}>{subtitle}</p>}
        {wine.vintage && <p className={styles.vintage}>{wine.vintage}</p>}
        <div className={styles.footer}>
          {wine.price
            ? <span className={styles.price}>${wine.price}</span>
            : <span />
          }
          {userRating ? (
            <span className={`${styles.rating} ${styles.userRating}`}>
              {"★".repeat(userRating)} You
            </span>
          ) : wine.rating ? (
            <span className={styles.rating}>{"★".repeat(Math.round(wine.rating))} {wine.rating}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
