import { useState, useRef, useEffect, useCallback } from "react";
import { useFavorites } from "../hooks/useFavorites";
import { useRatings } from "../hooks/useRatings";
import styles from "./SommelierChat.module.css";

const SUGGESTIONS = [
  "What wine pairs with salmon?",
  "Explain tannins to me",
  "Bold red under $30?",
  "Best Champagne for a special occasion",
  "Difference between Burgundy and Bordeaux?",
  "Natural wines — worth the hype?",
];

// ── Cellar context builder ────────────────────────────────────────────────────

const GRAPE_NORM = [
  [/^cab(ernet)?\s+franc/i,            "Cabernet Franc"],
  [/^cab(ernet)?(\s+sauv(ignon)?)?$/i, "Cabernet Sauvignon"],
  [/^pinot\s+gr(is|igio)/i,            "Pinot Grigio/Gris"],
  [/^pinot\s+noir/i,                   "Pinot Noir"],
  [/^pinot\s+blanc/i,                  "Pinot Blanc"],
  [/^sauv(ignon)?\s*blanc/i,           "Sauvignon Blanc"],
  [/^chard(onnay)?/i,                  "Chardonnay"],
  [/^syrah/i,                          "Syrah/Shiraz"],
  [/^shiraz/i,                         "Syrah/Shiraz"],
  [/^grenache/i,                       "Grenache/Garnacha"],
  [/^garnacha/i,                       "Grenache/Garnacha"],
  [/^malbec/i,                         "Malbec"],
  [/^merlot/i,                         "Merlot"],
  [/^riesling/i,                       "Riesling"],
  [/^zinfandel/i,                      "Zinfandel"],
  [/^tempranillo/i,                    "Tempranillo"],
  [/^sangiovese/i,                     "Sangiovese"],
  [/^nebbiolo/i,                       "Nebbiolo"],
  [/^viognier/i,                       "Viognier"],
  [/^chenin\s+blanc/i,                 "Chenin Blanc"],
  [/^mus(cat|cato)/i,                  "Muscat/Moscato"],
];

const REGION_NORM = [
  [/^napa/i,        "Napa Valley"],
  [/^bourgogne/i,   "Burgundy"],
  [/^burgundy/i,    "Burgundy"],
  [/^toscana/i,     "Tuscany"],
  [/^tuscany/i,     "Tuscany"],
  [/^champagne/i,   "Champagne"],
  [/^sonoma/i,      "Sonoma"],
  [/^rioja/i,       "Rioja"],
  [/^bordeaux/i,    "Bordeaux"],
  [/^piedmont/i,    "Piedmont"],
  [/^piemonte/i,    "Piedmont"],
  [/^barossa/i,     "Barossa Valley"],
  [/^marlborough/i, "Marlborough"],
  [/^mendoza/i,     "Mendoza"],
  [/^rh[oô]ne/i,    "Rhône Valley"],
];

function normGrape(raw) {
  const primary = (raw || "").split(/[,/]/)[0].trim();
  for (const [re, canonical] of GRAPE_NORM) {
    if (re.test(primary)) return canonical;
  }
  return primary || null;
}

function normRegion(raw) {
  const s = (raw || "").trim();
  for (const [re, canonical] of REGION_NORM) {
    if (re.test(s)) return canonical;
  }
  return s || null;
}

function starStr(n) { return "★".repeat(n); }

function fmtWine(wine, stars) {
  const grape  = wine.grape ? wine.grape.split(/[,/]/)[0].trim() : null;
  const region = wine.region || null;
  const meta   = [grape, region].filter(Boolean).join(", ");
  const rating = stars ? ` — ${starStr(stars)}` : "";
  const tag    = wine.scannedAt ? " · scanned" : "";
  return `- ${wine.name}${meta ? ` — ${meta}` : ""}${rating}${tag}`;
}

const TAIL = `
Don't recite this cellar list back to the user unprompted. If they ask directly what you know about their cellar, summarize it naturally.`;

function buildCellarContext(favoriteWines, ratings) {
  if (!favoriteWines.length) return null;

  const items  = favoriteWines.map(w => ({ wine: w, stars: ratings[w.id] ?? null }));
  const rated  = items.filter(i => i.stars !== null);
  const header = `The user's wine cellar (${favoriteWines.length} wine${favoriteWines.length !== 1 ? "s" : ""}, ${rated.length} rated):`;

  if (favoriteWines.length <= 30) {
    const loved    = items.filter(i => i.stars >= 4);
    const okay     = items.filter(i => i.stars === 3);
    const disliked = items.filter(i => i.stars !== null && i.stars <= 2);
    const unrated  = items.filter(i => i.stars === null);

    const sections = [
      loved.length    && `Loved (4–5★):\n${loved.map(i => fmtWine(i.wine, i.stars)).join("\n")}`,
      okay.length     && `Okay (3★):\n${okay.map(i => fmtWine(i.wine, i.stars)).join("\n")}`,
      disliked.length && `Disliked (1–2★):\n${disliked.map(i => fmtWine(i.wine, i.stars)).join("\n")}`,
      unrated.length  && `Saved, not yet rated:\n${unrated.map(i => fmtWine(i.wine, null)).join("\n")}`,
    ].filter(Boolean);

    return `${header}\n\n${sections.join("\n\n")}${TAIL}`;
  }

  // 31+ wines — aggregate profile + top/bottom entries
  const grapeMap  = {};
  const regionMap = {};

  for (const { wine, stars } of rated) {
    const g = normGrape(wine.grape);
    if (g) {
      grapeMap[g]  ??= { count: 0, total: 0 };
      grapeMap[g].count++;
      grapeMap[g].total += stars;
    }
    const r = normRegion(wine.region);
    if (r) {
      regionMap[r] ??= { count: 0, total: 0 };
      regionMap[r].count++;
      regionMap[r].total += stars;
    }
  }

  const byCountDesc = ([, a], [, b]) => {
    const diff = b.count - a.count;
    return diff !== 0 ? diff : (b.total / b.count) - (a.total / a.count);
  };

  const avg = v => v.total / v.count;

  const lovedGrapes = Object.entries(grapeMap)
    .filter(([, v]) => v.count >= 2 && avg(v) >= 4)
    .sort(byCountDesc).slice(0, 3)
    .map(([name, v]) => `${name} (${v.count} wines, avg ${avg(v).toFixed(1)}★)`);

  const dislikedGrapes = Object.entries(grapeMap)
    .filter(([, v]) => v.count >= 2 && avg(v) <= 2.5)
    .sort(byCountDesc).slice(0, 3)
    .map(([name, v]) => `${name} (${v.count} wines, avg ${avg(v).toFixed(1)}★)`);

  const topRegions = Object.entries(regionMap)
    .filter(([, v]) => v.count >= 2)
    .sort(byCountDesc).slice(0, 3)
    .map(([name, v]) => `${name} (${v.count} wines, avg ${avg(v).toFixed(1)}★)`);

  const top8 = [...rated].sort((a, b) => b.stars - a.stars).slice(0, 8);
  const bot3 = rated.filter(i => i.stars <= 2).sort((a, b) => a.stars - b.stars).slice(0, 3);

  const profileLines = [
    lovedGrapes.length    && `Loves: ${lovedGrapes.join(", ")}`,
    dislikedGrapes.length && `Dislikes: ${dislikedGrapes.join(", ")}`,
    topRegions.length     && `Top regions: ${topRegions.join(", ")}`,
  ].filter(Boolean);

  const sections = [
    profileLines.length && `Taste profile:\n${profileLines.map(l => `- ${l}`).join("\n")}`,
    top8.length         && `Top-rated wines:\n${top8.map(i => fmtWine(i.wine, i.stars)).join("\n")}`,
    bot3.length         && `Wines they didn't enjoy (avoid recommending similar styles):\n${bot3.map(i => fmtWine(i.wine, i.stars)).join("\n")}`,
  ].filter(Boolean);

  return `${header}\n\n${sections.join("\n\n")}${TAIL}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SommelierChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { favoriteWines } = useFavorites();
  const { ratings }       = useRatings();
  // Computed once on mount — cellar doesn't change mid-session
  const [cellarContext]   = useState(() => buildCellarContext(favoriteWines, ratings));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg = { role: "user", content: trimmed };
      const history = [...messages, userMsg];

      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setIsStreaming(true);

      console.log("[Sommelier] cellarContext:", cellarContext ?? "(none — empty cellar)");

      try {
        const res = await fetch("/api/sommelier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
            ...(cellarContext && { cellarContext }),
          }),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break;

            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                  return updated;
                });
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content:
              "Sorry, I ran into an issue. Please check your API key and try again.",
            isError: true,
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, cellarContext]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setIsStreaming(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const lastIsStreaming =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>W</div>
          <div>
            <span className={styles.headerTitle}>Ask the Sommelier</span>
            <span className={styles.headerSub}>Master sommelier · Powered by Claude</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button className={styles.resetBtn} onClick={handleReset} title="New conversation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        )}
      </div>

      {/* Cellar context badge — shows what the sommelier knows */}
      {cellarContext && (
        <div className={styles.cellarBadge}>
          <button
            className={styles.cellarBadgeBtn}
            onClick={() => setShowContext(v => !v)}
          >
            <span>◈</span>
            <span>Personalized · {favoriteWines.length} wine{favoriteWines.length !== 1 ? "s" : ""} in cellar</span>
            <span className={styles.cellarChevron}>{showContext ? "▴" : "▾"}</span>
          </button>
          {showContext && (
            <pre className={styles.contextPreview}>{cellarContext}</pre>
          )}
        </div>
      )}

      {/* Message list */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <div className={styles.welcomeMark}>◈</div>
            <p className={styles.welcomeText}>
              Ask me anything about wine — pairings, regions, grapes, producers,
              or how to navigate a wine list.
            </p>
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className={styles.suggestion}
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.row} ${
              msg.role === "user" ? styles.userRow : styles.assistantRow
            }`}
          >
            {msg.role === "assistant" && (
              <div className={styles.msgAvatar}>V</div>
            )}
            <div
              className={`${styles.bubble} ${
                msg.role === "user" ? styles.userBubble : styles.assistantBubble
              } ${msg.isError ? styles.errorBubble : ""}`}
            >
              {msg.content ||
                (lastIsStreaming && i === messages.length - 1 ? (
                  <span className={styles.typing}>
                    <span /><span /><span />
                  </span>
                ) : null)}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Ask about wine…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          className={styles.sendBtn}
          type="submit"
          disabled={!input.trim() || isStreaming}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </form>
    </div>
  );
}
