# AGENTS.md — Castant

## Stack

- TypeScript 6.0 (`strict: true`, ES2020)
- Backend: ESM (`"type": "module"`), `tsx` runtime, `moduleResolution: node16`
- Frontend: Vite + React, `moduleResolution: bundler`
- Express 5 + cors + dotenv (no helmet, no rate-limit, CORS allows all origins)
- Prisma 7 with SQLite (`@prisma/adapter-libsql`, `@libsql/client`)
- Logging: pino + pino-pretty + pino-http + nanoid
- Auth: JWT (`jsonwebtoken`) — `JWT_SECRET` in `.env` is mandatory (app throws if missing)
- Password hashing: `bcrypt` via `HashService` (`infrastructure/security/HashService.ts`)
- Testing: Vitest 4 (backend root), Vitest + React Testing Library (frontend), Playwright (E2E)
- DB: SQLite `backend/prisma/dev.db` (dev), `backend/test.db` (tests)

## Rules (Always Apply)

1. **Never modify imports** — no `.js` extensions on import paths.
2. **Backup AGENTS.md** before editing → `docu/saves-agents/AGENTS_<YYYYMMDD_HHMMSS>.md`.
3. **IDs are flat strings** with prefixes (e.g. `user-...`). No `TypedId`.
4. **Director is a `Participant`** with `role: 'director'`.

## Commands

```bash
# Typecheck backend (no output = ok)
cd backend && npx tsc --noEmit

# Backend tests (from root)
npm test

# Integration tests (endpoints)
npm run test:integration

# Frontend tests (from root)
npm run test:front

# All tests (backend + frontend)
npm run test:all

# Coverage (backend only)
npm run test:coverage

# Dev server
cd backend && npm run dev

# Regenerate Prisma client after schema changes
cd backend && npx prisma generate

# Sync DB with schema (no data loss)
cd backend && npm run db:push

# Backup dev DB
cd backend && npm run db:backup

# Backup + reset DB (RECOMMENDED over prisma db push --force-reset)
cd backend && npm run db:reset

# Restore latest backup + seed
cd backend && npm run db:restore

# Seed demo data (runs automatically via db:restore)
cd backend && npx tsx prisma/seed.ts

# Force reset WITHOUT backup (NOT recommended)
cd backend && npx prisma db push --force-reset

# Frontend unit tests
cd frontend && npm test

# Frontend E2E tests (auto-starts dev server)
cd frontend && npx playwright test

# Install Playwright browsers (first time only)
cd frontend && npx playwright install chromium
```

**Order:** `typecheck → test`

## DB Backups

- Backups stored in `backend/prisma/backups/`
- `db:reset` always backs up before resetting
- Schema change flow: `db:push` if compatible, `db:reset` if requires column drops

## Seed Data

- Script: `backend/prisma/seed.ts` (configured as Prisma seed hook)
- Users: `director@demo.com`, `actor1@demo.com`, `actor2@demo.com`, `preselector@demo.com` (password: `changeme`)
- Demo casting with 2 rounds, participants, 2 submissions
- Uses `upsert` to avoid duplicates

## Gotchas

**Prisma 7 — datasource URL:**
`DATABASE_URL` goes in `prisma.config.ts` and `.env`, NOT in `schema.prisma`.

**Prisma client import:**
`import { PrismaClient } from '../../generated/prisma/client'`

**Tests — DATABASE_URL:**
Tests use `backend/test.db`. Configured in `vitest.config.ts` (sets `process.env.DATABASE_URL` and `process.env.JWT_SECRET`). `globalSetup.ts` runs `prisma db push --force-reset` before each suite. `fileParallelism: false` required (SQLite single-writer).

**Security:**
- `auth.ts` throws if `JWT_SECRET` is missing (no fallback)
- `console.log(authHeader)` removed — never log tokens
- `.env`, `.env.local`, `.env.*.local` are in `.gitignore`

**Video upload:**
- Multer config: `infrastructure/storage/videoUpload.ts`
- Stored in `backend/uploads/videos/` with names `{timestamp}-{random}.{ext}`
- Static middleware in `index.ts` serves `/uploads`
- MIME types: MP4, WebM, OGG, MOV, AVI, MKV; max 100MB

## Code Patterns

**Value Objects:** Private constructor + `static create()` factory + `static isValid()` (no throw). `getValue()`. Immutable.

**Entities:** Private constructor + `static create()` factory. Auto-generates ID via `genUUID('prefix')`. Getters with `get`. IDs: `<prefix>-<uuid>`. Receive Value Objects pre-built.

**genUUID:** `domain/utils/genUUID.ts` — `genUUID(prefix)` → `'<prefix>-<crypto.randomUUID()>'`

**User password:** `User.create(name, email, hash, id?)`. Hash NEVER plaintext. `CreateUserUseCase` hashes. `LoginUseCase` compares via `HashService.compare()`.

**LoginUseCase:** Supports demo via optional `xUserId` in `LoginInput`. Validates `DEMO_MODE=true`. Uses `DEMO_USERS` map: `{ director: 'director@demo.com', actor: 'actor1@demo.com', preselector: 'preselector@demo.com' }`.

**Casting participants:** `CastingParticipantEntry` = `{ userId, role: 'director' | 'reviewer' }`. Casting-level participants have `castingId` set, `roundId` null.

**Round participants:** `RoundParticipantEntry` = `{ id, role: 'actor' | 'preselector' }`. Round-level participants have `roundId` set, `castingId` null.

**CreateCastingUseCase:** Auto-creates Round 1 with empty participants.

**ManageRoundParticipantsUseCase:** `actors` and `preselectors` as separate lists. `createNewRound=true` marks submissions `selected`/`rejected` and creates new round.

**ReviewSubmissionUseCase:** Allows re-evaluation (`pending→reviewed`, `reviewed→reviewed`). Blocks `selected`/`rejected`. Empty feedback → `Feedback.none()`.

**Repositories:** Prisma-based. `upsert` in `save()`. Private `toDomain()`. Params are plain strings.

**Logging:** Use cases import from `requestContext` (not `logger`). Routes import `requestLogger` from `requestContext`.

**Bitácora:** `BitacoraService` wraps errors silently (never blocks). Use cases call `log()` after operations. Actions: `create_user`, `create_casting`, `submit_video`, `review_submission`, `add_participants`, `create_round`.

**Conventions:** 2 spaces, semicolons, single quotes, max 100 chars. `export default` for classes. JSDoc headers (`@file`, `@module`) on every file.

## Testing

- Backend tests: `tests/unit/domain/value-objects/`, `tests/unit/domain/entities/`, `tests/unit/application/use-cases/`
- Use cases in subdirs: `tests/unit/application/use-cases/rounds/`
- Frontend tests: `frontend/src/**/*.test.tsx` (co-located)
- E2E tests: `frontend/tests/e2e/*.spec.ts`
- Mocking: `import { vi } from 'vitest'`
- Backend test imports: `import X from '../../../../backend/src/domain/value-objects/X'`
- Pattern: `.opencode/skills/testing-pattern/SKILL.md`

**VO tests:** `create()` happy + error cases, `equals()`, business methods.
**Use case tests:** Happy path + mocks, error cases (validation, not found).

**E2E gotchas:**
- `loginAs(page, role)` uses demo mode toggle (sidebar)
- Tests share dev DB — create own resources for mutation tests
- Re-seed: `cd backend && npm run db:reset && npm run db:seed`

## API Routes

**Public:** Only `POST /api/v1/auth/login`
**Protected:** All other routes (JWT required via `Authorization: Bearer <token>`)

Auth middleware applied inside `routes.ts` via `router.use(authMiddleware)` — public routes defined before it, protected after.

- `GET /health` → `{ status: 'ok' }` (outside versioned router)
- `POST /api/v1/auth/login` → `{ email, password, xUserId? }` → `{ token, userId }`
- `GET /api/v1/users` → list all users
- `GET /api/v1/users/me/participations` → authenticated user's participations
- `GET /api/v1/users/:id` → user or 404
- `POST /api/v1/users` → create user `{ id?, name, email, password }`
- `DELETE /api/v1/users/:id` → delete user or 404
- `GET /api/v1/castings` → list castings with participants
- `GET /api/v1/castings/:id` → casting with participants and rounds
- `POST /api/v1/castings` → create casting `{ title, description, directorEmail, directorName }`
- `PUT /api/v1/castings/:id` → update `{ title?, description? }`
- `DELETE /api/v1/castings/:id` → delete with cascade
- `GET /api/v1/rounds/:id` → round with participants and submissions
- `GET /api/v1/rounds/:id/submissions` → list submissions
- `PATCH /api/v1/rounds/:id` → update `{ number }`
- `DELETE /api/v1/rounds/:id` → delete with cascade
- `DELETE /api/v1/rounds/:roundId/participants/:userId` → remove participant (director only, returns `{ success, hadSubmissions }`)
- `POST /api/v1/rounds/participants` → manage participants or create new round `{ roundId, actors, preselectors, createNewRound? }`
- `POST /api/v1/submissions` → submit video (JSON `{ roundId, videoUrl }` or multipart with `video` field) — `actorId` from `req.user.id`
- `GET /api/v1/submissions/:id` → submission by ID
- `DELETE /api/v1/submissions/:id` → delete submission
- `PATCH /api/v1/submissions/:id/review` → review `{ score, feedback }` — `directorId` from `req.user.id`
- `PATCH /api/v1/submissions/:id/metadata` → update metadata `{ duration }` — used by VideoPlayerModal

## API Versioning

Routes versioned by URL prefix (`/api/v1`, `/api/v2`). Each version independent.
- `infrastructure/api/v1/routes.ts` — version 1
- `infrastructure/api/v2/routes.ts` — version 2 (placeholder)
- `/health` outside versioning (system endpoint)
- Each route file creates its own repository/use-case instances

## Frontend

### Theme System

6 themes: `light`, `dark`, `ocean`, `forest`, `sunset`, `night`.
- CSS custom properties in `index.css` (`:root` for light, `.dark` for dark, `.theme-*` for others)
- `tailwind.config.js` references `var(--color-*)` (no hardcoded colors)
- `ThemeContext` (`src/context/ThemeContext.tsx`): `ThemeProvider` + `useTheme()` hook
  - Returns: `{ theme, setTheme, toggleTheme, themes, getThemeLabel, getThemeClass }`
  - `themes` is the array of `{ id, label, cssClass }` objects (not `allThemes`/`themeLabels`)
  - Persisted in `localStorage('theme')`, detects system preference via `matchMedia`

### Layout

- Collapsible sidebar (280px open / 64px closed), persisted in `localStorage('sidebar-collapsed')`
- Theme selector in sidebar (dropdown when expanded, palette icon when collapsed)
- Header shows user info only when authenticated AND not in demo mode; shows `Demo: {selectedRole}` badge in demo mode
- `handleLogout` resets `demoEnabled` state

### Auth Flow

- `/login` route redirects to `/dashboard` — login is NOT a standalone page
- `Layout` renders `LoginForm` when `!localStorage.getItem('token')`, otherwise renders `<Outlet />`
- Demo mode: sidebar toggle calls `POST /auth/login` with `{ xUserId: selectedRole }`, stores JWT
- `UserContext` provides: `user`, `participations`, `refreshUser()`, `isAuthenticated`, role helpers
- Polling: refreshes participations every 30s, pauses when tab hidden

### Components

- **`SubmitVideoModal`** — Two tabs: File Upload (default, drag-and-drop, progress bar) and URL
- **`VideoPlayerModal`** — YouTube/Vimeo/local detection, `< >` nav with counter, `<< >>` first/last with vertical divider, star review (⭐/☆), film strip border, captures video duration via `loadedmetadata`
- **`CreateNextRoundModal`** — Score filter (1-5 stars), actor checkboxes, Select All/Deselect All, "Create empty round" option
- **`AddParticipantsModal`** — Two textareas (actors, pre-selectors), email parsing
- **`ConfirmDialog`** — Focus management, Escape key, danger-styled confirm
- **`ToastProvider`** — `showSuccess/showError/showInfo`, auto-close 4s, bottom-right

### Frontend Utils

- `utils/scoring.ts` — `scoreToStars(score: number): number` (0-10 → 0-5)
- `utils/submissionStatus.ts` — `STATUS_STYLES`, `getStatusStyle()`, `SubmissionStatus` type

### UserCacheContext

- `getUser(id)` → `{ name, email }` from cache or null
- `ensureUser(id)` → fetches from `GET /users/:id`, caches, deduplicates concurrent requests
- Guards against falsy `id`

### E2E Testing (Playwright)

- Config: `frontend/playwright.config.ts` (baseURL: `localhost:5173`, auto-starts dev server)
- Helpers: `tests/e2e/helpers/auth.ts` (`loginAs`), `helpers/wait.ts` (`waitForToast`)
- Run: `cd frontend && npx playwright test`
- Single test: `cd frontend && npx playwright test -g "test name"`

### Frontend Structure

```
frontend/src/
├── api/client.ts              ← Axios with JWT Bearer interceptor
├── components/                ← Layout, LoginForm, SubmitVideoModal, VideoPlayerModal,
│                                CreateNextRoundModal, AddParticipantsModal, ConfirmDialog
├── context/                   ← UserContext, ThemeContext, ToastContext, UserCacheContext
├── pages/                     ← Dashboard, Castings, CreateCasting, CastingDetail, RoundDetail
├── utils/                     ← scoring.ts, submissionStatus.ts
├── App.tsx                    ← Routes + UserProvider + ThemeProvider
└── index.css                  ← Tailwind + CSS custom properties
```

## Versioned AGENTS.md

Backup rule: Before editing, copy current file to `docu/saves-agents/AGENTS_<YYYYMMDD_HHMMSS>.md`.
Purpose: Revert bad agent changes, track rule evolution, reference past decisions.
