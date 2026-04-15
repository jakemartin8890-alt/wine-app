import { useState, useEffect } from "react";

// Module-level cache — survives re-renders, cleared on page refresh
const cache = new Map();

export function useEnrichment(wine) {
  const [enrichment, setEnrichment] = useState(
    wine ? (cache.get(wine.id) ?? null) : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wine || wine.source !== "lwin") return;
    if (cache.has(wine.id)) {
      setEnrichment(cache.get(wine.id));
      return;
    }

    setLoading(true);
    fetch("/api/wines/enrich", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        id:       wine.id,
        name:     wine.name,
        producer: wine.producer,
        region:   wine.region,
        country:  wine.country,
        colour:   wine.colour,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          cache.set(wine.id, data);
          setEnrichment(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wine?.id]);

  return { enrichment, loading };
}
