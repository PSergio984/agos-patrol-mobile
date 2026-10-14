import { ScrollView } from "react-native";
import AccountDetails from "./components/AccountDetails";
import LanguageToggle from "./components/LanguageToggle";
import Logout from "./components/Logout";
import MainDetails from "./components/MainDetails";
import PushNotifications from "./components/PushNotifications";
import ThemeToggle from "./components/ThemeToggle";

/**
 * Port of PWA src/pages/Profile/Profile.tsx (Page: p-4, space-y-5).
 * Sections render in PWA order; ConnectionStatus is embedded inside
 * MainDetails, exactly like the source.
 */
export default function ProfileScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="p-4 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      <MainDetails />
      <PushNotifications />
      <LanguageToggle />
      <ThemeToggle />
      <AccountDetails />
      <Logout />
    </ScrollView>
  );
}
