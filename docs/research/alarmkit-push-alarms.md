# AlarmKit Push-Triggered Alarms Research — agos-patrol

Date: October 2026. Audience: solo dev planning the post-v1 "ECBS-grade takeover alarm" phase (wayfinder ticket #21). Scope: can a remote push create/trigger a persistent AlarmKit alarm on iOS 26+ without the user opening the app, and can AlarmKit replace or complement the already-decided Critical Alerts fallback (ticket #3).

## Recommendation

**AlarmKit alone cannot be *reliably* push-triggered, so it complements Critical Alerts rather than replacing them.** The only path that demonstrably works is a **Notification Service Extension (NSE)**: an alert push with `mutable-content: 1` launches the extension even while the host app is force-quit, and `AlarmManager.shared.schedule()` called inside it with a near-zero countdown fires a full AlarmKit takeover a second or two later — experimentally verified on iOS 26, but **undocumented** and carrying App Review "intended purposes" risk. Apple's own positioning in the WWDC session is that alarms are "not a replacement for other prominent notifications, like critical alerts." The practical design is one APNs payload that is **both** a critical alert (guaranteed sound, blessed entitlement path) **and** `mutable-content` (NSE upgrades it into a persistent AlarmKit alarm as a best-effort escalation layer).

Every other push channel fails at the scheduling step: normal alert pushes run no app code; silent pushes are throttled, unguaranteed, and *never delivered after a user force-quit*; VoIP pushes can relaunch a killed app but are CallKit-gated to VoIP apps; and ActivityKit push-to-start applies to Live Activities, not alarms — `AlarmManager` exposes no push-token surface. Once scheduled, though, alarms are fully system-owned: they fire through silent mode and *all* Focus modes, survive force-quit/reboot/crash, and ring until physically dismissed — well past the 30-second sound cap of Critical Alerts.

---

## AlarmKit availability & scheduling surface (verified)

| Fact | Detail | Source |
| ---- | ------ | ------ |
| Availability | **iOS / iPadOS 26.0+, macCatalyst 26.0+**, Xcode 26. No back-port | [AlarmKit framework](https://developer.apple.com/documentation/alarmkit) |
| Scheduling API | `try await AlarmManager.shared.schedule(id:configuration:)` — a local call; some process must be executing code to invoke it | [AlarmManager](https://developer.apple.com/documentation/alarmkit/alarmmanager) |
| Alarm storage | Alarms live in a system daemon: `alarms` "fetches all alarms from the daemon that belong to the current client" | [AlarmManager.alarms](https://developer.apple.com/documentation/alarmkit/alarmmanager) |
| Near-instant firing | `preAlert` countdown accepts small values (docs example: `preAlert: 10` seconds); `timer(duration:…)` "starts immediately, runs for `duration` seconds, and then alerts" | [Alarm.CountdownDuration](https://developer.apple.com/documentation/alarmkit/alarm/countdownduration-swift.struct), [timer(duration:…)](https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmconfiguration/timer(duration:attributes:appentityidentifier:stopintent:secondaryintent:sound:)) |
| First-unlock gate | AlarmConfiguration "is only available after first unlock" — scheduling fails between reboot and first unlock | [AlarmConfiguration](https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmconfiguration) |
| Concurrency cap | No fixed limit, but the device "may impose a limit"; excess scheduling throws `maximumLimitReached` | [Apple AlarmKit FAQ](https://developer.apple.com/forums/thread/797158), [AlarmError](https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmerror) |

## (a) Can a push trigger it? Channel-by-channel

| Push channel | Runs code to call `schedule()`? | Verdict | Source |
| ------------ | ------------------------------- | ------- | ------ |
| Standard alert push | **No** — displayed by the system; app code runs only if the user taps | ❌ Dead end | [Generating a remote notification](https://developer.apple.com/documentation/usernotifications/generating-a-remote-notification) |
| Silent push (`content-available`) | Yes — wakes app in background, ~30 s execution window — **but** low priority, delivery unguaranteed, throttled (~2–3/hr), held pushes discarded on kill, and "the system does not automatically launch your app if the user has force-quit it" | ⚠️ Works only if app is merely suspended; **dead after force-quit** | [Pushing background updates](https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app), [didReceiveRemoteNotification](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/application(_:didreceiveremotenotification:fetchcompletionhandler:)), [Apple DTS forum 773841](https://developer.apple.com/forums/thread/773841) |
| BGTaskScheduler | System-discretionary scheduling, same force-quit/relaunch limits | ❌ Not real-time, same killed-state wall | [didReceiveRemoteNotification](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/application(_:didreceiveremotenotification:fetchcompletionhandler:)) |
| VoIP push (PushKit) | **Yes** — "wakes up or launch your app," even after force-quit — **but** iOS 13+ requires CallKit for every VoIP push; "if you are unable to support CallKit in your app, you cannot use PushKit"; App Review 2.5.4 limits background modes to intended purposes | ❌ Rejection bait for a non-VoIP app | [PushKit](https://developer.apple.com/documentation/pushkit), [Responding to VoIP notifications](https://developer.apple.com/documentation/pushkit/responding-to-voip-notifications-from-pushkit), [App Review 2.5.4](https://developer.apple.com/app-store/review/guidelines/) |
| ActivityKit push-to-start | Push-to-start tokens exist for **Live Activities** (`Activity.pushToStartTokenUpdates`, iOS 17.2+, `event:"start"`). AlarmKit alarms are `Alarm` objects managed by the alarm daemon — `AlarmManager` has no push-token or push-initiated API. AlarmKit *renders* via ActivityKit, but its lifecycle is daemon-owned | ❌ **No push-to-start for alarms exists** | [Starting/updating Live Activities with push](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications), [AlarmManager API surface](https://developer.apple.com/documentation/alarmkit/alarmmanager) |
| **Notification Service Extension** (`mutable-content: 1`) | **Yes** — the extension "is launched on demand when the system delivers a notification of the appropriate type," a separate process independent of host-app state (the force-quit relaunch restriction applies to the app, not extensions). Verified experimentally: `AlarmManager.shared.schedule()` inside an NSE fires an alarm "for right now," incl. a custom sound downloaded mid-flight (Jacob Bartlett's UltraPing probe, iOS 26). Caveat: NSE cannot intercept *silent* pushes — payload must be a visible alert | ✅ **Works — undocumented** | [UNNotificationServiceExtension](https://developer.apple.com/documentation/usernotifications/unnotificationserviceextension), [Jacob's Tech Tavern experiment](https://blog.jacobstechtavern.com/p/apps-system-design) |

Notes on the NSE path's constraints: the extension gets a "limited amount of time" before `serviceExtensionTimeWillExpire()` terminates it (enough for one `schedule()` call); the push must already be a visible alert; alarm authorization must have been granted *previously* in the app (an NSE can't run the onboarding prompt — `requestAuthorization` only prompts "if it hasn't been requested before"); and post-reboot scheduling fails until first unlock.

## (b) Entitlement & approval requirements

| Requirement | AlarmKit | Critical Alerts |
| ----------- | -------- | --------------- |
| Apple approval | **None** — no entitlement exists (the `com.apple.developer.alarmkit` key is a known LLM hallucination; declaring it fails provisioning, and Apple documents no such entitlement) | **Case-by-case entitlement** `com.apple.developer.usernotifications.critical-alerts`, granted via request form | 
| Config key | `NSAlarmKitUsageDescription` in `Info.plist`; missing/empty key means "apps can't schedule alarms" | Entitlement in `.entitlements` + `UNAuthorizationOptions.criticalAlert` |
| User consent | Runtime `requestAuthorization()` prompt; auto-prompted on first `schedule()`; revocable in Settings anytime | Same model, separate permission |
| Sources | [Scheduling an alarm with AlarmKit](https://developer.apple.com/documentation/alarmkit/scheduling-an-alarm-with-alarmkit), [WWDC25-230](https://developer.apple.com/videos/play/wwdc2025/230/), [entitlement 404 / nonexistence report](https://ltng.jp/keyalarm/blog/alarmkit-entitlement) | [Critical Alerts entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.usernotifications.critical-alerts) |

Extra gates from Apple's [AlarmKit FAQ](https://developer.apple.com/forums/thread/797158): alarms from **hidden or passcode-required apps "silently fail"**; an app supporting countdown presentations **must ship a widget extension** or "the system may unexpectedly dismiss alarms and fail to alert" ([Scheduling doc](https://developer.apple.com/documentation/alarmkit/scheduling-an-alarm-with-alarmkit)).

## (c) UX / presentation limits

| Property | AlarmKit alarm | Critical alert |
| -------- | -------------- | -------------- |
| Silent mode / mute switch | Breaks through | Breaks through |
| Focus / DND | Breaks through **all** Focus modes (FAQ Q5) | Breaks through (entitlement doc) |
| Presentation | Full-screen alert on Lock Screen + Dynamic Island + StandBy + paired Apple Watch; optional countdown/paused Live Activity (widget extension) | Standard notification banner (critical style) |
| Sound | `AlertConfiguration.AlertSound` — `.default` or `.named` custom file in main bundle or `Library/Sounds` of the app's container; **no documented duration cap** — the alert keeps sounding until stopped | Custom `UNNotificationSound`, **must be < 30 s** or the default sound plays; volume adjustable |
| Persistence | Rings until user acts — stop/snooze buttons, or **any physical button dismisses all alerting alarms** (FAQ Q7/Q8) | ~30 s max, then silent |
| Overlap | Multiple apps' simultaneous alarms: winner "non-deterministic" (FAQ Q6) | n/a — multiple notifications coexist |
| Sources | [AlarmKit FAQ](https://developer.apple.com/forums/thread/797158), [WWDC25-230](https://developer.apple.com/videos/play/wwdc2025/230/), [AlertSound](https://developer.apple.com/documentation/activitykit/alertconfiguration/alertsound) | [UNNotificationSound](https://developer.apple.com/documentation/usernotifications/unnotificationsound), [Critical Alerts entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.usernotifications.critical-alerts) |

## (d) Force-quit behavior

Two different questions — this is where the ticket's framing matters:

- **Firing:** "Yes, all alarms are expected to persist regardless of app or device state changes, once they are successfully scheduled" — including reboot, force-quit, and crash (FAQ Q2). Dismissal runs the configured `stopIntent` App Intent even if the app is dead (FAQ Q4).
- **Scheduling:** the app must execute `schedule()` somewhere. After force-quit, the *app process* cannot be relaunched by silent push (per the UIApplicationDelegate doc) — but an **NSE still launches** on each eligible alert push, which is why the NSE route is the only push-driven path that survives force-quit.

## (e) Version requirements

iOS/iPadOS **26.0+**, macCatalyst 26.0+, Xcode 26. API drift to note for implementation: `stopButton` on `AlarmPresentation.Alert` is **deprecated** (system supplies the stop control); `appEntityIdentifier` binding is iOS 27+. Deployment target iOS 26 excludes older devices — AGOS responders on iOS 18–25 still need the Critical Alerts path regardless, making AlarmKit strictly an enhancement layer.

## (f) Verdict vs the Critical Alerts fallback (ticket #3)

- **Replace? No.** Apple: alarms "are not a replacement for other prominent notifications, like critical alerts" ([WWDC25-230](https://developer.apple.com/videos/play/wwdc2025/230/)). Critical Alerts remains the only *sanctioned* channel that guarantees an interrupting sound purely from an APNs payload, on iOS < 26 too.
- **Complement? Yes — this is the recommended shape.** Apple DTS told an emergency-alert app seeking exactly our "rings until acknowledged" UX that the behavior "is not currently supported in the UserNotifications framework" and "AlarmKit would be a better fit" ([forum 833511](https://developer.apple.com/forums/thread/833511)). AlarmKit delivers what Critical Alerts structurally cannot: unbounded ring time and lockscreen takeover.
- **Concrete architecture:** one APNs push carrying both `mutable-content: 1` and a critical-alert payload. The NSE (new native target, not provided by `expo-notifications` — needs a config plugin / prebuild Swift) calls `AlarmManager.shared.schedule()` with `preAlert ≈ 1 s`. If AlarmKit authorization/scheduling fails (denied, pre-first-unlock, hidden-app state, `maximumLimitReached`), the critical alert still fired — graceful degradation for free. `postAlert` + `.countdown` secondary button gives responder-controlled re-ringing.
- **Honest risk statement:** the NSE→AlarmKit path is experimentally proven but undocumented. App Review guideline 2.5.1 requires using frameworks "for their intended purposes"; scheduling an alarm off a push is a gray zone, and Apple could close the capability in any iOS update — hence keeping the critical alert payload as the guaranteed floor.

## Risks & trade-offs

1. **Undocumented API usage (NSE scheduling)** — works today on iOS 26, verified by independent developers; no Apple documentation blesses or forbids it. Mitigate by treating it as best-effort escalation, never the sole channel.
2. **Force-quit asymmetry** — *scheduled* alarms are force-quit-proof (FAQ Q2), but *push-triggered scheduling* after force-quit relies solely on the NSE path; a user who habitually force-quits still gets the alarm because the extension is a separate process the system launches per notification.
3. **Physical-button dismissal** — any physical button stops *all* alerting alarms (FAQ Q7/Q8). An ECBS-grade alarm can be silenced by a pocket press; design the responder UX so acknowledgment in-app is the tracked action, not silence.
4. **Overlap nondeterminism** — if another AlarmKit app alerts at the same moment, which alarm wins is undefined (FAQ Q6); the critical alert still lands underneath.
5. **Pre-first-unlock dead zone** — scheduling "only available after first unlock"; a reboot-then-flood window yields NSE scheduling failure → critical alert fallback covers it.
6. **Rate/resource caps** — `maximumLimitReached` exists; keep at most one live "emergency" alarm and `cancel(id:)` stale ones.
7. **Hidden/passcode-required apps** — alarms silently fail; irrelevant for AGOS (we won't hide the app) but explains edge reports.
8. **Push delivery is still the weak link** — nothing in AlarmKit changes APNs best-effort delivery; the alarm upgrade only helps *after* a notification reaches the device. Critical alerts get priority APNs handling, so basing the trigger on the alert push (not silent push) also rides the most reliable push class.

## Sources

- AlarmKit framework + availability: https://developer.apple.com/documentation/alarmkit · AlarmManager (schedule/alarms/authorization): https://developer.apple.com/documentation/alarmkit/alarmmanager · schedule(): https://developer.apple.com/documentation/alarmkit/alarmmanager/schedule(id:configuration:) · AlarmError.maximumLimitReached: https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmerror
- Scheduling walkthrough (Info.plist key, widget-extension requirement, watch forwarding): https://developer.apple.com/documentation/alarmkit/scheduling-an-alarm-with-alarmkit
- AlarmConfiguration ("only available after first unlock", init/factories): https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmconfiguration · CountdownDuration: https://developer.apple.com/documentation/alarmkit/alarm/countdownduration-swift.struct · timer() discussion: https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmconfiguration/timer(duration:attributes:appentityidentifier:stopintent:secondaryintent:sound:)
- WWDC25 session 230 "Wake up to the AlarmKit API" (breakthrough behavior, authorization flow, "not a replacement for critical alerts"): https://developer.apple.com/videos/play/wwdc2025/230/
- Apple DTS AlarmKit FAQ (persistence across reboot/force-quit, all-Focus breakthrough, physical-button dismissal, overlap nondeterminism, hidden-app silent failure, alarm limit): https://developer.apple.com/forums/thread/797158
- Apple DTS answer recommending AlarmKit for persistent emergency alarms (UserNotifications can't do it): https://developer.apple.com/forums/thread/833511
- Silent/background push limits + force-quit: https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app · https://developer.apple.com/documentation/uikit/uiapplicationdelegate/application(_:didreceiveremotenotification:fetchcompletionhandler:) · Apple DTS confirmation "will not wake a swiped-away app": https://developer.apple.com/forums/thread/773841
- UNNotificationServiceExtension (mutable-content, on-demand launch, no silent-push access, time limit): https://developer.apple.com/documentation/usernotifications/unnotificationserviceextension
- ActivityKit push-to-start (Live Activities only): https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications
- PushKit VoIP push + mandatory CallKit: https://developer.apple.com/documentation/pushkit · https://developer.apple.com/documentation/pushkit/responding-to-voip-notifications-from-pushkit
- Critical Alerts entitlement (request form, muted/DND bypass): https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.usernotifications.critical-alerts · 30 s sound cap: https://developer.apple.com/documentation/usernotifications/unnotificationsound
- App Review Guidelines (2.5.1 intended purposes, 2.5.4 background modes, 4.5.4 push rules): https://developer.apple.com/app-store/review/guidelines/
- Experimental verification of NSE→AlarmKit scheduling (non-Apple, flagged): https://blog.jacobstechtavern.com/p/apps-system-design
- `com.apple.developer.alarmkit` entitlement nonexistence (community + provisioning evidence): https://ltng.jp/keyalarm/blog/alarmkit-entitlement
