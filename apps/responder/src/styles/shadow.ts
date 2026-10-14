import type { ViewStyle } from "react-native";

// PWA `.custom-shadow`: box-shadow 0 0 5px rgba(0,0,0,0.15)
export const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 5,
  elevation: 2,
} satisfies ViewStyle;
