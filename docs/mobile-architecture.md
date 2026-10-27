# agos-patrol — Native Mobile Architecture

**Status:** proposal · **Supersedes:** draft at `docs/research/emergency-mobile-stack-mesh-architecture.md` (corrected)
**Companions:** `docs/architecture.md` (current PWA), `docs/research/mobile-tech-stack.md` (stack-selection evidence)

---

## 1. Stack

**React Native + Expo (SDK 57+, dev builds / Continuous Native Generation).**

The managed workflow handles the app shell; dev builds + config plugins give access to the native APIs the PWA can't reach. Rationale and the 4-way comparison live in `docs/research/mobile-tech-stack.md` — short version: the fleet is already React/TS, and every alternative (Capacitor, Flutter, dual-native) either keeps a WebView ceiling or discards reuse.

**Library map:**

| Need                       | Package                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Push                       | `expo-notifications` → Expo Push Service (FCM/APNs)                                                                        |
| Alarm audio                | `expo-audio` (**not** `expo-av` — removed in SDK 55)                                                                       |
| Local DB / outbox          | `expo-sqlite` (WAL mode, FTS5)                                                                                             |
| Tokens / secrets           | `expo-secure-store`                                                                                                        |
| P2P mesh (Tier 2)          | `expo-nearby-connections` (small community lib — treat as dependency risk) or custom module over Google Nearby Connections |
| BLE (sensor link / Tier 3) | `react-native-ble-plx` via config plugin                                                                                   |
| UI system                  | NativeWind v4 (v5 is RC-only as of Oct 2026)                                                                               |
| Icons                      | `lucide-react-native`                                                                                                      |

---

## 2. Why the PWA can't carry emergency alerting

- **DND/silent bypass** — iOS requires the `critical-alerts` entitlement (Safari can't get it); Android requires an alarm-routed notification channel (Web Audio can't touch stream routing).
- **Wake + full-screen alert** — Android full-screen intent / iOS critical alert UI have no web equivalent; a PWA cannot surface over the lockscreen.
- **Background lifetime** — iOS purges PWA service workers; web background audio is blocked pending user gesture.
- **No radio access** — no BLE advertising, no Nearby Connections, no LoRa link from a browser.

---

## 3. Critical alarm & assignment pipeline

UX target: **ECBS-grade takeover alerts** — the phone blares a siren and surfaces a full-screen assignment dialog like an NDRRMC cell broadcast — achieved via push + native alarm APIs (we cannot send or intercept actual cell broadcasts; see §4).

```
agos-backend ──push──> Expo Push Service ──> FCM (high-priority data msg) / APNs
                                                    │
                        ┌───────────────────────────┼───────────────────────────┐
                        ▼ Android                   ▼ iOS                       ▼
              Notification channel           Critical Alerts entitlement   Local outbox write
              USAGE_ALARM + bypassDnd        (Apple approval required)     (ack/decline/reassign)
              + full-screen intent           custom siren @ vol 1.0        → sync on reconnect
              → alarm activity over          fallback: time-sensitive
              lockscreen, looping siren      notification
```

Android requirements — **all user-granted, none silent:**

| Requirement                                                 | Constraint                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IMPORTANCE_HIGH` channel, `USAGE_ALARM`, vibration pattern | Channel props immutable after creation — ship final config in v1                                                                                                                            |
| `setBypassDnd(true)`                                        | Only effective after user grants DND access via `ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS`                                                                                                |
| `USE_FULL_SCREEN_INTENT`                                    | Android 14+: restricted to alarm/calling categories; others need the user's "full-screen notifications" toggle (`NotificationManager.canUseFullScreenIntent()`) + Play review justification |

iOS: `com.apple.developer.usernotifications.critical-alerts` entitlement — **case-by-case Apple approval, not guaranteed, and not pursued** (decision: rely on the AlarmKit + out-of-band floor instead; reopen #5 if the NSE path dies). Floor without it: `time-sensitive` notifications (self-serve, breaks Focus, not the mute switch). Sound cap on critical alerts: 30s per push — no looping siren. **AlarmKit (iOS 26+)** is the persistent-alarm layer above it (verified ticket #21 — findings: `docs/research/alarmkit-push-alarms.md`): no entitlement or Apple approval — `NSAlarmKitUsageDescription` + one-time user opt-in; rings through silent mode and all Focus modes, survives force-quit/reboot, no sound cap (any physical button silences). No push-to-start exists for alarms; the only push-driven trigger is a Notification Service Extension — a `mutable-content` alert push launches the extension even force-quit, and it calls `AlarmManager.shared.schedule()` with a near-zero countdown (third-party-verified on iOS 26; undocumented → guideline-2.5.1 risk, best-effort only). **Shape:** one push carries a critical/time-sensitive alert + `mutable-content`; the NSE upgrades to an AlarmKit takeover when it can. **Out-of-band floor:** SMS/voice-call channel — the sender number saved as an Emergency-Bypass contact rings through silent/DND on any iOS version, zero Apple involvement (needs an SMS provider + per-responder setup). Constraints: widget extension required for countdown presentations, scheduling fails pre-first-unlock, Expo needs a config plugin for the NSE target.

**Backend changes** (`agos-backend`): `push_tokens` table (Expo tokens alongside existing VAPID subs — keep both, PWA coexists), extend `POST /push/subscribe` for `platform: "expo"`, add Expo-sender branch in `notification_service`. **Fix existing bug while there**: `send_push()` currently drops `data.type`/`data.url` — populate `type` so it can drive the Android channel and vibration mapping.

---

## 4. Emergency advisory modal ("NDRRMC" search)

NDRRMC alerts reach phones via **carrier cell broadcast** (RA 10639): no API to send, no API for a third-party app to receive them. So the modal **mirrors the source advisories**, not the broadcasts.

- **Backend ingest** (async poller — no Celery needed; verified ticket #2): **primary = PAGASA CAP feed** (`publicalert.pagasa.dost.gov.ph/feeds/` — official, WMO-registered CAP 1.2 XML, poll 5–10 min). Scrape layer: `pubfiles.pagasa.dost.gov.ph` dir listings (flood advisories/dam status PDFs), PHIVOLCS + NDRRMC sitreps (PDF only, slow cadence). GDACS/ReliefWeb as cross-checks. Apply for the token-gated PAGASA TenDay API early.
- Store `emergency_advisories` (`title`, `agency`, `hazard_type`, `severity`, `regions`, `issued_at`, `expires_at`, `raw_text`); search via Postgres `to_tsvector` → `GET /api/v1/advisories/search`.
- **App**: modal over cached data in `expo-sqlite` FTS5 — searchable with zero connectivity.

---

## 5. Offline resilience — three tiers

```
TIER 1  CLOUD          FastAPI + Expo Push — normal path
TIER 2  PHONE MESH     device↔device, ~10–100 m — Android-first
TIER 3  LoRa LINK      sensor node/pocket node → phone via BLE — 1–15 km, hardware project
```

**Offline-first core (both platforms):** all mutations write to a `mutation_outbox` table (`id`, `action`, `payload` JSON, `status: PENDING|PROPAGATED|SYNCED`, `created_at`) before any network attempt; a sync engine drains it on reconnect. This replaces the PWA's localStorage ack-queue.

**Tier 2 (realism check):**

- Android Nearby Connections works offline at usable range; `expo-nearby-connections` (28★, single maintainer) wraps it + Multipeer on iOS — viable but plan to fork/vendor it.
- **iOS cannot sustain a background mesh** — BLE advertising is foreground-limited and Multipeer has no background mode. Design Tier 2 as Android-first; iOS participates opportunistically in foreground.
- Protocol: epidemic/gossip exchange of outbox bundles (`alert_id`, priority, timestamp, hops) — store-and-forward as responders move between barangays.

**Tier 3 (future hardware phase):** LoRa transceiver on flood sensor stations + pocket nodes; app talks to the node over BLE (`react-native-ble-plx`), exactly the Meshtastic pattern. Sensors raise alarms across km without any cellular path.

---

## 6. Migration map

| Carries over (~40–50%)                                                                                                | Rewrites (~50%)                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/types/*`, axios client + interceptors, i18n dicts, WS context (RN has WebSocket), offline-queue algorithm, utils | All UI (~35 components + screens), navigation (`react-router` → `expo-router`), storage (`localStorage` → SecureStore/SQLite), `sw.js` push → `expo-notifications`, `navigator.vibrate`/`AudioContext` → `expo-haptics`/`expo-audio` |

```bash
npx create-expo-app agos-patrol-native --template blank-typescript
npx expo install expo-sqlite expo-notifications expo-audio expo-secure-store expo-haptics react-native-svg
```

---

## 7. Phases

1. **Alarm prototype** — dev build, Android alarm channel + FSI flow, iOS entitlement request submitted (lead time).
2. **Core port** — auth, water level, frames viewer, alerts feed, WS.
3. **Advisory modal** — backend ingest spike _first_ (verify real feeds), then FTS5-cached search modal.
4. **Offline & mesh** — outbox + sync engine; Android Nearby sync; evaluate LoRa node link.

## Sources

Expo docs (`docs.expo.dev` — SDK versions, notifications, sqlite, audio, av-deprecation notice), Android docs (`NotificationChannel`, `USE_FULL_SCREEN_INTENT` Android 14 restriction, cell broadcast receiver privileges — AOSP `SmsCbMessage`), Apple entitlement docs, RA 10639 IRR (NDRRMC↔telco portal flow), `expo-nearby-connections` repo, `expo-av` archive notice. Detailed citations in `docs/research/mobile-tech-stack.md`.
