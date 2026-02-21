[![Netlify Status](https://api.netlify.com/api/v1/badges/8352ecc1-e738-4904-a65e-6f900d759a90/deploy-status)](https://app.netlify.com/projects/mke-church-fish-fries/deploys)

# MKE Church Fish Fries

A web app to find Lenten fish fry events in the Milwaukee area for 2026. Browse locations, filter by date and service type, and view them on an interactive map. Data sourced from the Milwaukee Journal Sentinel.

## Features

- **Browse** — Filterable list of fish fry locations with details on fish types, sides, prices, hours, and contact info
- **Map** — Interactive Leaflet map with markers for each location and a "my location" button
- **Guide** — Coming soon

### Browse Filters

- Text search (name, city, fish types, sides)
- Specific Lenten Friday date
- Service type (Dine-in, Carry-out, Drive-through)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Routing | React Router 7 |
| Build | Vite 7 |
| UI | Bootstrap 5 |
| Map | Leaflet + React-Leaflet |
| Database | SQLite via sql.js (in-browser) |

## Project Structure

```
src/
├── pages/
│   ├── Home.tsx       # Landing page
│   ├── Browse.tsx     # Filterable location list
│   ├── Map.tsx        # Interactive map
│   └── Guide.tsx      # Guide (placeholder)
├── components/
│   ├── Layout.tsx     # Main layout wrapper
│   └── NavBar.tsx     # Navigation bar
├── lib/
│   ├── db.ts          # sql.js database access layer
│   └── types.ts       # TypeScript interfaces
public/
├── fish_fry.db        # SQLite database (not tracked in git)
└── sql-wasm.js        # sql.js WASM loader
```

## Database

The app loads a SQLite database (`fish_fry.db`) client-side using sql.js — no backend server is required.

**Schema:**

- `locations` — name, address, city, state, phone, website, venue notes
- `fish_fries` — location_id, dates (recurring or specific), hours, fish types, sides, pricing (adult/child/senior/family), service options (dine-in/carry-out/drive-through), description

## Getting Started

### Prerequisites

- Node.js (v24+)
- The `fish_fry.db` SQLite database file placed in the `public/` directory

### Install and Run

```bash
npm install
npm start
```

The dev server starts at `http://localhost:5173`.

### Other Scripts

```bash
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```
### Public Site Stats

https://cloud.umami.is/analytics/eu/share/uPDhbVoGsWIepZCk

## Data Source

Fish fry location data sourced from the [Milwaukee Journal Sentinel](https://www.jsonline.com).
