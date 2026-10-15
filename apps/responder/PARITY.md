# v1 Parity Contract — PWA → Native

v1 ships **feature parity with the responder PWA** (`agos-patrol`), nothing more.
Alarm pipeline and offline resilience are later phases (wayfinder map #1).

## Route map (PWA → expo-router)

| PWA route                | Native file                             |
| ------------------------ | --------------------------------------- |
| `/verify` (phone lookup) | `app/(auth)/verify.tsx`                 |
| `/verify` OTP step       | `app/(auth)/otp.tsx`                    |
| `/home`                  | `app/(tabs)/index.tsx`                  |
| `/alerts`                | `app/(tabs)/alerts.tsx`                 |
| `/me`                    | `app/(tabs)/profile.tsx`                |
| `/install` (InstallGate) | — dropped: native is always "installed" |

## Shared module contract

- `src/lib/api/client.ts` — axios instance, default export `apiClient`;
  baseURL `${EXPO_PUBLIC_API_BASE_URL}/api/v1`; snake⇄camel key interceptors;
  `setCachedToken(t)` sync token for interceptors; `setUnauthorizedHandler(fn)` for 401 → `/verify`.
- `src/lib/api/{verify,responder,alert,sensor,camera}.ts` — same exports as PWA
  (`verifyAPI`, `responderAPI`, `alertsAPI`, `sensorAPI`, `getLatestCameraFrame`).
- `src/lib/storage.ts` — async SecureStore: `get/setResponderToken`, `get/setResponderId`, `clearResponderSession`.
- `src/context/*.tsx` — same providers/hooks as PWA (`useCoreHook`, `useWebSocket`,
  `useWebSocketMessage`, `useNotificationHook`, `useWaterLevel`, `useWeather`,
  `useWaterwayContext`, `useFusionAnalysis`, `useTheme`, `useI18n`).
  WS url: `${EXPO_PUBLIC_WS_URL}/ws?location_id=…`.
- `src/types/` — verbatim ports.
- Env: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_WS_URL` (see `.env.example`).

## Platform substitutions

- `localStorage` → `expo-secure-store` (+ sync cache for axios interceptors);
  payloads over SecureStore's ~2KB cap (alerts snapshot, #17) → AsyncStorage
- Web push (`PushNotificationManager`, service worker) → `expo-notifications`
- lucide-react → lucide-react-native; tailwind → NativeWind v4 (`dark:` kept)
- `import.meta.env.VITE_*` → `process.env.EXPO_PUBLIC_*`; `import.meta.env.DEV` → `__DEV__`
- `navigator.onLine` reconnect gate → removed (RN has no equivalent; backoff kept)

## Deliberately NOT in v1

- InstallGate (browser-only concept)
- Alarm/critical-alert pipeline — later wayfinder phases. Offline: ack outbox +
  last-page-1 alerts read-cache (#17) shipped; deeper tiers still deferred
- Citizen-facing features — separate future app/effort
