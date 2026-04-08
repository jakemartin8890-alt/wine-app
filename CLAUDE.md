# Wine Discovery App

A web app for discovering wines, viewing tasting details, and saving favorites.

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
    ├── index.css             # Global reset
    ├── App.jsx               # Root component — tab routing, state wiring
    ├── App.module.css
    ├── data/
    │   └── wines.js          # 12 mock wines + searchWines() filter helper
    ├── components/
    │   ├── SearchBar.jsx     # Text search + type filter buttons
    │   ├── SearchBar.module.css
    │   ├── WineCard.jsx      # Grid card with color swatch, heart button
    │   ├── WineCard.module.css
    │   ├── WineDetail.jsx    # Slide-up detail panel (modal)
    │   ├── WineDetail.module.css
    │   ├── Favorites.jsx     # Favorites tab — filtered grid + empty state
    │   └── Favorites.module.css
    └── hooks/
        └── useFavorites.js   # localStorage read/write for saved wine IDs
```

## Features Built

1. **Discover tab** — grid of all wines, searchable and filterable by type (red / white / rosé / sparkling)
2. **Wine cards** — color-coded left swatch, grape, region, vintage, price, rating, heart toggle
3. **Wine detail panel** — slide-up modal with tasting notes, food pairings, and save button
4. **Favorites tab** — persisted to `localStorage`; count badge in nav header

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

- [ ] Wine ratings by users (star input component)
- [ ] Sort options — by price, rating, or vintage
- [ ] Detail page route (`/wine/:id`) instead of modal, for shareable URLs
- [ ] Real wine API integration (swap out mock data in `wines.js`)
- [ ] Filter by country or price range
- [ ] "Recently viewed" section

## Conventions

- Function components with hooks only — no class components
- CSS Modules for all component styles — no inline styles except dynamic color values
- No external UI or icon libraries
- `searchWines(query, type)` in `wines.js` is the single filter entry point — extend it for new filter dimensions
