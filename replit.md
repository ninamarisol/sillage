# Sillage — Luxury Fragrance Platform

## Overview
A luxury fragrance discovery platform with a cinematic click-and-hold perfume spray animation entry, elegant two-flow login (new user with creator code / returning user), multi-step onboarding quiz, scent archetype reveal, and a full single-page app with bottom tab navigation between Home (My Vault / Scent Log / To Try), Explore (Feed / Exchange), and Profile tabs. Full light/dark theming throughout.

## Architecture
- **Frontend**: React + wouter routing, TanStack Query, Canvas API for splash animation
- **Backend**: Express server with PostgreSQL via Drizzle ORM (node-postgres)
- **Auth**: localStorage-based (no sessions), user object stored client-side (`sillage_user` key)
- **Theme**: ThemeProvider context, stored in `sillage_theme` localStorage key, toggles `.dark` class on documentElement
- **Database**: PostgreSQL with users, access_codes, fragrances, vault_items, to_try_items, wear_logs, feed_posts, post_likes tables

## Key Files
- `client/src/App.tsx` — Router with routes: `/`, `/access`, `/quiz`, `/dashboard`
- `client/src/pages/home.tsx` — Splash/entry page with click-and-hold spray animation + "Enter Sillage" CTA
- `client/src/pages/access-code.tsx` — Two-flow login: "I'm new — I have a code" + "Welcome back" (always dark)
- `client/src/pages/quiz.tsx` — 6-step onboarding quiz (step 0: theme choice, steps 1-5: preferences) with archetype reveal; supports `?retake=true` (5 steps, skips theme)
- `client/src/pages/dashboard.tsx` — Single-page app with bottom nav bar (Home/Explore/Profile), sub-tabs, glass shelf vault, scent log timeline, to-try wishlist, social feed, exchange marketplace, profile with Scent DNA + stats
- `client/src/lib/auth.ts` — localStorage user management (get/store/clear)
- `client/src/lib/theme.tsx` — ThemeProvider + useTheme hook
- `shared/schema.ts` — Drizzle schema, quiz constants, archetype definitions, FAMILY_COLORS, WEAR_OCCASIONS
- `server/routes.ts` — All API routes + archetype computation + match scoring
- `server/storage.ts` — DatabaseStorage class with CRUD operations
- `server/seed.ts` — Seeds 5 access codes, 33 fragrances, 8 social users, 8 vault items, 10 wear logs, 8 to-try items, 8 feed posts

## User Flow
1. Splash page: Hold large centered spray button (clamp 120-180px) to play perfume spray animation (125 frames, 30fps)
2. After animation, "Enter Sillage" button appears → redirects to `/access`
3. Login screen: Choose "I'm new — I have a code" (any non-empty code → quiz) or "Welcome back" (email + password → dashboard)
4. Quiz: 6 steps — Theme Choice, Season, Settings, Scent Vibes, Note Families, Identity Vibes
5. Archetype reveal → Dashboard
6. Dashboard: Single-page app with bottom nav bar

## Dashboard Structure
### Bottom Navigation: Home | Explore | Profile

### Home Tab — Sub-tabs:
- **My Vault**: Glass shelf vault with 5 SVG bottle shapes (Art Deco, Round Flacon, Geometric, Wide Oval, Flat Square), colored liquid fill by family, beige caps, shine streaks, bokeh particles, hover cards with Log Wear/Details/Remove
- **Scent Log**: Chronological wear timeline with mood tags and notes, "Log today's scent" quick-action with miniature vault grid
- **To Try**: AI recommendations section + user's saved items with circular match score indicators, priority badges (High Priority/Curious/Someday)

### Explore Tab — Sub-tabs:
- **Feed**: Social posts with avatar (CSS gradient), username, archetype name + color dot, creator badge, star ratings, fragrance cards, like/delete, "In your To-Try" badge, create post modal
- **Exchange**: Subscription-gated marketplace with frosted glass overlay for non-subscribers, L'Oreal Drops carousel (discontinued drops with countdown), peer-to-peer listings grid with Sillage Certified badge + match scores, filter pills

### Profile Tab:
- Identity header: gradient avatar with warm beige outline, @username, archetype pill badge + description
- Stats row: Collection, Wears, Posts, Following, Followers
- Scent DNA: horizontal bar chart (Amber 78%, Woody 64%, Floral 51%, Musk 43%, Citrus 31%)
- Personal Stats: 8 fun stat cards in 2-column grid
- Theme toggle, Retake Quiz, Recent Posts, Logout

## Color Palette (Warm Neutrals Only)
- **Black**: `#000000`
- **Warm cream** (light mode bg): `#eddfd9`
- **Rose beige** (primary accent): `#d4b8a0` — replaces old gold
- **Soft beige**: `#c9b8a8` — replaces old violet
- **Warm taupe**: `#a89585` — mid-tone accent
- **Muted blush**: `#dcc5b5` — gentle highlight
- **Dark taupe**: `#8a7a6a` — darkest warm neutral
- **No gold, violet/purple, or teal anywhere** — entire app uses only black, cream, and beige tones

## Demo User
- Username: `velvet.nina`, Password: `sillage2025`, Archetype: The Velvet Dusk
- 8 vault bottles: YSL Libre, La Vie Est Belle, Jazz Club, Chance Eau Tendre, Black Orchid, Sauvage, Aventus, Peony & Blush Suede
- 10 wear log entries, 8 to-try items, 8 feed posts from varied users

## Theme System
- **Light mode**: bg `#eddfd9`, text `#1a1a1a`
- **Dark mode**: bg `#000`, text `#fff`
- ThemeProvider wraps entire app, stored in localStorage
- Access/login page always dark

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
- All archetype colors are warm neutrals (beige/taupe/cream family)

## Access Codes
BRANDSTORM, SILLAGE_DEMO, SILLAGE_LAYLA, VAULT_BYRD, SCENT_MAYA

## Design
- Pinyon Script (cursive) for headlines/logo
- Cormorant Garamond (serif) for all UI text — loaded via Google Fonts
- Primary accent: `rgba(212,184,160,0.9)` (rose beige) — used for active states, stars, highlights
- Secondary accent: `rgba(201,184,168,1)` (soft beige) — used for subtle accents
- Glass shelf with SVG bottles, bokeh particles, warm glow
- Bottom tab nav with unicode icons, warm beige active state + active indicator bar
- Minimal borders, glass-morphic cards, slide-up animations
- Returning user login: no auto-registration, shows error on bad credentials
- Splash page: large centered spray button (clamp 120-180px) with "Spray to Start your Sillage" label
