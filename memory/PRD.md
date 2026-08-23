# Kivo — Product Requirements Document

## Current Product (after redesign)
**Kivo** is a **Minecraft-only marketplace** for a broad mix of blocky content: Skins, Characters, Builds, Worlds, Mods and collectible voxel assets. Visual identity: retro-modern "voxel product photography" — deep purple/lavender + coral palette, AI-rendered voxel figures on gradient tiles, sci-fi corner-bracket frames, parallax cubes, scroll fade-up reveals, pixel logo. All items are **Free** (paid drops "coming soon"). Strong creator tools + human-review moderation + role-based staff panel.

## Auth
- **Demo one-tap OAuth**: `/login` has Google, Discord, and a subtle "Staff panel (demo)" button → `POST /api/auth/demo` issues a JWT for a seeded account. (Stand-in until real Google/Discord client keys are added to `backend/.env`.) Email/password UI removed; backend login still exists for automated tests.
- JWT (localStorage `kivo_token`, Bearer). bcrypt. Brute-force lockout keyed on `email|client_ip` (X-Forwarded-For aware). Session revocation via token `iat` vs `session_revoked_at`.

## Architecture
- Frontend: React + Tailwind + shadcn/ui + recharts + sonner + lucide. Fonts: Sora (headings), Plus Jakarta Sans (body), Pixelify Sans (pixel accent), IBM Plex Mono.
- Backend: FastAPI (`/app/backend/server.py`), all routes `/api/*`. MongoDB (motor).
- Files: gzip-compressed local storage in `/app/backend/uploads/`, streamed on download (200MB cap).

## Data model (mods collection = "items")
`item_type` (Skin/Character/Build/World/Mod/Collectible), `rarity` (Common/Rare/Epic/Legendary, validated + defaulted), `pricing` (free), plus title/slug/summary/markdown description/tags/loaders/game_versions/license/icon(voxel render)/status/staff_pick/downloads/rating baseline.

## Personas
- Player (browse/grab/review/comment/report), Creator (wizard + version upload + analytics), Staff (super_admin / ts_moderator / content_reviewer / support_agent / auditor).

## Implemented
- **Public**: Landing (hero voxel + watermark + parallax + stats + category tiles + featured/trending + trust block), Browse (type/rarity chips + sort + search), Product detail (`/item/:slug`: hero render, sticky Free/Get panel, rarity/type badges, tabs for details/versions/reviews/comments, report, similar grid, real downloads).
- **Creator**: Studio dashboard (KPIs + 14-day chart + drops list), 4-step create wizard (type, rarity, free pricing / paid disabled), version upload modal (rounded, Esc-close).
- **Admin** (RBAC-gated nav + server enforcement): Overview, Review Queue (approve/reject/request-changes/quarantine + version diff modal), Reports & Abuse (SLA lanes), Users & Trust (tiers/roles/verify/ban/shadow/revoke-sessions), immutable Audit Log, Anomaly dashboard.
- **Security fixes verified**: brute-force lockout (email|IP), session revocation, unapproved-item privacy, quarantine-safe version approve, blank-comment rejection, rarity/type validation, preserved rating baselines, COPPA age flag on register.

## Test status
- iteration_2: backend 98% (105/107 pytest), frontend 100% of flows functional. 2 intentional red-flag tests documented. Fixes applied after: brute-force key, rarity default/validation, rarity badge legibility scrim, modal reskin + Esc, mobile nav testids.

## Backlog
- **P0**: Real Google/Discord OAuth wiring; automated malware/AV/CSAM pre-screening (currently human-only).
- **P1**: Modpacks/collections; public read API keys + rate limits; DMCA workflow; notifications/follows; pagination; more games.
- **P2**: Stripe for paid drops; split server.py into routers; migrate to lifespan handlers; httpOnly cookie auth.

## Credentials
See `/app/memory/test_credentials.md`. Quick: staff-login-btn → super_admin; Google demo → verified creator AuroraBlocks; Discord demo → BlockFan.
