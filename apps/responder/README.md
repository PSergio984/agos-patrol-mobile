# AGOS Patrol — Responder (native)

Expo/React Native port of the AGOS responder PWA. Uses Expo Router + NativeWind v4.

## Setup

```bash
npm install
cp .env.example .env   # then fill in values
npx expo start
```

## Environment (.env)

- `EXPO_PUBLIC_API_BASE_URL` — backend base URL; requests go to `<base>/api/v1`
- `EXPO_PUBLIC_WS_URL` — WebSocket base URL; connects at `<ws>/ws?token=<responder-token>` (server derives the site channel from the responder's effective site)

## Structure

- `app/` — routes: `(auth)/verify` + `otp`, `(tabs)/index` + `alerts` + `profile`
- `src/` — shared code ported from the PWA: `types/`, `lib/` (api, i18n, storage, utils), `context/`, `components/`, `hooks/`, `styles/global.css`
- Auth token lives in `expo-secure-store` (`src/lib/storage.ts`); axios reads it via the `client.ts` module cache — call `setResponderToken`/`clearResponderSession`, never SecureStore directly for the token.

## Conventions

- Styling: NativeWind `className`; custom colors `primary`/`accent`/`background`/`background-dark`, fonts `font-poppins[-medium|-semibold|-bold|-black]`
- Dark mode: `dark:` variants work via `useTheme().setMode` (ThemeContext drives NativeWind's color scheme)
- Push notifications need a dev build (`npx expo run:android` / `eas build --profile development`) — not Expo Go
- `npm run lint` / `npm run typecheck` before committing
