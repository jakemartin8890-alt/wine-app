import { useState, useEffect, useRef } from "react";
import { searchWines } from "../data/wines";

export function useWineSearch(query, type) {
  const [wines, setWines]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal]     = useState(0);
  const [usingLwin, setUsingLwin] = useState(false);
  const pageRef    = useRef(1);
  const debounceRef = useRef(null);

  async function doFetch(q, t, pg, append = false) {
    if (!append) setLoading(true);
    try {
      const params = new URLSearchParams({ q, type: t, page: pg, limit: 24 });
      const res  = await fetch(`/api/wines/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      // If server has no LWIN data, fall back to local mock search
      if (data.total === 0 && pg === 1 && !q && t === "all") {
        throw new Error("LWIN not loaded");
      }

      setWines((prev) => (append ? [...prev, ...data.wines] : data.wines));
      setHasMore(data.hasMore);
      setTotal(data.total);
      setUsingLwin(true);
    } catch {
      const mock = searchWines(q, t);
      setWines(mock);
      setHasMore(false);
      setTotal(mock.length);
      setUsingLwin(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    pageRef.current = 1;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(query, type, 1, false), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, type]);

  function loadMore() {
    pageRef.current += 1;
    doFetch(query, type, pageRef.current, true);
  }

  return { wines, loading, hasMore, total, usingLwin, loadMore };
}
