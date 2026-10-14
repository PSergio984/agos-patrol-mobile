import { AlertsPageProvider } from "../../src/features/alerts/context/AlertsPageContext";
import Alerts from "../../src/features/alerts/Alerts";

export default function AlertsScreen() {
  return (
    <AlertsPageProvider>
      <Alerts />
    </AlertsPageProvider>
  );
}
