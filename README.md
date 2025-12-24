## CoinMag — Liquidation Map Frontend

CoinMag is a clean, fast web UI for exploring crypto liquidation “gravity” in two ways:

- **Cross Sectional**: a snapshot of liquidation liquidity above/below price (precise, order-level bars)
- **Heatmap**: a time × price “liquidity field” that **stops rendering a level after price wipes it**
- **Accuracy**: a live audit trail of bias predictions + outcomes (Supabase-backed)

### Live Routes

- **Cross Sectional**: `/cross-sectional`
- **Heatmap**: `/heatmap`
- **Prediction Accuracy**: `/accuracy`

### What’s Special Here

- **Raw liquidations support**: we render individual liquidation levels from `raw_liquidations` (not just aggregated bins).
- **Consumption logic (heatmap)**: levels render from their `entry_time` until the first candle that crosses that price.
- **Price overlay (heatmap)**: we overlay a real market price line (CoinGecko OHLC) so you can see price moving through liquidity.
- **Theme-first UI**: deliberate spacing, minimal chrome, light/dark palettes, and a subtle API status indicator.

---

## Getting Started

### Prerequisites

- Node.js 18+

### Install

```bash
npm install
```

### Environment Variables

Create `.env` at the repo root:

```env
# Liquidation API
# NOTE: Set this to the API base your backend expects. In many setups this includes /api
VITE_API_BASE_URL="https://liquidation-api-1001101479084.asia-east1.run.app/api"

# Supabase (Prediction Accuracy page)
VITE_SUPABASE_PROJECT_URL="https://your-project.supabase.co"
VITE_SUPABASE_API_KEY="your-anon-key"
```

### Run Dev Server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### Build

```bash
npm run build
```

```bash
npm run preview
```

---

## How The Charts Work

### Cross Sectional

- **Input**: `raw_liquidations` (preferred), falls back if unavailable.
- **Rendering**: individual skinny bars at exact prices.
- **Signal**: intensity via opacity scaling.
- **UX**: purple dashed current-price marker + crosshair.

### Heatmap

- **Input**: `raw_liquidations` + CoinGecko OHLC.
- **Rendering**: a pixel-grid density field built from raw liquidation levels.
- **Consumption**: each liquidation contributes from `entry_time` until the first OHLC candle whose \([low, high]\) crosses that liquidation price.
- **UX**: crosshair is enabled; tooltip popup is intentionally disabled to keep the view clean.

---

## Prediction Accuracy (Supabase)

The `/accuracy` page:

- fetches the last predictions from `predictions`
- fetches summary stats from `prediction_stats`
- subscribes to realtime updates via `postgres_changes`

If you don’t configure Supabase env vars, the rest of the app works fine; Accuracy will just error or show empty state depending on setup.

---

## Customization

### Branding

Update `src/config/branding.ts` (app name, logo, tagline).

### Theme

Update CSS variables in `src/index.css` for your light/dark palettes and chart colors.

---

## Tech Stack

- React + TypeScript + Vite
- TailwindCSS
- ECharts (`custom` series for high-control rendering)
- React Router
- TanStack Query
- Zod
- Supabase client (Accuracy)

