# Sillage — Luxury Fragrance Platform

## Overview
A luxury fragrance discovery platform with a cinematic click-and-hold perfume spray animation as the entry experience, followed by a creator access code gate, multi-step onboarding quiz, scent archetype reveal, and a full dashboard with Vault, Discover, and To-Try features.

## Architecture
- **Frontend**: React + wouter routing, TanStack Query, Canvas API for splash animation
- **Backend**: Express server with PostgreSQL via Drizzle ORM (node-postgres)
- **Auth**: localStorage-based (no sessions), user object stored client-side
- **Database**: PostgreSQL with users, access_codes, fragrances, vault_items, to_try_items tables

## Key Files
- `client/src/App.tsx` — Router with routes: `/`, `/access`, `/register`, `/quiz`, `/dashboard`
- `client/src/pages/home.tsx` — Splash/entry page with click-and-hold spray animation + "Enter Sillage" CTA
- `client/src/pages/access-code.tsx` — Creator access code gate
- `client/src/pages/register.tsx` — Account creation / login (toggle)
- `client/src/pages/quiz.tsx` — 5-step onboarding quiz with archetype reveal
- `client/src/pages/dashboard.tsx` — Main hub with Home/Vault/Discover/To-Try tabs, fragrance detail panel, vault edit panel
- `client/src/lib/auth.ts` — localStorage user management (get/store/clear)
- `shared/schema.ts` — Drizzle schema, quiz constants, archetype definitions
- `server/routes.ts` — All API routes + archetype computation + match scoring
- `server/storage.ts` — DatabaseStorage class with CRUD operations (including updateToTryItem)
- `server/seed.ts` — Seeds 5 access codes and 15 fragrances
- `client/index.html` — Pinyon Script + Cormorant fonts from Google Fonts

## User Flow
1. Splash page: Hold button to play perfume spray animation (125 frames, 30fps)
2. After animation completes, "Enter Sillage" button appears
3. Access code page: Enter a creator code (e.g., BRANDSTORM, SILLAGE_DEMO)
4. Register/Login page: Create account or sign in
5. Quiz: 5 steps — Season, Settings, Scent Vibes, Note Families, Identity Vibes
6. Archetype reveal: Animated reveal of computed scent archetype
7. Dashboard: Home (archetype + recommendations), Vault (collection), Discover (search), To-Try (wishlist)

## Dashboard Features
- **Fragrance Detail Panel**: Click any fragrance card to see full details including note pyramid (top/heart/base), description, match score, family tag, and add-to-vault/try buttons
- **Vault Edit Panel**: Click vault items to rate (5-star), add personal notes, set bottle size, fill level, and wear frequency
- **To-Try Priority**: Change priority on to-try items (Must Try / Curious / Someday)
- **Search**: Multi-field search across name, house, and family
- **Note Pyramid**: Visual display of top/heart/base notes for each fragrance

## API Endpoints
- POST /api/access-code/validate — Validate access code
- POST /api/auth/register — Register (requires valid access code server-side)
- POST /api/auth/login — Login
- POST /api/users/:id/complete-quiz — Submit quiz, compute archetype
- GET /api/users/:userId/recommendations — Scored recommendations
- GET/POST /api/users/:userId/vault — Vault CRUD
- PATCH /api/vault/:id — Update vault item
- DELETE /api/vault/:id — Remove from vault
- GET/POST /api/users/:userId/to-try — To-try CRUD
- PATCH /api/to-try/:id — Update to-try item (priority)
- DELETE /api/to-try/:id — Remove from to-try
- GET /api/fragrances?search= — Search fragrances

## Archetypes (6)
velvet-dusk, green-wanderer, clean-canvas, citrus-architect, baroque-collector, solar-nomad

## Access Codes
BRANDSTORM, SILLAGE_DEMO, SILLAGE_LAYLA, VAULT_BYRD, SCENT_MAYA

## Design
- Pure black (#000000) background throughout
- Pinyon Script (cursive) for headlines/logo
- Cormorant (serif) for all UI text at readable sizes (14-18px body, 24-48px headings)
- White text with rgba opacity hierarchy
- Minimal borders, glass-morphic cards with 8px border radius
- Slide-up animations for modals and panels
