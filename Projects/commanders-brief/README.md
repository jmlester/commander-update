# CNAFR Commander's Update — Placemat Dashboard

A local, browser-based briefing placemat for CNAFR operational readiness updates.

## Quick Start

No build step, no server, no dependencies. Just open in a browser:

```
open index.html        # Admin/Editor page
open display.html      # Display/Briefing page
```

Or use any local HTTP server if you prefer (for clean URL routing):

```
npx serve .
# or
python3 -m http.server 8000
```

## Pages

- **index.html** — Admin/Editor: edit overview, missions, personnel, map locations, calibration
- **display.html** — Display: polished briefing placemat with map, KPIs, and tables

## Data Flow

1. Edit data in the admin page
2. Click **Save to Browser** (stores in localStorage)
3. Open display page — it reads from localStorage automatically
4. Use **Export JSON** / **Import JSON** for file-based backup and sharing

## Map System

- SVG-based with viewBox pan/zoom (scroll to zoom, drag to pan)
- Upload a basemap image and adjust the calibration rectangle to align geographic content
- ICAO codes auto-resolve to lat/lon from a built-in database
- Current missions shown as solid blue rings; planned missions as dashed gold rings

## Project Structure

```
index.html          Admin/editor page
display.html        Display/briefing page
css/
  theme.css         Shared palette and components
  admin.css         Admin page layout
  display.css       Display page layout
js/
  icao.js           ICAO airfield coordinate database
  data.js           Data model, storage, import/export
  map-engine.js     SVG map engine
  admin.js          Admin page controller
  display.js        Display page controller
```
