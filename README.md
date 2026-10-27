# Patrol

Responder-facing apps for AGOS — a real-time water management and flood monitoring platform. This repo hosts two apps:

- **PWA** (repo root) — the original progressive web app
- **Native app** (`apps/responder/`) — React Native (Expo) port of the responder PWA

## Native app (`apps/responder`)

React Native + Expo port of the responder PWA, targeting the same backend API.

- Expo SDK 57, Expo Router, NativeWind v4
- React 19 + TypeScript
- Route map and module contract: [`apps/responder/PARITY.md`](apps/responder/PARITY.md)
- Setup, env vars, and conventions: [`apps/responder/README.md`](apps/responder/README.md)

```bash
cd apps/responder
npx expo start        # run in Expo Go or a development build
```

## PWA Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 7
- **PWA**: vite-plugin-pwa (Workbox) with custom service worker
- **Styling**: Tailwind CSS (font: Poppins), dark mode support (light/dark/system)
- **Routing**: React Router 7
- **HTTP**: Axios (auto camelCase/snake_case conversion interceptors)
- **i18n**: English + Filipino (Tagalog)
- **Icons**: Lucide React
- **State**: Context API
- **Real-time**: WebSocket
- **Push**: Web Push API + VAPID

## Prerequisites

- Node.js 18+
- Running AGOS backend

## Setup

```bash
# Install dependencies
npm install

# Create .env file
echo 'VITE_API_BASE_URL=http://localhost:8000' > .env
echo 'VITE_API_WS_URL=ws://localhost:8000' >> .env

# Start dev server
npm run dev
```

## Environment Variables

| Variable            | Description                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Backend API URL (e.g., `http://localhost:8000`)                           |
| `VITE_API_WS_URL`   | Backend WebSocket origin (e.g., `ws://localhost:8000`; app appends `/ws`) |

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start dev server with HMR           |
| `npm run build`   | Type-check and build for production |
| `npm run lint`    | Run ESLint                          |
| `npm run preview` | Preview production build            |

## Pages

| Route                      | Page             | Description                                                                      |
| -------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| `/home`                    | Home             | Dashboard with fusion risk, blockage, water level + 24h sparkline, weather cards |
| `/alerts`                  | Alerts           | Paginated alert list with server-side type filters, "Load more", acknowledgement |
| `/me`                      | Profile          | Push notification prefs, language, theme, logout                                 |
| `/install`                 | Install Gate     | PWA install instructions (Android: prompt API, iOS: step-by-step Safari guide)   |
| `/verify/phone-lookup`     | Phone Lookup     | Enter phone number to start registration                                         |
| `/verify/otp-verification` | OTP Verification | Enter OTP to confirm identity                                                    |

## Auth Flow

1. Responder enters phone number at `/verify/phone-lookup`
2. Backend sends OTP via SMS (SMSGate Android app), or returns a Demo OTP when explicitly enabled for development
3. Responder enters OTP at `/verify/otp-verification`
4. On success, `responderId` + `responderToken` (JWT, 90-day expiry) stored in localStorage
5. Axios interceptor injects `Authorization: Bearer {token}` on every request
6. On 401 response, storage is cleared and user is redirected to `/verify`
7. AuthGuard checks both `responderId` and `responderToken` exist

## Push Notifications

The app uses Web Push with VAPID for real-time alerts:

1. Service worker (`public/sw.js`) handles push events
2. Native notifications with vibration patterns per severity
3. In-app audio feedback (Web Audio API tones)
4. Offline acknowledgement queue — acks are queued and flushed on reconnect

## Project Structure

```
src/
├── components/          # AppHeader, BottomNav, ErrorBoundary, common components
├── context/             # Global context providers
│   ├── CoreContext        # Responder profile + logout
│   ├── WebSocketContext   # WS connection + message subscription
│   ├── BlockageContext    # Blockage detection state
│   ├── WeatherContext     # Weather data state
│   ├── WaterLevelContext  # Sensor data state
│   ├── FusionAnalysisContext  # Fusion risk score state
│   ├── NotificationContext    # Unread count + push handling
│   ├── ThemeContext       # Light/dark/system theme
│   └── I18nContext        # English/Filipino translations
├── guards/              # AuthGuard (responderId + token), InstalledGuard
├── hooks/               # usePushNotifications
├── layouts/             # MainLayout, VerifyLayout
├── lib/
│   ├── api/             # API client modules (verify, responder, alert, sensor)
│   ├── i18n/            # Translation files (en.ts, fil.ts)
│   └── utils/           # Formatters, alertFeedback, offlineQueue, pwa
├── pages/               # Page components (folder per page)
└── types/               # TypeScript interfaces
```

## Key Differences from Admin Frontend

| Concern            | Admin Frontend                | Responders PWA                                               |
| ------------------ | ----------------------------- | ------------------------------------------------------------ |
| Auth               | JWT (access + refresh tokens) | JWT responder token (90-day) + `responderId` in localStorage |
| Field naming       | snake_case directly           | camelCase (axios auto-converts)                              |
| Push notifications | Sends them                    | Receives them                                                |
| Offline support    | None                          | Offline ack queue                                            |
| i18n               | None                          | English + Filipino                                           |
| Dark mode          | None                          | Light/dark/system                                            |
