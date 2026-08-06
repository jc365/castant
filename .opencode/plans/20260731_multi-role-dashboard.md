# Plan: Multi-Role Dashboard

## Context
The user wants to replant the Dashboard to be multi-role. A single user can be director, actor, and preselector simultaneously across different castings/rounds. The Dashboard must show ALL participations grouped by role, with conditional sections.

The `Participation` discriminated union (`type: 'casting' | 'round'`, `role: string`) already supports this. The data is already fetched via `GET /users/me/participations`. The backend doesn't need changes.

## File to Modify
- `frontend/src/pages/Dashboard.tsx` (single file, ~611 lines)

## Data Grouping (already available from participations)

```tsx
// Director: casting-level participations
const directorCastings = participations
  .filter(p => p.type === 'casting' && p.role === 'director');

// Actor: round-level participations
const actorRounds = participations
  .filter(p => p.type === 'round' && p.role === 'actor');

// Preselector: round-level participations
const preselectorRounds = participations
  .filter(p => p.type === 'round' && p.role === 'preselector');
```

## Design

### 1. Header Badge (role indicators)
Add a subtitle line below "Dashboard" showing active roles:
```
Director (2) · Actor (3) · Preselector (1)
```
Only show roles with count > 0.

### 2. Section: "As Director" (`directorCastings.length > 0`)
- KPI cards: Total Castings, Active Castings, Reviewed, Pending
- "Your Castings" grid with CastingCard components
- "Create Casting" button
- Charts: Submissions per Round, Score Distribution (from director's castings)

### 3. Section: "As Actor" (`actorRounds.length > 0`)
- Fetch round details for each actor round (GET /rounds/:id) to get status + submissions
- Active Rounds grid with "Submit Video" button (RoundCard)
- Passed Rounds grid (read-only RoundCard)
- "My Videos" link or section showing actor's own submissions

### 4. Section: "As Preselector" (`preselectorRounds.length > 0`)
- Fetch round details for each preselector round (GET /rounds/:id)
- Show assigned rounds as read-only cards (no action buttons)
- Show submissions in those rounds for review context

### 5. Recent Activity (all roles combined)
Keep existing logic but filter by user's participations across all roles.

## Data Loading Strategy

Current approach: fetches ALL castings, filters by `myCastingIds`, then fetches rounds per casting, then submissions per round.

New approach: **keep the same cascading fetch**, but split results by role at render time.

```
1. Fetch GET /castings → filter to directorCastings (type='casting', role='director')
2. For each director casting: GET /castings/:id → get rounds
3. For each round in director castings: GET /rounds/:id → get submissions
4. For actor rounds: GET /rounds/:id (already in step 3 if same casting, otherwise separate fetch)
5. For preselector rounds: GET /rounds/:id (same logic)
```

Optimization: Use a `Map<string, RoundSummary>` to deduplicate round fetches across roles. A round fetched for director view can be reused for actor/preselector view of the same round.

## Component Changes

### Remove
- `KPICard` component (will be inlined per section or recreated per section)
- Global stats computed from all rounds

### Add
- `RoleBadge` component for header
- Per-section KPI cards (director gets its own, actor gets its own)
- Section wrapper components with role icon + title

### Modify
- `RoundCard`: Accept `showSubmitButton` prop (already does this via `active` boolean)
- `CastingCard`: Keep as-is
- `EmptyState`: Keep as-is, show per-section

## Implementation Steps

### Step 1: Add role grouping memos
Add `useMemo` hooks to split participations by role:
```tsx
const directorCastings = useMemo(() => 
  participations.filter(p => p.type === 'casting' && p.role === 'director'),
  [participations]
);
const actorRounds = useMemo(() => 
  participations.filter(p => p.type === 'round' && p.role === 'actor'),
  [participations]
);
const preselectorRounds = useMemo(() => 
  participations.filter(p => p.type === 'round' && p.role === 'preselector'),
  [participations]
);
```

### Step 2: Restructure data loading
- Keep existing `useEffect` that fetches castings and rounds
- Add deduplication: store fetched rounds in a `Map<string, RoundSummary>`
- For actor/preselector rounds not covered by director castings, fetch them separately

### Step 3: Update KPI computation
- Director KPIs: computed from director castings' submissions only
- Actor KPIs: computed from actor rounds' submissions only (e.g., total videos, reviewed, pending)

### Step 4: Update JSX layout
Replace monolithic layout with role-based sections:
```tsx
{/* Header */}
<h1>Dashboard</h1>
<RoleBadge directorCount={directorCastings.length} actorCount={actorRounds.length} preselectorCount={preselectorRounds.length} />

{/* As Director */}
{directorCastings.length > 0 && (
  <section>
    <h2>As Director</h2>
    <KPICards ... />
    <CastingGrid ... />
    <Charts ... />
  </section>
)}

{/* As Actor */}
{actorRounds.length > 0 && (
  <section>
    <h2>As Actor</h2>
    <ActiveRounds ... />
    <PassedRounds ... />
  </section>
{/* As Preselector */}
{preselectorRounds.length > 0 && (
  <section>
    <h2>As Preselector</h2>
    <RoundList ... />
  </section>
)}

{/* Recent Activity (all roles) */}
<RecentActivity ... />
```

### Step 5: Update charts
- Submissions per Round: only from director's castings
- Score Distribution: only from director's castings' submissions
- These charts are director-specific; don't show for actor/preselector sections

### Step 6: Handle edge cases
- User with ONLY actor role: no director section, no charts
- User with ONLY preselector role: no director section, no actor section
- User with ALL roles: all three sections shown
- Empty states per section

## Verification
1. `cd backend && npx tsc --noEmit` — typecheck
2. `npm test` — backend tests (198 tests)
3. `npm run test:front` — frontend tests
4. Manual: start dev server, login as demo user, verify sections render correctly per role
