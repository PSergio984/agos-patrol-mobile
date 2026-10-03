# Citizen App — Feature Spec (external reference)

Feature-level spec of a Philippine flood-monitoring citizen app, extracted for the future AGOS citizen app. **Responder app is out of scope here** — this informs the separate citizen effort and which backend endpoints it would need.

Stack observed in the reference: Flutter client, JWT auth, versioned REST API (`/v1`, `/v2`), FCM push tokens + local notifications, OSM-based maps, connectivity-aware offline UI.

---

## Auth & accounts

- Phone-OTP request/verify flow (`auth/request-phone-otp`, `auth/verify-phone-otp`) — same pattern as agos-patrol's responder OTP
- Password accounts: register, login, logout, forgot-password via OTP (`forgot_password/request|check_otp|verify`)
- Profile: `users/{id}/profile` read/update
- Device tokens registered per user: `users/{id}/device_tokens` (FCM)

## Evacuation

### Evacuation centers

- List endpoint `evacuation_sites`; center model: `id`, `name`, `address`, `evacuation_image_url`, `latitude`, `longitude`, `max_capacity`, `current_occupancy_family`, `current_occupancy_individual`, `is_active`, `is_full`
- Dedicated **evacuation map page** — centers on a map with capacity/fullness state

### Evacuation requests (citizen-initiated) — _the key feature_

- `GET my_evacuation_request` → latest pending/accepted request for the caller
- `POST request_evacuation` — **multipart/form-data** with:
  - `latitude`, `longitude`, `note`
  - **Household counts** (10 fields): adults/minors/toddlers/infants/seniors × male/female
  - **Health conditions**: `lactating_count`, `pregnant_count`, `injured_count`, `pwd_count`, `pwd_type_spec`
  - `additional_info`, optional `proof_image` (file upload)
- Lifecycle: pending → accepted/dispatched (responder side would triage these)

## Flood reports (citizen-submitted)

- `POST submit_flood_report` — photo (`image_picker`) + location + description
- `GET my_flood_reports` — own report history page
- `GET flood_reports_public` — public feed of all reports ("all flood reports" page)
- Report detail dialog: image, location, status

## Community status

- `GET get_community_status` + `POST cast_safety_status_vote` — per-user "I'm safe / I need help"-style status voting, aggregated to community view

## Sensors & weather (read-only mirrors of the responder data)

- `GET sensors`, `GET sensor_hydrograph[/{id}]` — sensor list + per-sensor detail page + hydrograph/forecast charts (`fl_chart`-equivalent)
- `GET weather` — weather card
- Site overview map page — all sensors on map
- Sensor pulse markers on map widgets

## Notifications

- `GET notifications/mobile`, `POST notifications/mobile/read-bulk`, `read-ids` — in-app notification inbox + read state
- FCM push + `flutter_local_notifications`-equivalent local presentation layer

## Hotlines

- `GET user_hotline` — user-facing hotline list page
- `POST add_local_hotline`, `DELETE delete_local_hotline/{id}` — user can save custom local hotlines

## Offline/UX infrastructure

- Connectivity wrapper widget: app-wide offline banner/state
- Skeleton loaders per page; secure-storage token persistence

---

## Gap map vs agos-backend

| Feature                 | Backend status                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| Evacuation centers      | ✅ exists (`/evacuation-center` CRUD — needs `is_full`/occupancy fields check) |
| Evacuation route        | ✅ exists (`/public/evacuation-route`)                                         |
| Evacuation **requests** | ❌ missing — new endpoint + model + admin triage UI                            |
| Flood reports           | ⚠️ partial — `reading_report` model exists; no citizen submit/list endpoints   |
| Hotlines                | ❌ missing                                                                     |
| Community status votes  | ❌ missing — `citizen_subscription` model hints at groundwork                  |
| Notifications inbox     | ⚠️ partial — `notification_dispatch`/delivery models exist                     |
| Citizen auth            | ❌ missing — responder OTP exists; citizens need own account model             |
| FCM token registry      | ❌ missing — `push_tokens` table planned for Expo covers this                  |

---

## Addendum: deployed citizen PWA recon (agos-advisory.vercel.app)

A live citizen PWA already exists on the same backend — anonymous, no auth. Recon via manifest/SW/bundle (Oct 2026):

- **Stack**: Vite+React+vite-plugin-pwa on Vercel; MapLibre GL for maps; custom `push-sw.js` for citizen web-push
- **Routes**: `/welcome` (onboarding) · `/install` · `/status` · `/alerts` · `/map` · `/info` · `/settings`
- **Endpoints consumed** (all in agos-backend): `/push/vapid-public-key`, `/push/subscribe-citizen`, `/core/public/location-details`, `/public/status`, `/evacuation/public/alerts`, `/public/evacuation-route`, `/stream/latest-frame`, WS `/ws?location_id=`
- **Features**: flood status w/ guidance, rainfall+water metrics, surface condition, latest camera frame, evac-center map (open/full/closed + capacity + routing), public alerts feed, before/during/after flood guides, LGU hotlines, language toggle, privacy
- **Implication**: backend support for a citizen app is ~complete already — a native citizen app is a pure-frontend build against existing endpoints
