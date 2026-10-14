import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { TriangleAlert } from "lucide-react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-6 bg-white dark:bg-slate-900">
          <View className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 mb-3">
            <TriangleAlert size={28} color="#ef4444" />
          </View>
          <Text className="text-base font-poppins-semibold text-gray-800 dark:text-gray-100 mb-1">
            Something went wrong
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
            An unexpected error occurred.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="px-4 py-2 rounded-lg bg-primary dark:bg-accent active:opacity-90"
          >
            <Text className="text-sm font-poppins-medium text-white">
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
