import { useEffect, useState } from "react";
import { Animated } from "react-native";

/**
 * Loading placeholder matching the PWA `.skeleton` class
 * (bg #e5e7eb / slate-700 dark, animated shimmer -> opacity pulse).
 */
export default function Skeleton({ className }: { className?: string }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
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
      className={`bg-[#e5e7eb] dark:bg-slate-700 ${className || ""}`}
      style={{ opacity }}
    />
  );
}
