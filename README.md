# Once

Restaurant management for UAE restaurants. Single Expo (React Native) app + Node/Express backend.

## Layout

```
/            Expo app (NativeWind, expo-router, dark mode only, tablet + phone)
/server      Node + Express + Postgres + Redis + BullMQ + Socket.io
```

## Tech

- **Frontend:** Expo, expo-router, NativeWind, React Query, Zustand, Socket.io client, expo-print, expo-secure-store, @sentry/react-native
- **Backend:** Express, pg (PostgreSQL), ioredis + BullMQ, socket.io, jsonwebtoken, bcryptjs, zod, AES-256-GCM credential encryption, @sentry/node

## Design system

| Token | Value |
| --- | --- |
| Background | `#0D0F14` |
| Card | `#161920` |
| Active | `#1E2128` |
| Border | `#2C2F3A` |
| Amber | `#F5A623` (pressed `#D4891A`) |
| Talabat | `#FF6D00` |
| Deliveroo | `#00CCBC` |
| InstaShop | `#43A047` |
| Dine-in | `#7C6AF5` |
| Takeaway | `#E8A838` |
| Available | `#22C55E` |
| Occupied | `#F59E0B` |
| Urgent | `#EF4444` |

Inter is loaded via `expo-font` from `assets/fonts/`. Drop the four ttf files in there before first run.

Dark mode only. Bottom-tab navigation only. No web primitives anywhere.

## Run the app

```bash
npm install
npm run start
```

## Run the backend

```bash
cd server
cp .env.example .env
npm install
npm run migrate
npm run dev
```

## Roles

| Role | Sees |
| --- | --- |
| Owner | everything |
| Manager | orders, tables, inventory, menu (no financials, no staff) |
| Waiter | only their tables and dine-in orders |
| Kitchen | screen-mode read-only ticket view (or no app at all in printer mode) |

Visibility is gated at the **component level** (`<RoleGate>`) and tab-level (`href: null`).
