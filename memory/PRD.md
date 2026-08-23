# Kivo — Product Requirements Document

## Original Problem Statement
Build **Kivo**, a production-grade, game-agnostic multi-game mod hosting & distribution platform (Modrinth/CurseForge-like). Trustworthy, well-moderated home for mods with strong creator tools and strict content/security review. Includes public discovery, creator tooling, and a role-based staff moderation panel. (Full spec covers automated malware pipelines, abuse mitigations, VPS/Docker self-hosting, OAuth-only auth.)

## User Choices (this build)
- Scope: **balanced end-to-end slice** (public + creator + admin).
- Auth: JWT email/password now; **OAuth Google/Discord left as credential placeholders** in `backend/.env`.
- Security scanning pipeline (ClamAV/VirusTotal/PhotoDNA/static analysis): **SKIPPED** per user — moderation is **human-only** via the review queue.
- File storage: **local compressed (gzip) storage** on disk.
- Games seeded: **Minecraft** only.
- Look: retro-industrial "Signal & Slate" dark theme, pushed hard.

## Architecture
- **Frontend**: React (CRA+craco), Tailwind, shadcn/ui, recharts, sonner, lucide-react. Fonts: Chivo / IBM Plex Sans / IBM Plex Mono.
- **Backend**: FastAPI (`/app/backend/server.py`), all routes under `/api`.
- **DB**: MongoDB (motor). Collections: users, games, mods, versions, reviews, comments, reports, audit_logs, download_events, login_attempts.
- **Auth**: JWT (7-day, iat-stamped) in localStorage `kivo_token` → Bearer header. bcrypt hashing. Brute-force lockout (5 fails/15min). Session revocation via `session_revoked_at` vs token `iat`.
- **File storage**: gzip-compressed under `/app/backend/uploads/`, streamed on download.

## User Personas
- **Player**: browses/searches mods, downloads, reviews, comments, reports abuse.
- **Creator**: creates mod projects, uploads versions, tracks analytics. Trust tier gates auto-publish.
- **Staff** (super_admin / ts_moderator / content_reviewer / support_agent / auditor): moderates queue, handles reports, manages trust/bans, audits actions, watches anomalies.

## Implemented (2026-06)
- Public: Home landing (hero, game hubs, trending, staff picks), Minecraft Game Hub with category filter, Browse (search + category/loader/version/sort filters), Mod Detail (markdown description, versions, reviews, threaded comments, stats sidebar, download, report).
- Creator: Dashboard (KPIs + 14-day downloads chart + project list), 4-step New Mod wizard, multipart version upload modal (200MB cap, gzip storage). Verified creators auto-publish; others → review queue.
- Admin panel (role-gated nav + server-side RBAC): Overview, Review Queue (approve/reject/request-changes/quarantine + templated reason modal + terminal-style version diff), Reports & Abuse (SLA timers, priority lanes, resolve/dismiss/filters), Users & Trust (tier/role selects, verify/shadow-ban/ban/revoke-sessions), immutable Audit Log, Anomaly dashboard (download spikes, vote manipulation, mass-signup clusters).
- Content/Trust Policy page. Auth: register with age-gate (COPPA), login, profile edit + 2FA toggle.
- Security fixes verified: brute-force lockout, session revocation enforcement, unapproved-mod privacy (404), version-approve doesn't resurrect quarantined mods, empty-comment rejection, rating baseline preserved.

## Backlog / Not Yet Built
- **P0**: Real OAuth (Google/Discord) wiring; real automated pre-screening (AV/static/CSAM hashing) — currently human-only.
- **P1**: Modpacks/collections with license checks; public read API keys + rate limits; DMCA intake/counter-notice workflow; notifications & follows; more games/hubs; Meilisearch full-text.
- **P2**: Payments (Stripe) for donations; pagination on list endpoints; mobile hamburger nav; per-role inline permission-denied panels; split server.py into routers; migrate to lifespan handlers.

## Test Credentials
See `/app/memory/test_credentials.md`. Admin: admin@kivo.dev / KivoAdmin!2026.
