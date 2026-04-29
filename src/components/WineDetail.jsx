import { useState } from "react";
import { useEnrichment } from "../hooks/useEnrichment";
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
  const { enrichment, loading: enrichLoading } = useEnrichment(wine);

  // Prefer enrichment data for notes/pairings/grapes when from LWIN
  const grapes   = enrichment?.grapes   ?? (wine.grape ? [wine.grape] : []);
  const notes    = enrichment?.notes    ?? wine.notes ?? null;
  const pairings = enrichment?.pairings ?? wine.pairings ?? [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.banner} style={{ background: wine.color }}>
          <span className={styles.bannerEmoji}>{typeEmoji[wine.type] ?? "🍾"}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <div>
              <span className={styles.type}>
                {wine.type}{wine.grape ? ` · ${wine.grape}` : wine.colour ? ` · ${wine.colour}` : ""}
              </span>
              <h2 className={styles.name}>{wine.name}</h2>
              <p className={styles.origin}>
                {wine.producer && wine.producer !== wine.name ? `${wine.producer} · ` : ""}
                {wine.region}{wine.country ? `, ${wine.country}` : ""}
                {wine.vintage ? ` · ${wine.vintage}` : ""}
              </p>
            </div>
            <button
              className={`${styles.fav} ${isFavorite ? styles.favActive : ""}`}
              onClick={() => onToggleFavorite(wine)}
            >
              {isFavorite ? "♥ Saved" : "♡ Save"}
            </button>
          </div>

          <div className={styles.stats}>
            {wine.price && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Price</span>
                <span className={styles.statValue}>${wine.price}</span>
              </div>
            )}
            {wine.points && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>WE Points</span>
                <span className={styles.statValue}>{wine.points} pts</span>
              </div>
            )}
            {!wine.points && wine.rating && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Critic Score</span>
                <span className={styles.statValue}>{wine.rating} / 5</span>
              </div>
            )}
            {enrichment?.style && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Style</span>
                <span className={styles.statValue} style={{ fontSize: "0.85rem" }}>{enrichment.style}</span>
              </div>
            )}
          </div>

          <section>
            <h4 className={styles.sectionTitle}>Your Rating</h4>
            <StarRating value={userRating || 0} onChange={(stars) => onRate(wine.id, stars)} />
            {!userRating && <p className={styles.ratingPrompt}>Tap a star to rate this wine</p>}
          </section>

          {/* AI Tasting Profile */}
          {wine.source === "lwin" && (
            <section>
              <div className={styles.aiHeader}>
                <h4 className={styles.sectionTitle}>Tasting Profile</h4>
                <span className={styles.aiBadge}>✦ AI-generated</span>
              </div>
              <p className={styles.aiDisclosure}>
                Based on grape variety, region &amp; producer profile — not user reviews
              </p>

              {enrichLoading && (
                <div className={styles.enrichLoading}>
                  <span className={styles.enrichDot} /><span className={styles.enrichDot} /><span className={styles.enrichDot} />
                </div>
              )}

              {!enrichLoading && grapes.length > 0 && (
                <div className={styles.chips} style={{ marginBottom: 12 }}>
                  {grapes.map((g) => <span key={g} className={styles.grapeChip}>{g}</span>)}
                </div>
              )}

              {!enrichLoading && notes && (
                <p className={styles.notes}>{notes}</p>
              )}
            </section>
          )}

          {/* Real critic notes (Winemag) or static notes (mock) */}
          {wine.source !== "lwin" && notes && (
            <section>
              <div className={styles.aiHeader}>
                <h4 className={styles.sectionTitle}>Tasting Notes</h4>
                {wine.source === "winemag" && (
                  <span className={styles.sourceBadge}>Wine Enthusiast</span>
                )}
              </div>
              <p className={styles.notes}>{notes}</p>
            </section>
          )}

          {pairings.length > 0 && (
            <section>
              <h4 className={styles.sectionTitle}>Food Pairings</h4>
              <div className={styles.pairings}>
                {pairings.map((p) => (
                  <span key={p} className={styles.pairing}>{p}</span>
                ))}
              </div>
            </section>
          )}

          {wine.retailers?.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
