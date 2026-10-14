import { useEffect, useState } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

/**
 * RN stand-in for the PWA `.skeleton` shimmer class: a pulsing
 * bg-[#e5e7eb] / dark:bg-slate-700 block.
 */
export default function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [opacity] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-[#e5e7eb] dark:bg-slate-700 ${className}`}
      style={[style, { opacity }]}
    />
  );
}
