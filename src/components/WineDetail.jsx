import { useState } from "react";
import styles from "./WineDetail.module.css";

const typeEmoji = { red: "🍷", white: "🥂", rosé: "🌸", sparkling: "✨" };

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`${styles.star} ${(hover || value) >= star ? styles.starFilled : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
      {value > 0 && <span className={styles.ratingLabel}>{value} / 5</span>}
    </div>
  );
}

export function WineDetail({ wine, isFavorite, onToggleFavorite, onClose, userRating, onRate }) {
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
              <span className={styles.statLabel}>Critic Score</span>
              <span className={styles.statValue}>{wine.rating} / 5</span>
            </div>
          </div>

          <section>
            <h4 className={styles.sectionTitle}>Your Rating</h4>
            <StarRating value={userRating || 0} onChange={(stars) => onRate(wine.id, stars)} />
            {!userRating && <p className={styles.ratingPrompt}>Tap a star to rate this wine</p>}
          </section>

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

          <section>
            <h4 className={styles.sectionTitle}>Where to Buy</h4>
            <div className={styles.retailers}>
              {wine.retailers.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.retailerLink}
                >
                  {r.name} ↗
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
