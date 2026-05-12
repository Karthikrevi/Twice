# Once

Restaurant management for UAE restaurants. Three deployable apps in one
monorepo:

| App | Folder | Purpose |
| --- | --- | --- |
| Native (iOS / Android / Expo Go) | `/` (Expo project at repo root) | Tablet- and phone-first dark UI; used by staff in-restaurant |
| Web | `/web` | Browser dashboard with the same design system; admin-style layout (top bar + left sidebar) |
| Backend API | `/server` | Node + Express + Postgres + Redis + BullMQ + Socket.io |

Branch under active development: `claude/build-once-app-Gqv0R`.

---

## Tech stack

### Native (`/`)
- **Expo SDK 54**, React 19, React Native 0.81
- `expo-router` v6 (typed routes)
- `nativewind` v4 + Tailwind v3 (dark mode only, no light)
- React Query v5, Zustand v4, axios, socket.io-client
- `expo-secure-store`, `expo-font` (Inter 400/500/600/700),
  `expo-print`, `expo-web-browser`, `@sentry/react-native`
- `react-native-reanimated@4` + `react-native-worklets` (NativeWind's
  babel preset loads `react-native-worklets/plugin`; no extra plugin
  entry needed in `babel.config.js`)

### Web (`/web`)
- Vite 5 + React 19 + TypeScript 5
- Tailwind v3 + PostCSS + Autoprefixer
- React Router v6, React Query v5, Zustand v4, axios,
  socket.io-client
- Inter via Google Fonts (`index.html` preconnect + stylesheet)
- localStorage in place of SecureStore

### Backend (`/server`)
- Node 20+, Express, `pg`, `ioredis`, BullMQ, socket.io
- `jsonwebtoken`, `bcryptjs`, `zod`, `express-rate-limit`,
  AES-256-GCM credential encryption, `@sentry/node`

---

## Folder structure

```
/
├── CLAUDE.md                       ← this file
├── README.md
├── app.json                        ← Expo config (incl. eas.projectId)
├── eas.json                        ← EAS Build profiles
├── babel.config.js                 ← babel-preset-expo + nativewind
├── metro.config.js                 ← withNativeWind wrapper
├── tailwind.config.js              ← Once design tokens
├── tsconfig.json                   ← Expo strict TS, excludes /server
├── global.css                      ← @tailwind directives
├── assets/fonts/                   ← Inter-Regular/Medium/SemiBold/Bold.ttf
│
├── app/                            ← expo-router file-based routes
│   ├── _layout.tsx                 ← root Stack, splash, bootstrap, query client
│   ├── index.tsx                   ← role redirect
│   ├── login.tsx                   ← native Login screen
│   ├── onboarding/index.tsx        ← 5-step wizard router
│   ├── table/[id].tsx              ← table detail (open / items / close bill)
│   ├── (owner)/_layout.tsx + index.tsx
│   ├── (owner)/staff.tsx           ← StaffManagement route
│   ├── (manager)/_layout.tsx + index.tsx
│   ├── (waiter)/_layout.tsx + index.tsx
│   └── (kitchen)/_layout.tsx + index.tsx
│
├── src/                            ← shared screen logic + plumbing
│   ├── theme/colors.ts             ← native design tokens
│   ├── types/index.ts              ← Order, RestaurantTable, MenuItem, Role…
│   ├── store/session.ts            ← Zustand session (user, restaurantName, setupDone)
│   ├── store/onboarding.ts         ← Zustand wizard state
│   ├── data/mock.ts                ← helpers (nextStatus, minutesSince) + legacy mocks
│   │
│   ├── lib/                        ← shared utilities
│   │   ├── api.ts                  ← axios + JWT request/response interceptors, single-flight refresh
│   │   ├── socket.ts               ← socket.io-client with auth callback re-reading fresh token
│   │   ├── secureStorage.ts        ← expo-secure-store wrapper (access, refresh, user, setupDone, keepLoggedIn, restaurantName)
│   │   ├── adapters.ts             ← server snake_case → client camelCase
│   │   ├── queryKeys.ts            ← React Query keys
│   │   └── print.ts                ← printBill / printKitchenTicket / printDailyReport (expo-print)
│   │
│   ├── hooks/                      ← React Query + custom hooks
│   ├── components/                 ← UI primitives + OrderCard + RoleGate + nav/TabsLayout
│   └── screens/                    ← screen implementations re-exported by route files
│
├── server/                         ← Node backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                ← Express + Socket.io + queue workers + Sentry init
│       ├── env.ts
│       ├── db/
│       │   ├── pool.ts             ← pg pool + withRestaurant transactional helper
│       │   ├── schema.sql          ← full DB schema
│       │   └── migrate.ts
│       ├── lib/
│       │   ├── crypto.ts           ← AES-256-GCM encrypt/decrypt + HMAC verify
│       │   └── jwt.ts              ← signAccess (15m) / signRefresh (7d or 30d)
│       ├── middleware/{auth,audit}.ts
│       ├── queues/index.ts         ← BullMQ webhook + platform-sync workers
│       ├── queues/handlers/{webhookHandler,platformSync}.ts
│       ├── realtime/io.ts          ← Socket.io with JWT handshake, per-restaurant rooms
│       └── routes/                 ← auth, setup, orders, menu, tables, reports, staff, platforms, webhooks
│
└── web/                            ← Vite React web app
    ├── index.html                  ← Inter font preconnect
    ├── vite.config.ts              ← @ → ./src, dev :5173
    ├── tailwind.config.ts          ← same Once tokens
    ├── tsconfig.json
    └── src/
        ├── main.tsx                ← createRoot + BrowserRouter + QueryClientProvider
        ├── App.tsx                 ← routes + RootRedirect + RequireAuth
        ├── index.css               ← @tailwind directives
        ├── vite-env.d.ts
        ├── lib/                    ← storage / api / socket / queryKeys / theme / adapters
        ├── hooks/                  ← useOrders / useTables / useReports / useSocketSync / useAuth
        ├── store/session.ts        ← web Zustand session
        ├── types/index.ts
        └── screens/                ← Login, Onboarding, owner/*
```

---

## Design system tokens

Identical native + web. Dark mode only.

| Token | Hex |
| --- | --- |
| Background `bg` | `#0D0F14` |
| Surface | `#161920` |
| Surface active | `#1E2128` |
| Border | `#2C2F3A` |
| Amber (primary) | `#F5A623` |
| Amber pressed | `#D4891A` |
| Talabat | `#FF6D00` |
| Deliveroo | `#00CCBC` |
| InstaShop | `#43A047` |
| Dine-in | `#7C6AF5` |
| Takeaway | `#E8A838` |
| Status — available | `#22C55E` |
| Status — occupied | `#F59E0B` |
| Status — urgent | `#EF4444` |
| Text primary | `#F1F3F7` |
| Text secondary | `#8B90A0` |
| Text muted | `#4A4F5E` |

Font family: **Inter** (400/500/600/700). On native via `expo-font`
from `assets/fonts/Inter-*.ttf`. On web via Google Fonts in
`web/index.html`.

---

## Role architecture

Four roles. Each role has its **own** route group on native and the
same separation on web. There is no shared bottom tab shell.

| Role | Native route group | Native dashboard | Web route |
| --- | --- | --- | --- |
| Owner | `app/(owner)/` | `src/screens/owner/OwnerDashboard.tsx` | `/owner` |
| Manager | `app/(manager)/` | `src/screens/manager/ManagerDashboard.tsx` | `/manager` (not built) |
| Waiter | `app/(waiter)/` | `src/screens/waiter/WaiterDashboard.tsx` | `/waiter` (not built) |
| Kitchen | `app/(kitchen)/` | `src/screens/kitchen/KitchenScreen.tsx` | `/kitchen` (not built) |

`RoleGate` (`src/components/RoleGate.tsx`) wraps sensitive UI:
- **Revenue totals**: gated to `["owner","manager","kitchen"]` —
  hidden for waiter
- **Status update buttons**: gated to `["owner","manager","waiter"]` —
  hidden for kitchen

Manager has a PIN gate on sensitive Finance actions
(`usePinPrompt` hook → `POST /auth/verify-pin`).

---

## Native screens

### Auth + onboarding
| Screen | File |
| --- | --- |
| Login (Welcome back, eye toggle, Keep-me-logged-in, Forgot password sheet) | `app/login.tsx` |
| Onboarding router | `app/onboarding/index.tsx` |
| Step 1 — Create your restaurant | `src/screens/onboarding/Step1Account.tsx` |
| Step 2 — Set up your space (tables + kitchen output) | `src/screens/onboarding/Step2Space.tsx` |
| Step 3 — Build your menu | `src/screens/onboarding/Step3Menu.tsx` |
| Step 4 — Connect your platforms | `src/screens/onboarding/Step4Platforms.tsx` |
| Step 5 — Add your team | `src/screens/onboarding/Step5Staff.tsx` |
| Step shell + progress bar | `src/screens/onboarding/StepShell.tsx` |

### Owner
| Screen | File |
| --- | --- |
| Owner dashboard shell (4 stat cards + horizontal sub-tabs) | `src/screens/owner/OwnerDashboard.tsx` |
| Orders tab (3-col grid, CONFIRM/REJECT/MARK READY/PACK/MARK DELIVERED) | `src/screens/owner/tabs/OwnerOrders.tsx` |
| Dine-in tab (split panel: orders left, tables grid + open-revenue footer right) | `src/screens/owner/tabs/OwnerDinein.tsx` |
| Finance tab shell (date selector + 5 sub-pills) | `src/screens/owner/tabs/OwnerFinance.tsx` |
| Finance — Overview | `src/screens/owner/tabs/finance/FinanceOverview.tsx` |
| Finance — Platforms (deep dive + line chart + bar chart + commission history) | `src/screens/owner/tabs/finance/FinancePlatforms.tsx` |
| Finance — Till (cash/card/wallet + dine-in breakdown + EOD summary) | `src/screens/owner/tabs/finance/FinanceTill.tsx` |
| Finance — Settlements (table + outstanding card) | `src/screens/owner/tabs/finance/FinanceSettlements.tsx` |
| Finance — Servers (leaderboard + sparklines + table-by-table) | `src/screens/owner/tabs/finance/FinanceServers.tsx` |
| Platforms tab | `src/screens/owner/OwnerPlatforms.tsx` |
| Settings tab (Restaurant / Owner / Staff / Notifications / Danger zone) | `src/screens/owner/OwnerSettings.tsx` |
| Staff management (filters + Add Staff bottom sheet) | `src/screens/owner/StaffManagement.tsx` |

### Manager
| Screen | File |
| --- | --- |
| Manager dashboard (4 stat cards + 4 tabs, Finance with lock icon) | `src/screens/manager/ManagerDashboard.tsx` |
| Manager Finance (same sub-pills as owner, Export PDF gated by PIN) | `src/screens/manager/ManagerFinance.tsx` |

### Waiter
| Screen | File |
| --- | --- |
| Waiter dashboard (Tables + Orders) | `src/screens/waiter/WaiterDashboard.tsx` |
| Tables grid + Open Table sheet + pulsing "ready" border | `src/screens/waiter/WaiterTables.tsx` |
| Orders (dine-in only, MARK DELIVERED on ready) | `src/screens/waiter/WaiterOrders.tsx` |

### Kitchen
| Screen | File |
| --- | --- |
| Horizontal ticket display + clock + DONE-stamp overlay (printer-mode fallback) | `src/screens/kitchen/KitchenScreen.tsx` |

### Shared
| Screen | File |
| --- | --- |
| Table detail (open / add items / Order Ready card / close bill / print bill) | `app/table/[id].tsx` |

---

## Native hooks

| Hook | File | Purpose |
| --- | --- | --- |
| `useLogin`, `logout` | `src/hooks/useAuth.ts` | POST /auth/login, persist tokens + Keep-me-logged-in flag, connect socket, route by role |
| `useForgotPassword` | `src/hooks/useForgotPassword.ts` | POST /auth/forgot-password |
| `useOrders`, `useAdvanceOrderStatus` | `src/hooks/useOrders.ts` | GET /orders + optimistic PATCH /orders/:id/status |
| `useMenu`, `useToggleAvailability`, `useAdjustStock` | `src/hooks/useMenu.ts` | GET /menu + availability/stock mutations |
| `useTables`, `useTableSession`, `useOpenTable`, `useAddSessionItem`, `useCloseSession` | `src/hooks/useTables.ts` | Table grid + per-session detail + open/add/close mutations |
| `useDailyReport` | `src/hooks/useReports.ts` | GET /reports/daily |
| `useStaff`, `useCreateStaff`, `useDeleteStaff` | `src/hooks/useStaff.ts` | Staff CRUD |
| `usePlatforms`, `useUpsertPlatform`, `useDisconnectPlatform` | `src/hooks/usePlatforms.ts` | Platform credentials + commission rates |
| `useSocketSync` | `src/hooks/useSocketSync.ts` | order:new / order:status → invalidate orders cache |
| `useKitchenAutoPrint` | `src/hooks/useKitchenAutoPrint.ts` | When in printer mode, listens to order:new and calls printKitchenTicket |
| `usePinPrompt` | `src/hooks/usePinPrompt.tsx` | Returns { requirePin(action), PinPromptModal }; POST /auth/verify-pin |
| `useSubmitOnboarding` | `src/hooks/useOnboardingSubmit.ts` | POST /setup with full wizard payload |

---

## Web hooks

| Hook | File | Purpose |
| --- | --- | --- |
| `useOrders`, `useAdvanceOrderStatus` | `web/src/hooks/useOrders.ts` | Same as native |
| `useTables` | `web/src/hooks/useTables.ts` | Same as native |
| `useDailyReport` | `web/src/hooks/useReports.ts` | Same as native |
| `useSocketSync` | `web/src/hooks/useSocketSync.ts` | Same as native |
| `logout(navigate)` | `web/src/hooks/useAuth.ts` | Disconnect socket → clear storage → signOut → navigate("/login") |

`useLogin` / `useSubmitOnboarding` are inline `useMutation`s in
`web/src/screens/Login.tsx` and `web/src/screens/Onboarding.tsx`.

---

## Web screens

| Screen | File |
| --- | --- |
| Login (Welcome back, eye toggle, Keep-me-logged-in, Forgot password modal, success banner, "Register your restaurant" link) | `web/src/screens/Login.tsx` |
| Onboarding (`/register`) — 5 steps, mirrors native | `web/src/screens/Onboarding.tsx` |
| Owner dashboard shell (top bar + left sidebar + content slot) | `web/src/screens/owner/OwnerDashboard.tsx` |
| Owner Orders | `web/src/screens/owner/tabs/OwnerOrders.tsx` |
| Owner Dine-in | `web/src/screens/owner/tabs/OwnerDinein.tsx` |

App routes (`web/src/App.tsx`):

| Path | Behaviour |
| --- | --- |
| `/` | Redirects to `/login` if no user, otherwise to role home |
| `/login` | Login screen |
| `/register` | Onboarding wizard |
| `/onboarding` | Redirects to `/register` |
| `/owner/*` | `<RequireAuth><OwnerDashboard /></RequireAuth>` |
| `/manager/*` `/waiter/*` `/kitchen` | placeholders |
| `*` | 404 placeholder |

---

## Backend routes (`/server`)

All under `Authorization: Bearer <jwt>` unless noted.

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | { email, password, keepLoggedIn? } → { user, accessToken, refreshToken, restaurantName }. Refresh expiry 30d when keepLoggedIn else 7d. |
| GET | `/auth/me` | any | Current user + restaurantName |
| POST | `/auth/refresh` | public | { refreshToken } → { accessToken } |
| POST | `/auth/forgot-password` | public | Always returns 200; logs reset link to server console (no email provider wired) |
| POST | `/auth/verify-pin` | any | { pin: "\d{4}" } against `restaurants.owner_pin_hash`. Returns 200 if PIN not yet set (TODO) |
| POST | `/setup` | public | One-shot owner+restaurant+menu+staff+platforms onboarding |
| GET | `/orders` | any (waiter filtered to dine-in on their tables) | Returns active + recent orders |
| PATCH | `/orders/:id/status` | owner, manager | Advance status; emits order:status |
| GET | `/menu` | any | |
| POST | `/menu` | owner, manager | Add dish |
| PATCH | `/menu/:id/availability` | owner, manager | Toggle availability + enqueue platform sync |
| PATCH | `/menu/:id/stock` | owner, manager | |
| GET | `/tables` | any | Tables with current open session |
| GET | `/tables/sessions/:sessionId` | any | Open session items |
| POST | `/tables/:id/open` | any | Returns sessionId |
| POST | `/tables/sessions/:sessionId/items` | any | |
| POST | `/tables/sessions/:sessionId/close` | owner, manager, waiter | Records payments by split |
| GET | `/reports/daily` | owner, manager | byPlatform + tills for today |
| GET | `/staff` | owner | |
| POST | `/staff` | owner | { name, email, password, role } |
| DELETE | `/staff/:id` | owner | |
| POST | `/staff/:id/reset-password` | owner | |
| GET | `/platforms` | owner | |
| POST | `/platforms` | owner | Encrypts token AES-256-GCM |
| DELETE | `/platforms/:platform` | owner | |
| POST | `/webhooks/{talabat,deliveroo,instashop}/:restaurantId` | HMAC | Normalizes vendor payloads into BullMQ with attempts: 3 + DLQ |

Socket.io
- JWT handshake auth, joins room `r:${rid}`
- Emits: `order:new`, `order:status`

DB schema (`server/src/db/schema.sql`)
- `restaurants` (+ `owner_pin_hash`), `roles`, `users`, `staff_invites`
- `menu_items`, `stock_levels`
- `platforms`, `platform_credentials` (AES-256-GCM)
- `tables`, `table_sessions`, `table_session_items`
- `orders`, `order_items`, `order_status_history`
- `payment_records`, `settlements`
- `password_reset_tokens`, `audit_logs`

---

## What still needs to be built

### Native gaps (smaller)
- Native `useOnboardingSubmit` already lives at
  `src/hooks/useOnboardingSubmit.ts` — backend `/setup` is wired.
- Native onboarding doesn't yet collect a Google OAuth path (web only)
- Native push notifications for low-stock + order-ready not wired
  (no `expo-notifications`)
- TableDetail by-item split UI is still placeholder ("you'll assign
  each item to a guest tab")
- `@sentry/react-native` is configured in `app.json` plugins but
  `Sentry.init(...)` isn't called anywhere yet

### Web gaps
- Owner sub-screens not built on web: Finance shell + 5 sub-screens
  (Overview / Platforms / Till / Settlements / Servers), Platforms tab,
  Settings tab, Staff Management
- Manager, Waiter, Kitchen dashboards not built on web
- Web table detail not built
- Web bill printing (`expo-print` is native only; web Print Bill would
  use `window.print()` or a PDF blob)
- Web push: no real-time toast yet beyond cache invalidation

### Backend gaps (real endpoints still missing, currently mocked client-side)
- `GET /reports/weekly` (line chart on FinancePlatforms uses mocks)
- `GET /reports/servers` (FinanceServers uses placeholder waiters)
- `GET /reports/settlements` (FinanceSettlements uses placeholder rows)
- `GET /staff/invites` (StaffManagement uses one placeholder invite)
- Rejection endpoint for orders (CONFIRM works; REJECT closes the sheet)
- Google OAuth endpoint (`POST /auth/google`) — coming next
- Real Talabat / Deliveroo / InstaShop API calls in
  `platformSync.ts` (currently console.log stubs)
- Settlement closing job (the table exists but never written to)
- Audit log read endpoint

### Infrastructure
- No CI yet (eas.json has build profiles, GitHub Actions not wired)
- No tests anywhere
- DB tenant isolation: every query passes `restaurant_id`; the
  `withRestaurant()` transactional helper exists in
  `server/src/db/pool.ts` but is not yet used by routes — replace
  with Postgres RLS or enforce the helper before production

---

## How to run

### Native
```bash
git pull
npm install
npx expo start                     # press i / a / w or scan with Expo Go
```

### Web
```bash
cd web
npm install
npm run dev                        # http://localhost:5173
```

Override the API URL with `web/.env.local`:
```
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

### Backend
```bash
cd server
cp .env.example .env
npm install
npm run migrate                    # applies schema.sql
npm run dev                        # nodemon-style with tsx
```

Requires running Postgres + Redis instances.

---

## Notes for future Claude sessions

- Working branch: `claude/build-once-app-Gqv0R`
- Both `tsc --noEmit` (Expo + web) currently clean
- Sandbox cannot reach external networks — `expo-doctor` and any
  `expo install` that hits Expo's CDN will fail with `"Host not in
  allowlist…"`. Pull config-version upgrades from the user's machine.
- The native side excludes `/server/` from `tsconfig.json` so the
  Expo project type-checks cleanly without server type packages.
- NativeWind v4 + Reanimated v4: the babel plugin moved to
  `react-native-worklets/plugin`; NativeWind's babel preset loads it
  automatically. No explicit reanimated plugin in `babel.config.js`.
