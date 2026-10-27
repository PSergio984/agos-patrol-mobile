import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import ErrorBoundary from "../../src/components/ErrorBoundary";
import {
  AlertsPageProvider,
  useAlertsPageHook,
} from "../../src/features/alerts/context/AlertsPageContext";
import Alerts from "../../src/features/alerts/Alerts";

// Push-tap deep link: NotificationContext routes dispatch-bearing
// notifications here with ?dispatchId=N. Resolve it to the responder's own
// delivery and open the detail sheet, then clear the param so refetches
// can't reopen a sheet the user already closed.
function AlertDeepLink() {
  const { dispatchId } = useLocalSearchParams<{ dispatchId?: string }>();
  const { openAlertByDispatchId } = useAlertsPageHook();

  useEffect(() => {
    const id = Number(dispatchId);
    if (!dispatchId || !Number.isFinite(id)) return;
    void openAlertByDispatchId(id);
    router.setParams({ dispatchId: undefined });
  }, [dispatchId, openAlertByDispatchId]);

  return null;
}

export default function AlertsScreen() {
  return (
    <ErrorBoundary>
      <AlertsPageProvider>
        <AlertDeepLink />
        <Alerts />
      </AlertsPageProvider>
    </ErrorBoundary>
  );
}
