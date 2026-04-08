import { useState } from "react";
import { searchWines } from "./data/wines";
import { useFavorites } from "./hooks/useFavorites";
import { SearchBar } from "./components/SearchBar";
import { WineCard } from "./components/WineCard";
import { WineDetail } from "./components/WineDetail";
import { Favorites } from "./components/Favorites";
import styles from "./App.module.css";

export default function App() {
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState(null);
  const { favorites, toggle } = useFavorites();

  const results = searchWines(query, type);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>🍷 Wine Discovery</h1>
        <nav className={styles.nav}>
          <button
            className={`${styles.tab} ${tab === "discover" ? styles.tabActive : ""}`}
            onClick={() => setTab("discover")}
          >
            Discover
          </button>
          <button
            className={`${styles.tab} ${tab === "favorites" ? styles.tabActive : ""}`}
            onClick={() => setTab("favorites")}
          >
            Favorites {favorites.length > 0 && <span className={styles.badge}>{favorites.length}</span>}
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {tab === "discover" && (
          <>
            <SearchBar
              query={query}
              type={type}
              onQueryChange={setQuery}
              onTypeChange={setType}
            />
            {results.length === 0 ? (
              <p className={styles.empty}>No wines match your search.</p>
            ) : (
              <div className={styles.grid}>
                {results.map((wine) => (
                  <WineCard
                    key={wine.id}
                    wine={wine}
                    isFavorite={favorites.includes(wine.id)}
                    onSelect={setSelected}
                    onToggleFavorite={toggle}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "favorites" && (
          <Favorites
            favorites={favorites}
            onSelect={setSelected}
            onToggleFavorite={toggle}
          />
        )}
      </main>

      {selected && (
        <WineDetail
          wine={selected}
          isFavorite={favorites.includes(selected.id)}
          onToggleFavorite={toggle}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
