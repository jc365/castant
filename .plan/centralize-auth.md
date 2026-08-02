# Plan: Centralizar Autenticación en UserContext

## Context
Login logic is duplicated across 4 call sites (LoginForm, 3 in Layout), each with its own `client.post` → `localStorage.setItem` → `refreshUser()` pattern. This plan centralizes all auth into `UserContext.login()` and `UserContext.logout()`.

## Current State (5 login call sites)

| File | Payload | Post-login |
|------|---------|------------|
| `LoginForm.tsx:20` | `{ email, password }` | `localStorage.setItem` + `onLoginSuccess()` → `refreshUser()` |
| `Layout.tsx:73` (handleDemoLogin) | `{ xUserId: role }` | `localStorage.setItem` + `refreshUser()` |
| `Layout.tsx:99` (toggleDemo) | `{ xUserId: selectedRole }` | `localStorage.setItem` + `refreshUser()` |
| `Layout.tsx:115` (handleRoleChange) | `{ xUserId: role }` | `localStorage.setItem` + `refreshUser()` |
| `pages/Login.tsx:18` (ORPHANED) | `{ email, password }` | `localStorage.setItem` + `navigate('/dashboard')` |

## Files to Modify

1. **`frontend/src/context/UserContext.tsx`** — Add `login()` and `logout()` methods
2. **`frontend/src/components/LoginForm.tsx`** — Use `context.login()` instead of direct API call
3. **`frontend/src/components/Layout.tsx`** — Use `context.login()` and `context.logout()`, add navigation
4. **`frontend/src/pages/Login.tsx`** — DELETE (orphaned, never routed)

## Implementation

### Step 1: UserContext — add `login()` and `logout()`

```tsx
interface UserContextValue {
  // ... existing
  login: (credentials: { email: string; password: string } | { xUserId: string }) => Promise<void>;
  logout: () => void;
}

// Inside UserProvider:
const login = async (credentials: { email: string; password: string } | { xUserId: string }) => {
  const res = await client.post('/auth/login', credentials);
  localStorage.setItem('token', res.data.token);
  localStorage.setItem('userId', res.data.userId);
  await refreshUser();
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  refreshUser();
};
```

Expose `login` and `logout` in the context value.

### Step 2: LoginForm.tsx — simplify

Replace the direct `client.post` + `localStorage.setItem` with:
```tsx
const { login } = useUser();
// ...
await login({ email, password });
onLoginSuccess(); // still called for any parent-side logic
```

Remove direct `client` import. Keep `onLoginSuccess` prop for backward compat (Layout passes `handleLogin` which calls `refreshUser` — now redundant but harmless).

### Step 3: Layout.tsx — simplify and add navigation

Replace all 3 login functions with calls to `context.login()`:

```tsx
const { user, refreshUser, login, logout } = useUser();
const navigate = useNavigate();

// handleDemoLogin → login({ xUserId: role }) + navigate('/dashboard')
// toggleDemo → login({ xUserId: selectedRole }) or logout()
// handleRoleChange → login({ xUserId: role })
// handleLogout → logout()
// handleLogin → refreshUser() (called by LoginForm's onLoginSuccess)
```

Key: Add `navigate('/dashboard')` after each successful login call.

### Step 4: Delete orphaned Login.tsx

`pages/Login.tsx` is never routed. Remove it.

## Navigation Strategy

- **LoginForm**: After successful `login()`, Layout's `isAuthenticated` becomes true (via `refreshUser()`), which switches render from `<LoginForm />` to `<Outlet />`. No explicit navigation needed — the reactive gate handles it.
- **Demo login/toggle/role change**: After `login()`, call `navigate('/dashboard')` to ensure user lands on Dashboard.
- **Logout**: After `logout()`, Layout's `isAuthenticated` becomes false, rendering `<LoginForm />`. No navigation needed.

## Verification

1. `cd frontend && npx tsc --noEmit` — no new TS errors
2. `npm test` — 198 backend tests pass
3. `npm run test:front` — frontend tests pass
4. Manual: login with email/password → lands on Dashboard
5. Manual: demo mode toggle → lands on Dashboard
6. Manual: change role → lands on Dashboard
7. Manual: logout → shows LoginForm
