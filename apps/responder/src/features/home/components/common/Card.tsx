import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import CardTitle from "./CardTitle";
import { cardShadow } from "../../../../styles/shadow";

type Props = {
  children: ReactNode;
  headerTitle?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export default function Card({
  children,
  headerTitle,
  className,
  style,
}: Props) {
  return (
    <View
      className={`rounded-xl bg-white dark:bg-slate-800 dark:border dark:border-slate-700 px-4 py-5 ${className || ""}`}
      style={[cardShadow, style]}
    >
      {headerTitle && <CardTitle title={headerTitle} />}
      {children}
    </View>
  );
}
