# Sillage — Click-and-Hold Perfume Animation

## Overview
A cinematic, click-and-hold interactive animation website where JPEG frames of a perfume bottle spray advance while the user holds down a button. Releasing pauses the animation on the current frame. Similar to high-end Apple product page experiences.

## Architecture
- **Frontend**: React with Canvas API for frame rendering, click-and-hold interaction at 30fps
- **Backend**: Express server with automatic ZIP extraction and `/api/frames` endpoint
- **No database needed** — purely static frame-based experience

## Key Files
- `client/src/pages/home.tsx` — Main animation page with Canvas rendering, hold-to-play interaction, preloader, and headline
- `client/public/frames/` — 125 JPEG frames extracted from the source ZIP
- `server/routes.ts` — Auto-extracts frames from ZIP on startup, API endpoint listing available frames
- `client/index.html` — SEO tags, Pinyon Script + Cormorant fonts from Google Fonts

## How It Works
1. Server extracts frames from ZIP on startup if not already extracted
2. Frontend fetches frame list from `/api/frames`
3. All 125 frames preloaded with a loading progress bar
4. Canvas element fixed to viewport, frames render via click-and-hold at 30fps
5. "Sillage" headline (Pinyon Script font) fades in at ~60% frame progress
6. Hold button with pulse animation disappears when animation reaches the end

## Design
- Pure black (#000000) background
- Pinyon Script (elegant cursive) for "Sillage" headline
- Cormorant (serif) for UI text
- Pulsing circular hold button with "Hold" label
- No visible UI clutter — pure cinematic experience
- Mobile responsive with touch support
