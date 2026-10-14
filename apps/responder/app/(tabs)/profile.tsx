import ErrorBoundary from "../../src/components/ErrorBoundary";
import ProfileScreen from "../../src/features/profile/ProfileScreen";

export default function Profile() {
  return (
    <ErrorBoundary>
      <ProfileScreen />
    </ErrorBoundary>
  );
}
