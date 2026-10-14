import type { ReactNode } from "react";
import { View } from "react-native";
import { cardShadow } from "../../../../styles/shadow";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Port of PWA src/components/common/Card.tsx.
 *
 * NOTE: unlike the PWA Card this carries no default padding. RN resolves
 * `padding` vs `paddingHorizontal` by property specificity (not order), so a
 * Tailwind `p-0` override would silently lose to a baked-in `px-4`. Call sites
 * pass padding explicitly in `className` (PWA defaults were px-4 py-5).
 */
export default function Card({ children, className }: Props) {
  return (
    <View
      className={`rounded-xl bg-white dark:bg-slate-800 dark:border dark:border-slate-700 ${className || ""}`}
      style={cardShadow}
    >
      {children}
    </View>
  );
}
