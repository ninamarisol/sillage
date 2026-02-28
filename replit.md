# Presence — Scroll-Driven Perfume Animation

## Overview
A cinematic, scroll-based animation website where JPEG frames of a perfume bottle spray are tied to the user's scroll position. As the user scrolls, frames play forward creating a slow-motion perfume spray effect similar to Apple product page animations.

## Architecture
- **Frontend**: React with Canvas API for frame rendering, vanilla scroll-driven animation
- **Backend**: Express server serving frame images and a `/api/frames` endpoint
- **No database needed** — purely static frame-based experience

## Key Files
- `client/src/pages/home.tsx` — Main scroll animation page with Canvas rendering, preloader, and headline
- `client/public/frames/` — 125 JPEG frames extracted from the source ZIP
- `server/routes.ts` — API endpoint listing available frames
- `client/index.html` — SEO tags, Playfair Display font

## How It Works
1. On load, all 125 frames are preloaded with a loading progress bar
2. Canvas element is fixed to viewport, frames render based on scroll position
3. Scroll progress (0-100%) maps to frame index with cubic-bezier easing
4. Smooth interpolation between frames using requestAnimationFrame
5. "Presence." headline fades in at ~60% scroll depth
6. Scroll hint at bottom fades out once scrolling begins

## Design
- Pure black (#000000) background
- Playfair Display serif font for headlines
- No visible UI clutter — pure cinematic experience
- Mobile responsive with cover-fit frame rendering
- Hidden scrollbar for immersive feel
