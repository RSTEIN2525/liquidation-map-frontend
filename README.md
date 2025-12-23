# Liquidation Map Frontend

A modern, professional React application for visualizing cryptocurrency liquidation data with two interactive chart modes: Cross Sectional and Heatmap.

## Features

- **Two Visualization Modes**
  - **Cross Sectional**: Histogram-style view showing liquidation clusters above and below current price
  - **Heatmap**: Time-series intensity visualization of liquidation levels
  
- **Modern UI/UX**
  - Clean, professional interface inspired by CoinAnk and CoinGlass
  - Light and dark theme support with persistent user preference
  - Responsive design that works on all screen sizes
  - Real-time status indicator (Initializing/Ready/Error/Stale)

- **Technical Stack**
  - React 19 with TypeScript
  - Vite for fast development and building
  - TailwindCSS for styling
  - ECharts for high-performance charts
  - React Query for data fetching and caching
  - React Router for navigation
  - Zod for runtime type validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API endpoint:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `VITE_API_BASE_URL` to your liquidation API endpoint.

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── charts/          # Chart components (CrossSectional, Heatmap)
│   ├── AppShell.tsx     # Main layout with navbar
│   ├── ModeTabs.tsx     # Chart mode switcher
│   ├── StatusPill.tsx   # API status indicator
│   └── ThemeToggle.tsx  # Light/dark theme toggle
├── pages/               # Route pages
│   ├── CrossSectionalPage.tsx
│   └── HeatmapPage.tsx
├── lib/                 # Core utilities
│   ├── api.ts           # API client
│   ├── queries.ts       # React Query hooks
│   ├── schemas.ts       # Zod schemas and type definitions
│   ├── theme.ts         # Theme management
│   └── utils.ts         # Utility functions
├── config/              # Configuration
│   └── branding.ts      # App branding (name, logo, tagline)
├── App.tsx              # Root component with routing
├── main.tsx             # Entry point
└── index.css            # Global styles and theme variables
```

## Customization

### Branding

Edit `src/config/branding.ts` to customize:
- App name
- Logo URL
- Tagline

```typescript
export const BRANDING = {
  APP_NAME: 'Your App Name',
  LOGO_URL: '/path/to/logo.png',
  TAGLINE: 'Your tagline',
} as const;
```

### Theme Colors

Customize colors in `src/index.css` by modifying CSS custom properties:
- Light theme: `:root` selector
- Dark theme: `.dark` selector

## API Integration

The app expects a liquidation map API endpoint that returns:

```json
{
  "summary": {
    "price": 88834,
    "open_interest": 12345,
    "funding_rate": 0.01
  },
  "direction": {
    "bias": "UP",
    "upward_mag": 0.75,
    "downward_mag": 0.25
  },
  "bins": [
    {
      "mid_price": 85000,
      "intensity": 75.5,
      "usd": 150.25,
      "status": "ACTIVE"
    }
  ],
  "timestamp": 1703260800
}
```

## Features in Detail

### Cross Sectional Chart
- Displays liquidation clusters as vertical bars
- Green bars: Short liquidations (above current price)
- Red bars: Long liquidations (below current price)
- Opacity represents intensity
- Dimmed bars for cleared liquidations
- Current price marker line

### Heatmap Chart
- Vertical price ladder with intensity coloring
- Color gradient from low (blue) to high (orange) intensity
- Current price indicator with label
- Interactive tooltips with detailed information

### Status Indicator
- **Initializing**: Data is being fetched
- **Ready**: Data is current and up-to-date
- **Stale**: Cached data may be outdated (>50 minutes old)
- **Error**: Failed to fetch data

## License

MIT
