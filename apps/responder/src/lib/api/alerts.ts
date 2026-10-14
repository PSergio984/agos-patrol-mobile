// Alias shim — the canonical module is ./alert (matches the PWA file name).
// Some feature code imports "@/lib/api/alerts"; keep both paths working.
export { alertsAPI } from "./alert";
