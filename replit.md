# Sillage — Luxury Fragrance Platform

## Overview
A luxury fragrance discovery platform with a cinematic click-and-hold perfume spray animation as the entry experience, followed by a creator access code gate, multi-step onboarding quiz (with theme selection), scent archetype reveal, and a full dashboard with Vault (glass shelf display), Discover, To-Try, Feed, and Profile features. Light/dark theming throughout.

## Architecture
- **Frontend**: React + wouter routing, TanStack Query, Canvas API for splash animation
- **Backend**: Express server with PostgreSQL via Drizzle ORM (node-postgres)
- **Auth**: localStorage-based (no sessions), user object stored client-side (`sillage_user` key)
- **Theme**: ThemeProvider context, stored in `sillage_theme` localStorage key, toggles `.dark` class on documentElement
- **Database**: PostgreSQL with users, access_codes, fragrances, vault_items, to_try_items, wear_logs, feed_posts, post_likes tables

## Key Files
- `client/src/App.tsx` — Router with routes: `/`, `/access`, `/register`, `/quiz`, `/dashboard`, `/profile`, `/feed`
- `client/src/pages/home.tsx` — Splash/entry page with click-and-hold spray animation + "Enter Sillage" CTA
- `client/src/pages/access-code.tsx` — Creator access code gate (always dark)
- `client/src/pages/register.tsx` — Account creation / login toggle (always dark)
- `client/src/pages/quiz.tsx` — 6-step onboarding quiz (step 0: theme choice, steps 1-5: preferences) with archetype reveal; supports `?retake=true` (5 steps, skips theme)
- `client/src/pages/dashboard.tsx` — Main hub with Home/Vault/Discover/To-Try tabs, glass shelf vault, fragrance detail panel, vault edit panel, wear log modal, nav links to Feed/Profile
- `client/src/pages/profile.tsx` — User profile with archetype badge, theme toggle, retake quiz, calendar heatmap, wear stats, logout
- `client/src/pages/feed.tsx` — Social feed with posts, likes, create post modal, delete own posts
- `client/src/lib/auth.ts` — localStorage user management (get/store/clear)
- `client/src/lib/theme.tsx` — ThemeProvider + useTheme hook
- `shared/schema.ts` — Drizzle schema, quiz constants, archetype definitions, FAMILY_COLORS, WEAR_OCCASIONS
- `server/routes.ts` — All API routes + archetype computation + match scoring
- `server/storage.ts` — DatabaseStorage class with CRUD operations
- `server/seed.ts` — Seeds 5 access codes and 15 fragrances

## User Flow
1. Splash page: Hold button to play perfume spray animation (125 frames, 30fps)
2. After animation completes, "Enter Sillage" button appears
3. Access code page: Enter a creator code (e.g., BRANDSTORM, SILLAGE_DEMO)
4. Register/Login page: Create account or sign in
5. Quiz: 6 steps — Theme Choice (light/dark), Season, Settings, Scent Vibes, Note Families, Identity Vibes
6. Archetype reveal: Animated reveal of computed scent archetype
7. Dashboard: Home (archetype + recommendations), Vault (glass shelf bottles), Discover (search), To-Try (wishlist)
8. Feed: Social posts, wear logs, reviews, likes
9. Profile: Stats, theme toggle, retake quiz, wear calendar heatmap

## Dashboard Features
- **Glass Shelf Vault**: SVG perfume bottle silhouettes (5 shapes) colored by fragrance family, fill level visible, hover for info card + "Log Wear" / "Details" buttons, glass shelf glow effect
- **Wear Log Modal**: Select occasion, add notes, logs wear and auto-posts to feed
- **Fragrance Detail Panel**: Full details with note pyramid, match score, add-to-vault/try buttons, log wear for vault items
- **Vault Edit Panel**: Rate, notes, bottle size, fill level, wear frequency
- **To-Try Priority**: Must Try / Curious / Someday
- **Search**: Multi-field search across name, house, and family
- **Nav links**: Feed and Profile accessible from dashboard header

## Theme System
- **Light mode**: bg `#FFF8F5` (warm pinkish cream), text `#1a1a1a`
- **Dark mode**: bg `#000` (pure black), text `#fff` (100% opacity)
- Theme choice in quiz step 0 (new users only); retake skips theme step
- ThemeProvider wraps entire app, stored in localStorage
- Dashboard, Profile, Feed pages use `useColors()` / `useTheme()` for adaptive styling
- Access code, register, home pages always dark (entry experience)

## API Endpoints
- POST /api/access-code/validate — Validate access code
- POST /api/auth/register — Register
- POST /api/auth/login — Login
- POST /api/users/:id/complete-quiz — Submit quiz, compute archetype
- GET /api/users/:userId/recommendations — Scored recommendations
- GET/POST /api/users/:userId/vault — Vault CRUD
- PATCH/DELETE /api/vault/:id — Update/remove vault item
- GET/POST /api/users/:userId/to-try — To-try CRUD
- PATCH/DELETE /api/to-try/:id — Update/remove to-try item
- GET/POST /api/users/:userId/wear-logs — Wear log CRUD
- GET /api/feed?userId= — Feed with like status
- POST /api/feed — Create feed post
- POST /api/feed/:id/like — Toggle like
- DELETE /api/feed/:id — Delete own post
- PATCH /api/users/:id/theme — Update theme preference
- GET /api/fragrances?search= — Search fragrances

## Archetypes (6)
velvet-dusk, green-wanderer, clean-canvas, citrus-architect, baroque-collector, solar-nomad

## Access Codes
BRANDSTORM, SILLAGE_DEMO, SILLAGE_LAYLA, VAULT_BYRD, SCENT_MAYA

## Design
- Light mode: warm pinkish cream (#FFF8F5) background, dark text with opacity hierarchy
- Dark mode: pure black (#000000) background, white text with opacity hierarchy
- Pinyon Script (cursive) for headlines/logo
- Cormorant (serif) for all UI text at readable sizes
- Glass shelf vault with SVG bottle silhouettes colored by fragrance family
- Minimal borders, glass-morphic cards with 8px border radius
- Slide-up animations for modals and panels
- No emoji in UI — text symbols and labels only
