import ErrorBoundary from "../../src/components/ErrorBoundary";
import Home from "../../src/features/home";

export default function HomeScreen() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}
