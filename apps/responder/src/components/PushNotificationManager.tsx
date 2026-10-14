import PushPermissionGate from "./PushPermissionGate";

/**
 * Drives push-notification subscription for the whole authenticated session.
 * Mounted once in the (tabs) layout. Renders a blocking modal until the
 * responder has an active push subscription — alerts are life-safety, so
 * the app is unusable without them.
 */
export default function PushNotificationManager() {
  return <PushPermissionGate />;
}
