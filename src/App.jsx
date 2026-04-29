import { useState } from "react";
import { useFavorites } from "./hooks/useFavorites";
import { useRatings } from "./hooks/useRatings";
import { useWineSearch } from "./hooks/useWineSearch";
import { SearchBar } from "./components/SearchBar";
import { WineCard } from "./components/WineCard";
import { WineDetail } from "./components/WineDetail";
import { Favorites } from "./components/Favorites";
import { BottomNav } from "./components/BottomNav";
import { SommelierChat } from "./components/SommelierChat";
import { WineScanner } from "./components/WineScanner";
import styles from "./App.module.css";

function PlaceholderScreen({ icon, title, sub }) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderIcon}>{icon}</span>
      <h2 className={styles.placeholderTitle}>{title}</h2>
      <p className={styles.placeholderSub}>{sub}</p>
      <span className={styles.comingSoon}>Coming soon</span>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState(null);
  const { favorites, favoriteWines, toggle } = useFavorites();
  const { ratings, rate } = useRatings();
  const { wines: results, loading: searchLoading, hasMore, total, usingLwin, loadMore } = useWineSearch(query, type);

  return (
    <div className={styles.app}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>◈</span>
          <div>
            <span className={styles.logo}>Wine About It</span>
            <span className={styles.logoSub}>Discover · Collect · Share</span>
          </div>
        </div>
        {favorites.length > 0 && (
          <span className={styles.cellarBadge}>{favorites.length} in cellar</span>
        )}
      </header>

      <main className={`${styles.main} ${tab === "profile" ? styles.chatMain : ""}`}>
        {tab === "scan" && <WineScanner />}

        {tab === "discover" && (
          <>
            <SearchBar
              query={query}
              type={type}
              onQueryChange={setQuery}
              onTypeChange={setType}
            />
            {usingLwin && (
              <p className={styles.dataSource}>
                {total > 0 ? `${total.toLocaleString()} wines` : ""} · LWIN database
              </p>
            )}
            {searchLoading && results.length === 0 ? (
              <p className={styles.empty}>Searching…</p>
            ) : results.length === 0 ? (
              <p className={styles.empty}>No wines match your search.</p>
            ) : (
              <>
                <div className={styles.grid}>
                  {results.map((wine) => (
                    <WineCard
                      key={wine.id}
                      wine={wine}
                      isFavorite={favorites.includes(wine.id)}
                      onSelect={setSelected}
                      onToggleFavorite={toggle}
                      userRating={ratings[wine.id]}
                    />
                  ))}
                </div>
                {hasMore && (
                  <button
                    className={styles.loadMore}
                    onClick={loadMore}
                    disabled={searchLoading}
                  >
                    {searchLoading ? "Loading…" : "Load more"}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {tab === "cellar" && (
          <Favorites
            favoriteWines={favoriteWines}
            onSelect={setSelected}
            onToggleFavorite={toggle}
            ratings={ratings}
          />
        )}

        {tab === "social" && (
          <PlaceholderScreen
            icon="◎"
            title="Social"
            sub="Follow friends, share tasting notes, and discover what others are drinking."
          />
        )}

        {tab === "profile" && <SommelierChat />}
      </main>

      <BottomNav tab={tab} onTabChange={setTab} />

      {selected && (
        <WineDetail
          wine={selected}
          isFavorite={favorites.includes(selected.id)}
          onToggleFavorite={toggle}
          onClose={() => setSelected(null)}
          userRating={ratings[selected.id]}
          onRate={rate}
        />
      )}
    </div>
  );
}
