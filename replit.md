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
- `client/src/pages/dashboard.tsx` — Main hub with Home/Vault/Discover/To-Try tabs
- `client/src/lib/auth.ts` — localStorage user management (get/store/clear)
- `shared/schema.ts` — Drizzle schema, quiz constants, archetype definitions
- `server/routes.ts` — All API routes + archetype computation + match scoring
- `server/storage.ts` — DatabaseStorage class with CRUD operations
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

## Archetypes (6)
velvet-dusk, green-wanderer, clean-canvas, citrus-architect, baroque-collector, solar-nomad

## Access Codes
BRANDSTORM, SILLAGE_DEMO, SILLAGE_LAYLA, VAULT_BYRD, SCENT_MAYA

## Design
- Pure black (#000000) background throughout
- Pinyon Script (cursive) for headlines/logo
- Cormorant (serif) for all UI text
- White text with rgba opacity hierarchy
- Minimal borders, glass-morphic cards
- No emoji in production UI (icons only)
