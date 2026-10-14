import ErrorBoundary from "../../src/components/ErrorBoundary";
import { AlertsPageProvider } from "../../src/features/alerts/context/AlertsPageContext";
import Alerts from "../../src/features/alerts/Alerts";

export default function AlertsScreen() {
  return (
    <ErrorBoundary>
      <AlertsPageProvider>
        <Alerts />
      </AlertsPageProvider>
    </ErrorBoundary>
  );
}
