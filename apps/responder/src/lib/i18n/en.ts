const en = {
  // Home page
  "home.connecting": "Connecting to server...",
  "home.connected": "Connected",
  "home.disconnected": "Disconnected — reconnecting...",
  "home.blockageStatus": "POTENTIAL SURFACE OBSTRUCTION",
  "home.waterLevelStatus": "WATER LEVEL STATUS",
  "home.weatherCondition": "WEATHER CONDITION",
  "home.clear": "Clear",
  "home.possible": "Possible",
  "home.blocked": "Potential",
  "home.confidence": "Confidence",
  "home.confidence.clear": "Clear",
  "home.confidence.possible": "Possible",
  "home.confidence.likely": "Likely",
  "home.confidence.confirmed": "Confirmed",
  "home.changeRate": "Change Rate",
  "home.toWarning": "To Warning",
  "home.toCritical": "To Critical",
  "home.aboveCritical": "Above Critical",
  "home.cmRemaining": "cm remaining",
  "home.cmOver": "cm over",
  "home.precipitation": "Precipitation",
  "home.lastUpdated": "Last Updated",
  "home.waterLevelTrend": "WATER LEVEL TREND (24H)",
  "home.errorLoadingData": "Error Loading Data",
  "home.frame.open": "View latest captured image",
  "home.frame.title": "Latest waterway frame",
  "home.frame.captured": "Captured",
  "home.frame.close": "Close latest frame",
  "home.frame.alt": "Latest camera frame of the monitored waterway surface",
  "home.frame.loading": "Loading the latest frame…",
  "home.frame.empty": "No camera frame is available yet.",
  "home.frame.error": "The latest frame could not be loaded.",
  "home.frame.disclaimer":
    "This is the latest available snapshot, not live video. The camera shows only the visible waterway surface.",

  // Alerts page
  "alerts.noAlerts": "No alerts",
  "alerts.allCaughtUp":
    "You're all caught up! New critical alerts, warnings, and announcements will appear here.",
  "alerts.noAlertsOfType":
    "No alerts of this type. Try changing the filter to see more alerts.",
  "alerts.fetchError": "Failed to fetch alerts. Please try again.",
  "alerts.acknowledged": "Acknowledged",
  "alerts.unacknowledged": "Unacknowledged",
  "alerts.pendingAcknowledgement": "PENDING ACKNOWLEDGEMENT",
  "alerts.leaveMessage": "Leave a message (optional)",
  "alerts.acknowledge": "Acknowledge",
  "alerts.placeholder": "Enter optional acknowledgment message...",
  "alerts.notes": "NOTES",
  "alerts.all": "All",
  "alerts.critical": "Critical",
  "alerts.warning": "Warning",
  "alerts.announcement": "Announcement",
  "alerts.surfaceObstruction": "Surface Obstruction",
  "alerts.loading": "Loading...",
  "alerts.loadMore": "Load more",

  // Profile page
  "profile.responderProfile": "RESPONDER PROFILE",
  "profile.online": "Online",
  "profile.offline": "Offline",
  "profile.connecting": "Connecting",
  "profile.reconnect": "Reconnect",
  "profile.pushNotifications": "PUSH NOTIFICATIONS",
  "profile.warningAlerts": "Warning Alerts",
  "profile.criticalAlerts": "Critical Alerts",
  "profile.blockageDetections": "Surface Obstruction Alerts",
  "profile.announcements": "Announcements",
  "profile.language": "LANGUAGE",
  "profile.appearance": "APPEARANCE",
  "profile.light": "Light",
  "profile.dark": "Dark",
  "profile.system": "System",
  "profile.account": "ACCOUNT",
  "profile.registered": "Registered",
  "profile.activated": "Activated",
  "profile.assignedSite": "Assigned Site",
  "profile.logout": "Logout",
  "profile.editName": "Edit name",
  "profile.firstName": "First name",
  "profile.lastName": "Last name",
  "profile.save": "Save",
  "profile.cancel": "Cancel",
  "profile.saving": "Saving...",
  "profile.phoneAdminOnly": "Contact an admin to change your phone number.",
  "profile.updateFailed": "Failed to update. Please try again.",
  "profile.nameRequired": "First and last name are required.",

  // Push permission gate
  "push.title": "Notifications Required",
  "push.subtitle":
    "Patrol sends critical flood and potential surface-obstruction alerts via push notifications. You must enable them to use this app.",
  "push.retryTitle": "Setup didn't complete",
  "push.retrySubtitle":
    "Your permission is granted, but we couldn't finish subscribing this device to alerts.",
  "push.enableButton": "Enable Notifications",
  "push.enabling": "Enabling...",
  "push.recheckButton": "I've enabled it — recheck",
  "push.retryButton": "Retry",
  "push.deniedTitle": "Notifications are disabled",
  "push.deniedBody":
    "You previously denied notifications. The app will not ask again — you need to enable them in your device settings.",
  "push.iosSteps":
    "On iPhone: open Settings → Notifications → Patrol → turn on Allow Notifications.",
  "push.androidSteps":
    "Open Settings → Apps → Patrol → Notifications → turn on Allow notifications. Then return here and tap Recheck.",
  "push.unsupportedTitle": "Device not supported",
  "push.unsupportedBody":
    "This device does not support push notifications. Patrol cannot deliver alerts here.",
  "push.errorVapid":
    "Could not load notification settings. Try again in a moment.",
  "push.errorSubscribe":
    "Something went wrong while setting up notifications. Please retry.",
  "push.logoutButton": "Log out",
  "profile.prefError": "Failed to fetch notification preferences",

  // Verify page
  "verify.activateAccount": "Activate Your Account",
  "verify.activateSubtitle":
    "Enter your registered mobile number to receive your access code",
  "verify.mobileNumber": "Mobile Number",
  "verify.fullNumber": "Full number:",
  "verify.continue": "Continue",
  "verify.enterCode": "Enter Verification Code",
  "verify.enterCodeSubtitle":
    "We sent a 6-digit code to your phone number. Enter it below to verify your account.",
  "verify.verifying": "Verifying...",
  "verify.didntReceive": "Didn't receive the code?",
  "verify.resend": "Resend",
  "verify.sending": "Sending...",
  "verify.sendNewCode": "Send new code",
  "verify.newCodeSent": "A new verification code has been sent.",
  "verify.demoOtp": "Demo OTP",
  "verify.agreement":
    "By verifying, you agree to receive emergency SMS alerts from AGOS Flood Monitoring System.",

  // Navigation
  "nav.home": "Home",
  "nav.alerts": "Alerts",
  "nav.profile": "Profile",
} as const;

export type TranslationKey = keyof typeof en;
export default en;
