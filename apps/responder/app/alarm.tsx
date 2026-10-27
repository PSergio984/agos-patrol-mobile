import ErrorBoundary from "../src/components/ErrorBoundary";
import AlarmScreen from "../src/features/alarm/AlarmScreen";

// Alarm takeover route (#32). Registered on the root Stack (see _layout.tsx)
// as a full-screen modal — deliberately outside (tabs) so it covers the app.
export default function AlarmRoute() {
  return (
    <ErrorBoundary>
      <AlarmScreen />
    </ErrorBoundary>
  );
}
