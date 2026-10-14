import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useColorScheme } from "nativewind";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import {
  capitalizeFirstLetter,
  getTimeAgo,
} from "../../../../../lib/utils/formatter";
import { useWaterLevel } from "../../../hooks";

const AlertCategory = () => {
  const { sensorData } = useWaterLevel();
  const alert = sensorData?.alert?.level || "unknown";

  const getAlertClasses = (alert: string) => {
    switch (alert) {
      case "normal":
        return {
          circle: "#16a34a", // bg-green-600
          text: "text-green-700 dark:text-green-400",
        };
      case "warning":
        return {
          circle: "#eab308", // bg-yellow-500
          text: "text-yellow-600 dark:text-yellow-400",
        };
      case "critical":
        return {
          circle: "#dc2626", // bg-red-600
          text: "text-red-700 dark:text-red-400",
        };
      default:
        return {
          circle: "#4b5563", // bg-gray-600
          text: "text-gray-700 dark:text-gray-300",
        };
    }
  };

  const classes = getAlertClasses(alert);

  return (
    <View className="flex-row self-start items-center gap-2">
      <View
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: classes.circle }}
      />
      <Text
        className={`font-semibold ${classes.text}`}
        style={{ fontSize: 12.8 }}
      >
        {capitalizeFirstLetter(alert)}
      </Text>
    </View>
  );
};

const LevelInfo = () => {
  const { sensorData } = useWaterLevel();
  const isDark = useColorScheme().colorScheme === "dark";
  const level = sensorData?.water_level.trend || "stable";
  const iconColor = isDark ? "#d1d5db" : "#111827";

  // rising → ArrowUp, falling → ArrowDown, stable/unknown → ArrowRight
  const arrow =
    level === "rising" ? (
      <ArrowUp size={16} color={iconColor} />
    ) : level === "falling" ? (
      <ArrowDown size={16} color={iconColor} />
    ) : (
      <ArrowRight size={16} color={iconColor} />
    );

  return (
    <View className="flex-row items-center gap-1">
      {arrow}
      <Text className="text-sm dark:text-gray-300">
        {capitalizeFirstLetter(level || "")}
      </Text>
    </View>
  );
};

// ---- Water gauge (port of style.css) ------------------------------------
// .water-gauge: w-[50px] h-[144px] rounded-[40px] border-[3px] border-gray-200
// Inner area is 44x138. The CSS gradient (red → amber → green, top → bottom)
// is approximated with three stacked color bands since RN has no gradients.
const GAUGE_WIDTH = 50;
const GAUGE_HEIGHT = 144;
const GAUGE_BORDER = 3;
const INNER_W = GAUGE_WIDTH - GAUGE_BORDER * 2; // 44
const INNER_H = GAUGE_HEIGHT - GAUGE_BORDER * 2; // 138

const WAVE_PATH = "M0,10 Q12.5,5 25,10 T50,10 T75,10 T100,10 L100,20 L0,20 Z";

/** One `wave-move` iteration = translateX by one wave period (INNER_W px). */
const Wave = ({
  duration,
  fill,
  reverse = false,
}: {
  duration: number;
  fill: string;
  reverse?: boolean;
}) => {
  const [progress] = useState(() => new Animated.Value(reverse ? 1 : 0));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(progress, {
        toValue: reverse ? 0 : 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [progress, duration, reverse]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: -INNER_W,
        width: INNER_W * 2,
        height: "100%",
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, INNER_W],
            }),
          },
        ],
      }}
    >
      <Svg
        width={INNER_W * 2}
        height={20}
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        <Path d={WAVE_PATH} fill={fill} />
      </Svg>
    </Animated.View>
  );
};

const GaugeDisplay = () => {
  const { sensorConfig, sensorData } = useWaterLevel();
  const [fillAnim] = useState(() => new Animated.Value(0));

  // Critical line is at 80% of gauge height (leaving 20% padding)
  const criticalLinePosition = 80;

  // Water fill scales to 80% max (where critical line is)
  const waterHeightPct =
    ((sensorData?.alert.percentage_of_critical ?? 0) / 100) *
    criticalLinePosition;
  const targetHeight = (Math.min(waterHeightPct, 100) / 100) * INNER_H;

  // Replicates the CSS `transition-[height] duration-[0.7s] ease-out`
  useEffect(() => {
    const anim = Animated.timing(fillAnim, {
      toValue: targetHeight,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [fillAnim, targetHeight]);

  return (
    <View
      className="relative rounded-[40px] border-[3px] border-gray-200 overflow-hidden shrink-0"
      style={{ width: GAUGE_WIDTH, height: GAUGE_HEIGHT }}
    >
      {/* Threshold gradient bands (top → bottom: red, amber, green) */}
      <View
        className="absolute left-0 right-0 top-0"
        style={{ height: INNER_H * 0.18, backgroundColor: "#dc2626" }}
      />
      <View
        className="absolute left-0 right-0"
        style={{
          top: INNER_H * 0.18,
          height: INNER_H * 0.47,
          backgroundColor: "#f59e0b",
        }}
      />
      <View
        className="absolute left-0 right-0 bottom-0"
        style={{ height: INNER_H * 0.35, backgroundColor: "#10b981" }}
      />

      {sensorConfig && sensorData && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: fillAnim,
            backgroundColor: "#3b82f6",
            borderBottomLeftRadius: 37,
            borderBottomRightRadius: 37,
            overflow: "visible",
          }}
        >
          {/* wave-container: absolute, top -10, h 20, overflow hidden */}
          <View
            style={{
              position: "absolute",
              top: -10,
              left: 0,
              right: 0,
              height: 20,
              overflow: "hidden",
            }}
          >
            <Wave duration={4000} fill="rgba(147, 197, 253, 0.6)" />
            <Wave duration={6000} fill="rgba(96, 165, 250, 0.4)" reverse />
            <Wave duration={5000} fill="rgba(59, 130, 246, 0.3)" />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default function MainDisplay() {
  const { sensorData } = useWaterLevel();

  return (
    <View className="flex-col gap-2">
      <View className="flex-row relative items-center gap-2 mt-2">
        <GaugeDisplay />
        <View className="gap-2">
          <Text>
            <Text className="text-2xl font-semibold dark:text-white">
              {`${(sensorData?.water_level.current_cm ?? 0).toFixed(1)} `}
            </Text>
            <Text className="dark:text-gray-300">cm</Text>
          </Text>
          <AlertCategory />
          <LevelInfo />
        </View>
      </View>
      <Text
        className="text-gray-900 dark:text-gray-300"
        style={{ fontSize: 12.8 }}
      >
        {sensorData?.timestamp ? getTimeAgo(sensorData.timestamp) : "No data"}
      </Text>
    </View>
  );
}
