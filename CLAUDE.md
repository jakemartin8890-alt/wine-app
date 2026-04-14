# Vino — Mobile-First Wine Discovery App

**GitHub**: https://github.com/jakemartin8890-alt/wine-app

A mobile-first wine discovery app targeting Vivino's core use cases: scan, collect, discover, and share.

## Product Vision

Build a Vivino competitor with a dark, elegant UI (deep burgundy + gold) and a mobile-first bottom-nav shell. The five pillars:

| Tab | Purpose |
|---|---|
| **Scan** | Camera/barcode scan to instantly identify wines |
| **Cellar** | Personal wine collection saved to device (→ cloud) |
| **Discover** | Search and browse the wine catalog |
| **Social** | Follow friends, share tasting notes, activity feed |
| **Profile** | Tasting history, reviews, collection stats |

## Project Overview

Users can search for wines by name, grape, region, or type; view detailed tasting notes and food pairings; and save favorites to a persistent local collection.

## Tech Stack

- **Runtime**: Node.js v24 / npm v11
- **Framework**: React 18 + Vite 5
- **Styling**: CSS Modules (no UI libraries — all custom CSS)
- **State**: React `useState` / `useEffect` only — no external state library
- **Persistence**: `localStorage` via `useFavorites` hook
- **Data**: Mock wine dataset in `src/data/wines.js` — shaped to swap in a real API later

## Project Structure

```
wine-app/
├── CLAUDE.md
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              # React root
    ├── index.css             # Global reset + CSS custom properties (dark theme)
    ├── App.jsx               # Root component — 5-tab routing, state wiring
    ├── App.module.css
    ├── data/
    │   └── wines.js          # 12 mock wines + searchWines() filter helper
    ├── components/
    │   ├── BottomNav.jsx     # 5-tab fixed bottom navigation (Scan/Cellar/Discover/Social/Profile)
    │   ├── BottomNav.module.css
    │   ├── SearchBar.jsx     # Text search + type filter buttons
    │   ├── SearchBar.module.css
    │   ├── WineCard.jsx      # Grid card with color swatch, heart button
    │   ├── WineCard.module.css
    │   ├── WineDetail.jsx    # Slide-up detail panel (modal)
    │   ├── WineDetail.module.css
    │   ├── Favorites.jsx     # Cellar tab — filtered grid + empty state
    │   └── Favorites.module.css
    └── hooks/
        └── useFavorites.js   # localStorage read/write for saved wine IDs
```

## Features Built

1. **Bottom nav** — 5-tab fixed nav (Scan, Cellar, Discover, Social, Profile); Scan has a raised burgundy pill CTA
2. **Dark theme** — deep near-black bg, CSS custom properties throughout; burgundy + gold accent palette
3. **Discover tab** — grid of all wines, searchable and filterable by type (red / white / rosé / sparkling)
4. **Wine cards** — dark surface, color-coded swatch, grape, region, vintage, price, gold rating, heart toggle
5. **Wine detail panel** — dark slide-up modal with tasting notes, food pairings, and save button
6. **Cellar tab** — persisted to `localStorage`; count badge in top bar; placeholder screens for Scan/Social/Profile

## Wine Data Shape

```js
{
  id: number,
  name: string,
  type: "red" | "white" | "rosé" | "sparkling",
  grape: string,
  region: string,
  country: string,
  vintage: number | null,
  price: number,          // USD
  rating: number,         // 0–5
  notes: string,          // tasting notes
  pairings: string[],     // food pairings
  color: string,          // CSS hex for swatch/banner
}
```

## Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run preview
```

## Planned Features

### Scan
- [ ] Camera access + label photo capture (MediaDevices API)
- [ ] Barcode / QR scanning (ZXing or native BarcodeDetector API)
- [ ] Wine recognition via image → wine API lookup

### Cellar
- [ ] Wine ratings by user (star input component)
- [ ] Per-wine personal tasting notes
- [ ] Sort options — by price, rating, vintage, or date added
- [ ] Filter by country or price range
- [ ] Cloud sync (replace localStorage with a backend)

### Discover
- [ ] Detail page route (`/wine/:id`) instead of modal, for shareable URLs
- [ ] Real wine API integration (swap out mock data in `wines.js`)
- [ ] "Recently viewed" section
- [ ] Infinite scroll / pagination

### Social
- [ ] User accounts + auth
- [ ] Follow/following graph
- [ ] Activity feed (friends' recent tastings)
- [ ] Share a tasting note card (PNG export)

### Profile
- [ ] Tasting history timeline
- [ ] Palate stats (grape/region/type breakdown)
- [ ] Badges and achievements
- [ ] Export cellar to CSV

## Conventions

- Function components with hooks only — no class components
- CSS Modules for all component styles — no inline styles except dynamic color values
- No external UI or icon libraries
- `searchWines(query, type)` in `wines.js` is the single filter entry point — extend it for new filter dimensions
