import type { TranslationKey } from "./en";

const fil: Record<TranslationKey, string> = {
  // Home page
  "home.connecting": "Kumokonekta sa server...",
  "home.connected": "Konektado",
  "home.disconnected": "Nadiskonekta — kumokonekta ulit...",
  "home.blockageStatus": "POSIBLENG SAGABAL SA IBABAW",
  "home.waterLevelStatus": "ESTADO NG LEBEL NG TUBIG",
  "home.weatherCondition": "KONDISYON NG PANAHON",
  "home.clear": "Malinis",
  "home.possible": "Posible",
  "home.blocked": "Potensyal",
  "home.confidence": "Kumpiyansa",
  "home.confidence.clear": "Malinis",
  "home.confidence.possible": "Posible",
  "home.confidence.likely": "Malamang",
  "home.confidence.confirmed": "Kumpirmado",
  "home.changeRate": "Bilis ng Pagbabago",
  "home.toWarning": "Hanggang Babala",
  "home.toCritical": "Hanggang Kritikal",
  "home.aboveCritical": "Lampas sa Kritikal",
  "home.cmRemaining": "cm natitira",
  "home.cmOver": "cm lampas",
  "home.precipitation": "Presipitasyon",
  "home.lastUpdated": "Huling Na-update",
  "home.waterLevelTrend": "TREND NG LEBEL NG TUBIG (24H)",
  "home.errorLoadingData": "Hindi Ma-load ang Data",
  "home.frame.open": "Tingnan ang pinakabagong nakuhang larawan",
  "home.frame.title": "Pinakabagong larawan ng daluyan",
  "home.frame.captured": "Kinuha noong",
  "home.frame.close": "Isara ang pinakabagong larawan",
  "home.frame.alt": "Pinakabagong larawan ng ibabaw ng binabantayang daluyan",
  "home.frame.loading": "Kinukuha ang pinakabagong larawan…",
  "home.frame.empty": "Wala pang available na larawan mula sa camera.",
  "home.frame.error": "Hindi ma-load ang pinakabagong larawan.",
  "home.frame.disclaimer":
    "Ito ang pinakabagong snapshot at hindi live video. Nakikita lamang ng camera ang nakikitang ibabaw ng daluyan.",

  // Alerts page
  "alerts.noAlerts": "Walang alerto",
  "alerts.allCaughtUp":
    "Wala nang bagong alerto! Ang mga kritikal na alerto, babala, at anunsyo ay lalabas dito.",
  "alerts.noAlertsOfType":
    "Walang alerto ng ganitong uri. Subukang baguhin ang filter para makita ang iba pang alerto.",
  "alerts.fetchError": "Hindi ma-load ang mga alerto. Pakisubukang muli.",
  "alerts.acknowledged": "Kinilala",
  "alerts.unacknowledged": "Hindi pa kinilala",
  "alerts.pendingAcknowledgement": "NAGHIHINTAY NG PAGKILALA",
  "alerts.leaveMessage": "Mag-iwan ng mensahe (opsyonal)",
  "alerts.acknowledge": "Kilalanin",
  "alerts.claim": "Ako na",
  "alerts.claimedBy": "Kinuha ni {name}",
  "alerts.claimedByYou": "Kinuha mo",
  "alerts.claimUnavailable": "Kinuha na ng ibang responder",
  "alerts.claimFailed": "Hindi na-claim — tingnan ang koneksyon",
  "alerts.offlineBanner": "Offline — ipinapakita ang huling mga alerto",
  "alerts.placeholder": "Maglagay ng opsyonal na mensahe...",
  "alerts.notes": "MGA TALA",
  "alerts.all": "Lahat",
  "alerts.alarm": "Alarma",
  "alerts.critical": "Kritikal",
  "alerts.warning": "Babala",
  "alerts.announcement": "Anunsyo",
  "alerts.surfaceObstruction": "Sagabal sa Ibabaw",
  "alerts.loading": "Naglo-load...",
  "alerts.loadMore": "Mag-load pa",

  // Profile page
  "profile.responderProfile": "PROFILE NG RESPONDER",
  "profile.online": "Online",
  "profile.offline": "Offline",
  "profile.connecting": "Kumokonekta",
  "profile.reconnect": "Muling Kumonekta",
  "profile.pushNotifications": "MGA PUSH NOTIFICATION",
  "profile.warningAlerts": "Mga Babala",
  "profile.criticalAlerts": "Mga Kritikal na Alerto",
  "profile.blockageDetections": "Mga Alerto sa Sagabal sa Ibabaw",
  "profile.announcements": "Mga Anunsyo",
  "profile.language": "WIKA",
  "profile.appearance": "HITSURA",
  "profile.light": "Maliwanag",
  "profile.dark": "Madilim",
  "profile.system": "Sistema",
  "profile.account": "ACCOUNT",
  "profile.registered": "Narehistro",
  "profile.activated": "Na-activate",
  "profile.assignedSite": "Itinalagang Lugar",
  "profile.logout": "Mag-logout",
  "profile.editName": "Baguhin ang pangalan",
  "profile.firstName": "Pangalan",
  "profile.lastName": "Apelyido",
  "profile.save": "I-save",
  "profile.cancel": "Kanselahin",
  "profile.saving": "Sini-save...",
  "profile.phoneAdminOnly":
    "Makipag-ugnayan sa admin para baguhin ang numero ng telepono.",
  "profile.updateFailed": "Hindi nagawa. Pakisubukan muli.",
  "profile.nameRequired": "Kinakailangan ang pangalan at apelyido.",

  // Site picker (presence — which of my sites am I on)
  "site.section": "LOKASYON",
  "site.current": "Kasalukuyang lokasyon",
  "site.change": "Palitan ang lokasyon",
  "site.pickerTitle": "Nasaang lokasyon ka ngayon?",
  "site.home": "Pangunahing lokasyon",
  "site.deployment": "Naka-deploy",
  "site.switching": "Lilipat...",
  "site.switchFailed": "Hindi nagawa ang paglipat. Subukan muli.",

  // Push permission gate
  "push.title": "Kailangan ang Mga Notipikasyon",
  "push.subtitle":
    "Ipinapadala ng Patrol ang mga kritikal na alerto sa baha at posibleng sagabal sa ibabaw sa pamamagitan ng push notifications. Kailangan mo itong i-enable para magamit ang app.",
  "push.retryTitle": "Hindi natapos ang setup",
  "push.retrySubtitle":
    "Pinayagan mo na ang permission, pero hindi natapos ang pag-subscribe ng device na ito sa mga alerto.",
  "push.enableButton": "I-enable ang Mga Notipikasyon",
  "push.enabling": "Ini-enable...",
  "push.recheckButton": "Na-enable ko na — i-recheck",
  "push.retryButton": "Subukan muli",
  "push.deniedTitle": "Naka-disable ang mga notipikasyon",
  "push.deniedBody":
    "Tinanggihan mo dati ang mga notipikasyon. Hindi na ito itatanong muli ng app — kailangan mong i-enable sa settings ng device.",
  "push.iosSteps":
    "Sa iPhone: buksan ang Settings → Notifications → Patrol → i-on ang Allow Notifications.",
  "push.androidSteps":
    "Buksan ang Settings → Apps → Patrol → Notifications → i-on ang Allow notifications. Pagkatapos, balik dito at tapikin ang Recheck.",
  "push.unsupportedTitle": "Hindi suportado ang device",
  "push.unsupportedBody":
    "Hindi sinusuportahan ng device na ito ang push notifications. Hindi makapagpapadala ng alerto ang Patrol dito.",
  "push.errorVapid":
    "Hindi ma-load ang notification settings. Subukan muli sa ilang sandali.",
  "push.errorSubscribe":
    "May nangyaring mali sa pag-setup ng notipikasyon. Subukan muli.",
  "push.dndTitle": "Payagan ang alarma sa Do Not Disturb",
  "push.dndBody":
    "Puwedeng tumunog ang flood alarm ng Patrol kahit naka-Do Not Disturb, pero kailangan mo itong i-allow sa settings.",
  "push.dndEnable": "Payagan sa settings",
  "push.dndLater": "Huwag muna",
  "push.logoutButton": "Mag-logout",
  "profile.prefError": "Hindi ma-load ang mga notification preference",

  // Verify page
  "verify.activateAccount": "I-activate ang Iyong Account",
  "verify.activateSubtitle":
    "Ilagay ang iyong rehistradong numero ng cellphone para matanggap ang iyong access code",
  "verify.mobileNumber": "Numero ng Cellphone",
  "verify.fullNumber": "Buong numero:",
  "verify.continue": "Magpatuloy",
  "verify.enterCode": "Ilagay ang Verification Code",
  "verify.enterCodeSubtitle":
    "Nagpadala kami ng 6 na digit na code sa iyong cellphone. Ilagay ito sa ibaba para ma-verify ang iyong account.",
  "verify.verifying": "Bine-verify...",
  "verify.didntReceive": "Hindi natanggap ang code?",
  "verify.resend": "Ipadala ulit",
  "verify.sending": "Ipinapadala...",
  "verify.sendNewCode": "Magpadala ng bagong code",
  "verify.newCodeSent": "Naipadala na ang bagong verification code.",
  "verify.demoOtp": "Demo OTP",
  "verify.agreement":
    "Sa pag-verify, sumasang-ayon ka na makatanggap ng emergency SMS alerts mula sa AGOS Flood Monitoring System.",

  // Navigation
  "nav.home": "Home",
  "nav.alerts": "Mga Alerto",
  "nav.profile": "Profile",
};

export default fil;
