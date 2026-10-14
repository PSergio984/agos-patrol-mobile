import { Text } from "react-native";

export default function CardTitle({ title }: { title: string }) {
  return (
    <Text className="text-gray-500 dark:text-gray-400 font-semibold text-sm">
      {title}
    </Text>
  );
}
