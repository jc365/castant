# Plan: Round Status Model & Actor Dashboard

## Context

Rounds currently have no status field — all rounds appear equal. The goal is to distinguish between active rounds (actors can submit) and passed rounds (read-only). The actor's primary interaction point should be the Dashboard, where each active round has a "Submit Video" button.

---

## Changes

### 1. Add `status` field to Round in Prisma

**File:** `backend/prisma/schema.prisma`

Add to Round model:
```prisma
status   String @default("active") // "active" | "passed"
```

Then run: `cd backend && npm run db:push`

### 2. Update Round domain entity

**File:** `backend/src/domain/entities/Round.ts`

- Add `_status` field with getter
- Update `create()` factory to accept optional `status` parameter
- Add `markAsPassed()` method that returns new instance with `status: 'passed'`

### 3. Update PrismaRoundRepository

**File:** `backend/src/infrastructure/persistence/PrismaRoundRepository.ts`

- `toDomain()`: map `status` from record
- `save()`: include `status` in create/update

### 4. Update ManageRoundParticipantsUseCase

**File:** `backend/src/application/use-cases/rounds/ManageRoundParticipantsUseCase.ts`

When `createNewRound=true`:
- After creating new round, mark current round as "passed"
- Save both rounds

### 5. Update GET /castings/:id

**File:** `backend/src/infrastructure/api/v1/routes.ts` (line ~293)

Add `status: r.status` to each round in `roundsData`.

### 6. Update GET /rounds/:id

**File:** `backend/src/infrastructure/api/v1/routes.ts` (line ~346)

Add `status: round.status` to response.

### 7. Remove Edit button and EditRoundModal from RoundDetail

**File:** `frontend/src/pages/RoundDetail.tsx`

- Remove `showEditRound` state
- Remove Edit button from sidebar
- Remove `EditRoundModal` component entirely (lines 608-670)
- Keep Delete Round button

### 8. Update Dashboard for Actor view

**File:** `frontend/src/pages/Dashboard.tsx`

- Add `status` field to `RoundSummary` interface
- Fetch `status` from `/rounds/:id` response
- Split rounds into `activeRounds` and `passedRounds` by status
- For actors: show "Active Rounds" section with "Submit Video" button per round
- For actors: show "Passed Rounds" section (read-only, no submit button)
- Add `SubmitVideoModal` import and state management
- Each "Submit Video" button opens the modal with the corresponding `roundId`

### 9. Update VideoPlayerModal for role-based visibility

**File:** `frontend/src/components/VideoPlayerModal.tsx`

- Add `isActor` prop (default `false`)
- When `isActor=true`: hide the review panel (stars + submit button)
- When `isActor=false`: keep existing review panel behavior
- Pass `isActor` from RoundDetail and Dashboard

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/prisma/schema.prisma` | Add `status` field to Round |
| `backend/src/domain/entities/Round.ts` | Add `_status`, getter, `markAsPassed()` |
| `backend/src/infrastructure/persistence/PrismaRoundRepository.ts` | Map `status` in `toDomain()` and `save()` |
| `backend/src/application/use-cases/rounds/ManageRoundParticipantsUseCase.ts` | Mark previous round as "passed" on createNewRound |
| `backend/src/infrastructure/api/v1/routes.ts` | Add `status` to GET /castings/:id and GET /rounds/:id |
| `frontend/src/pages/RoundDetail.tsx` | Remove Edit button and EditRoundModal |
| `frontend/src/pages/Dashboard.tsx` | Add active/passed round sections with Submit Video button |
| `frontend/src/components/VideoPlayerModal.tsx` | Add `isActor` prop, hide scoring when true |

---

## Verification

1. `cd backend && npx prisma generate`
2. `cd backend && npm run db:push`
3. `cd backend && npx tsc --noEmit`
4. `npm test` (from root)
5. `npm run test:integration`

---

## Risk Assessment

- **Low risk**: Adding a field with default value is backward-compatible
- **Migration**: `db:push` will add the column with default `"active"` for existing rounds
- **Tests**: Round tests may need updating if they assert on response shape
