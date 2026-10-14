import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import CardTitle from "./CardTitle";

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
      style={[styles.shadow, style]}
    >
      {headerTitle && <CardTitle title={headerTitle} />}
      {children}
    </View>
  );
}

// PWA `.custom-shadow`: box-shadow 0 0 5px rgba(0,0,0,0.15)
const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
});
