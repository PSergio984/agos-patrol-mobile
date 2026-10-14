import { useEffect, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Card from "./common/Card";
import ErrorCard from "./common/ErrorCard";
import Skeleton from "./common/Skeleton";
import { useI18n, useWaterwayContext } from "../hooks";
import type {
  ObstructionConfidence,
  ObstructionTier,
  Status,
} from "../../../types/blockage";
import type { TranslationKey } from "../../../lib/i18n";

// Custom theme colors from the PWA tailwind config
const STATUS_COLORS = {
  clear: "#2ECC71",
  partial: "#F39C12",
  blocked: "#E74C3C",
} as const;

export const barColors = [
  STATUS_COLORS.clear,
  STATUS_COLORS.partial,
  STATUS_COLORS.blocked,
];

export const getLevelCount = (status: Status | null): number => {
  switch (status) {
    case "Clear":
      return 0;
    case "Partial":
      return 1;
    case "Blocked":
      return 2;
    default:
      return 0;
  }
};

/** Replicates the `.pulse-circle` expanding-ring animation for "Blocked". */
const PulseDot = ({ color }: { color: string }) => {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View className="w-4 h-4">
      <Animated.View
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: color,
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 0],
          }),
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2],
              }),
            },
          ],
        }}
      />
      <View
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
      />
    </View>
  );
};

const StatusText = () => {
  const { status } = useWaterwayContext();
  const { t } = useI18n();

  const levelCount: number = status ? getLevelCount(status) : 0;
  const statusLabel =
    status === null
      ? "N/A"
      : status === "Blocked"
        ? t("home.blocked")
        : status === "Partial"
          ? t("home.possible")
          : t("home.clear");

  return (
    <View className="flex-row items-center gap-2 my-2">
      {levelCount === 2 ? (
        <PulseDot color={barColors[levelCount]} />
      ) : (
        <View
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: barColors[levelCount] }}
        />
      )}
      <Text
        className="font-bold text-3xl"
        style={{
          color: status ? barColors[levelCount] : "#9ca3af", // gray-400
        }}
      >
        {statusLabel}
      </Text>
    </View>
  );
};

const CONFIDENCE_KEYS: Record<ObstructionTier, TranslationKey> = {
  clear: "home.confidence.clear",
  possible: "home.confidence.possible",
  likely: "home.confidence.likely",
  confirmed: "home.confidence.confirmed",
};

const CONFIDENCE_STYLES: Record<ObstructionTier, string> = {
  clear:
    "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  possible:
    "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  likely:
    "border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  confirmed:
    "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

// Text color must live on the <Text> — RN has no inherited text color.
const CONFIDENCE_TEXT_STYLES: Record<ObstructionTier, string> = {
  clear: "text-emerald-700 dark:text-emerald-400",
  possible: "text-amber-700 dark:text-amber-400",
  likely: "text-orange-700 dark:text-orange-400",
  confirmed: "text-rose-700 dark:text-rose-400",
};

const ConfidencePill = ({
  confidence,
}: {
  confidence: ObstructionConfidence;
}) => {
  const { t } = useI18n();
  const percent = Math.round(confidence.score * 100);

  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full border px-2.5 py-1 ${CONFIDENCE_STYLES[confidence.tier]}`}
      accessibilityHint={`${t("home.confidence")}: ${confidence.flagged_in_window}/${confidence.window_size}`}
    >
      <Text
        className={`uppercase tracking-wide ${CONFIDENCE_TEXT_STYLES[confidence.tier]}`}
        style={{ fontSize: 10.4 }}
      >
        {t(CONFIDENCE_KEYS[confidence.tier])}
      </Text>
      <Text
        className={`opacity-70 ${CONFIDENCE_TEXT_STYLES[confidence.tier]}`}
        style={{ fontSize: 10.4 }}
      >
        {percent}%
      </Text>
    </View>
  );
};

const ProgressBar = () => {
  const { status } = useWaterwayContext();
  const { t } = useI18n();
  const barCount = getLevelCount(status);

  return (
    <View className="relative flex-row gap-1 pb-7">
      {Array.from({ length: 3 }).map((_, index) => (
        <View
          key={index}
          className="flex-1 rounded-md h-2 bg-gray-200 dark:bg-slate-600"
          style={
            barCount >= index
              ? { backgroundColor: barColors[barCount] }
              : undefined
          }
        />
      ))}
      <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between">
        <Text className="text-gray-500 dark:text-gray-400 text-sm">
          {t("home.clear")}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm">
          {t("home.blocked")}
        </Text>
      </View>
    </View>
  );
};

export default function BlockageStatusCard() {
  const { isFetching, status, confidence, error } = useWaterwayContext();
  const { t } = useI18n();

  if (isFetching && !status) {
    return <Skeleton className="h-36 w-full rounded-xl" />;
  }

  if (error) {
    return <ErrorCard message={error} />;
  }

  return (
    <Card className="bg-white !p-3" headerTitle={t("home.blockageStatus")}>
      <View>
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <StatusText />
          {confidence && <ConfidencePill confidence={confidence} />}
        </View>
        <ProgressBar />
      </View>
    </Card>
  );
}
