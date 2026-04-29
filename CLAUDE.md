# Wine About It — Mobile-First Wine Discovery App

**GitHub**: https://github.com/jakemartin8890-alt/wine-app

A mobile-first wine discovery app targeting Vivino's core use cases: scan, collect, discover, and share. Installable as a PWA on iOS and Android.

## Product Vision

Build a Vivino competitor with a dark, elegant UI (deep burgundy + gold) and a mobile-first bottom-nav shell. The five pillars:

| Tab | Purpose |
|---|---|
| **Scan** | Live camera viewfinder → Claude vision → instant wine ID |
| **Cellar** | Personal wine collection saved to device (→ cloud) |
| **Discover** | Search and browse 150K real wines (Winemag dataset) |
| **Social** | Follow friends, share tasting notes, activity feed |
| **Profile** | AI Sommelier chat (Ask Vino, powered by Claude) |

## Tech Stack

- **Runtime**: Node.js v24 / npm v11
- **Framework**: React 18 + Vite 5
- **Styling**: CSS Modules (no UI libraries — all custom CSS)
- **State**: React `useState` / `useEffect` only — no external state library
- **Persistence**: `localStorage` via `useFavorites`, `useRatings` hooks
- **Data**: 150K Winemag wines auto-downloaded at server startup (`data/winemag.csv`)
- **AI**: Claude Sonnet (vision/scan), Claude Opus (sommelier chat), Claude Haiku (enrichment)
- **PWA**: `vite-plugin-pwa` + Workbox service worker; installable, offline-capable

## Project Structure

```
wine-app/
├── CLAUDE.md
├── index.html
├── package.json
├── vite.config.js
├── data/
│   ├── winemag.csv           # 150K Wine Enthusiast reviews (auto-downloaded, gitignored)
│   └── lwin.csv              # Optional LWIN backbone (gitignored)
├── public/
│   ├── icon.svg              # SVG app icon (◈ diamond mark)
│   ├── icon-180.png          # Apple touch icon
│   ├── icon-192.png          # Android PWA icon
│   └── icon-512.png          # Splash / maskable icon
├── scripts/
│   └── generate-icons.js     # Pure Node.js PNG icon generator
└── src/
    ├── main.jsx
    ├── index.css             # Global reset + CSS custom properties (dark theme)
    ├── App.jsx               # Root component — 5-tab routing, state wiring
    ├── App.module.css
    ├── data/
    │   └── wines.js          # 12 mock wines (fallback) + searchWines() helper
    ├── components/
    │   ├── BottomNav.jsx
    │   ├── SearchBar.jsx
    │   ├── WineCard.jsx      # Handles both mock and Winemag/LWIN data shapes
    │   ├── WineDetail.jsx    # Slide-up panel: WE notes, user rating, where-to-buy, AI enrichment
    │   ├── Favorites.jsx     # Cellar tab
    │   ├── WineScanner.jsx   # Live camera (getUserMedia) → Claude vision → result card
    │   └── SommelierChat.jsx # Streaming Claude chat (Ask Vino)
    └── hooks/
        ├── useFavorites.js   # localStorage favorites
        ├── useRatings.js     # localStorage user star ratings
        ├── useWineSearch.js  # Debounced API search with mock fallback
        └── useEnrichment.js  # Claude Haiku AI enrichment with client-side cache
```

## Features Built

1. **PWA** — installable on iOS/Android, offline-capable, Workbox service worker
2. **Bottom nav** — 5-tab fixed nav; Scan has raised burgundy pill CTA
3. **Dark theme** — deep near-black bg, CSS custom properties; burgundy + gold palette
4. **Discover tab** — 150K real Winemag wines, debounced search, type filter, pagination
5. **Wine cards** — color-coded swatch, producer, region, WE rating, user star rating
6. **Wine detail panel** — WE tasting notes + "Wine Enthusiast" badge, WE points, user rating (1–5 stars), food pairings, where-to-buy retailer links, AI tasting profile for LWIN wines
7. **Cellar tab** — localStorage favorites + user ratings
8. **Scan tab** — live camera viewfinder, capture → Claude vision → wine name/vintage/region/grapes/notes/pairings/price range result card
9. **AI Sommelier** — streaming Claude Opus chat in Profile tab

## Server API

| Endpoint | Description |
|---|---|
| `GET /api/wines/search?q=&type=&page=&limit=` | Search 150K Winemag wines, paginated |
| `POST /api/wines/enrich` | Claude Haiku AI tasting profile for a wine |
| `POST /api/scan` | Claude Sonnet vision: identify wine label from base64 image |
| `POST /api/sommelier` | Claude Opus streaming chat |

## Wine Data Shapes

**Winemag wine** (from `/api/wines/search`):
```js
{
  id, name, producer, grape, region, country,
  type, color,          // CSS hex, derived from variety
  rating,               // 0–5 normalized from WE points
  points,               // raw WE score (80–100)
  price,                // USD or null
  notes,                // Wine Enthusiast tasting note
  source: "winemag",
  searchText,
}
```

**Mock wine** (fallback, `src/data/wines.js`):
```js
{
  id, name, type, grape, region, country, vintage,
  price, rating, notes, pairings, color,
  retailers: [{ name, url }],
}
```

## Development

```bash
npm install
npm run dev             # http://localhost:5173 (starts both Vite + Express)
npm run build           # production build (includes PWA service worker)
npm run preview         # preview production build locally
npm run generate-icons  # regenerate PNG icons from scripts/generate-icons.js
```

**Dev notes:**
- `.env` file required with `ANTHROPIC_API_KEY=sk-ant-...` — never commit this
- `data/winemag.csv` auto-downloads on first server start (~47MB, gitignored)
- Vite proxies `/api/*` to Express on port 3001 in dev

## Next Session Priorities

### 1. Social — PM-first, no code until designed
Before writing any code, define:
- **The social loop**: what action creates the feed? (rate a wine → appears in friends' feeds? save to cellar? write a note?)
- **Differentiation from Vivino**: Vivino's social is weak/spammy — what's our angle? (curated taste profiles? sommelier-assisted notes? private friend groups vs public?)
- **MVP scope**: minimum feature set that creates real engagement vs. ghost-town syndrome
- **Success metrics**: what does "Social is working" look like at 100 users?

### 2. AI Sommelier prominence
- The Profile tab hides the sommelier behind a nav icon with no label context
- Consider: rename Profile tab to "Sommelier" or "Ask Vino", add it as a floating button in Discover, or surface it from the wine detail panel ("Ask about this wine")
- The sommelier is a strong differentiator — it should be more discoverable

### 3. Scanned wines → Save to Cellar
- Currently the scan result card has no "Save to Cellar" button
- Scanned wines have a different shape than Winemag wines (no ID, no source field)
- Need: generate a stable ID for scanned wines, store full wine object in localStorage, show in Cellar tab

### 4. App name + onboarding/marketing copy
- "Vino" may conflict with existing apps — research and decide on final name
- Add first-launch onboarding (3-screen carousel or single splash): what is this app, what can you do, why AI?
- Add marketing copy hooks: tagline in header, empty-state CTAs that sell the value prop

## Conventions

- Function components with hooks only — no class components
- CSS Modules for all component styles — no inline styles except dynamic color values
- No external UI or icon libraries
- `searchWines(query, type)` in `wines.js` is the single filter entry point for mock fallback
- AI-generated content must be labeled — never present Claude output as authoritative reviews
