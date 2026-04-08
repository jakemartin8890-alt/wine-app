import styles from "./WineDetail.module.css";

const typeEmoji = { red: "🍷", white: "🥂", rosé: "🌸", sparkling: "✨" };

export function WineDetail({ wine, isFavorite, onToggleFavorite, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.banner} style={{ background: wine.color }}>
          <span className={styles.bannerEmoji}>{typeEmoji[wine.type]}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <div>
              <span className={styles.type}>{wine.type} · {wine.grape}</span>
              <h2 className={styles.name}>{wine.name}</h2>
              <p className={styles.origin}>{wine.region}, {wine.country}{wine.vintage ? ` · ${wine.vintage}` : ""}</p>
            </div>
            <button
              className={`${styles.fav} ${isFavorite ? styles.favActive : ""}`}
              onClick={() => onToggleFavorite(wine.id)}
            >
              {isFavorite ? "♥ Saved" : "♡ Save"}
            </button>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Price</span>
              <span className={styles.statValue}>${wine.price}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Rating</span>
              <span className={styles.statValue}>{wine.rating} / 5</span>
            </div>
          </div>

          <section>
            <h4 className={styles.sectionTitle}>Tasting Notes</h4>
            <p className={styles.notes}>{wine.notes}</p>
          </section>

          <section>
            <h4 className={styles.sectionTitle}>Food Pairings</h4>
            <div className={styles.pairings}>
              {wine.pairings.map((p) => (
                <span key={p} className={styles.pairing}>{p}</span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
