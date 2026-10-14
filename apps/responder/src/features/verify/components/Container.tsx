import type { ReactNode } from "react";
import { Image, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { cardShadow } from "../../../styles/shadow";

interface ContainerProps {
  headerTitle: string;
  headerSubtitle: string;
  children: ReactNode;
}

/**
 * Port of PWA src/pages/Verify/components/Container.tsx.
 * `custom-shadow` (0 0 5px, rgba(0,0,0,0.15) / 0.4 dark) maps to RN shadow
 * props + Android elevation. Logo uses the app's assets/patrol.png at w-12
 * (PWA renders /patrol.svg at w-12 with intrinsic square aspect).
 */
export default function Container({
  headerTitle,
  headerSubtitle,
  children,
}: ContainerProps) {
  const { colorScheme } = useColorScheme();

  return (
    <View
      className="rounded-xl overflow-hidden px-5 py-10 relative bg-white dark:bg-slate-800 dark:border dark:border-slate-700"
      style={{
        ...cardShadow,
        // Verify card overrides the shared shadow: stronger in dark mode
        shadowOpacity: colorScheme === "dark" ? 0.4 : 0.15,
        elevation: 3,
      }}
    >
      <View className="h-1.5 bg-primary dark:bg-accent absolute top-0 left-0 right-0" />

      <View className="items-center">
        <Image
          source={require("../../../../assets/patrol.png")}
          className="w-12 h-12"
          resizeMode="contain"
          accessibilityLabel="Patrol"
        />
        <Text className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">
          {headerTitle}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
          {headerSubtitle}
        </Text>
      </View>

      <View>{children}</View>
    </View>
  );
}
