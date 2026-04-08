import { wineTypes } from "../data/wines";
import styles from "./SearchBar.module.css";

export function SearchBar({ query, type, onQueryChange, onTypeChange }) {
  return (
    <div className={styles.bar}>
      <input
        className={styles.input}
        type="search"
        placeholder="Search by name, grape, region…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <div className={styles.filters}>
        {wineTypes.map((t) => (
          <button
            key={t}
            className={`${styles.filter} ${type === t ? styles.active : ""}`}
            onClick={() => onTypeChange(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
