import { Text } from "react-native";

export default function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 ml-1">
      {label}
    </Text>
  );
}
