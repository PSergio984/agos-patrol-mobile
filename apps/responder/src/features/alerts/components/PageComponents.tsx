import { useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { BellOff } from "lucide-react-native";
import { FILTERS, useAlertsPageHook } from "../context/AlertsPageContext";
import { useI18n } from "../../../context/I18nContext";

const filterLabelKeys = {
  all: "alerts.all",
  alarm: "alerts.alarm",
  critical: "alerts.critical",
  warning: "alerts.warning",
  announcement: "alerts.announcement",
} as const;

export const EmptyPage = ({ isAllChosen }: { isAllChosen: boolean }) => {
  const { t } = useI18n();
  const message = isAllChosen
    ? t("alerts.allCaughtUp")
    : t("alerts.noAlertsOfType");

  return (
    <View className="items-center gap-4 pt-10">
      <View className="rounded-full bg-gray-200 dark:bg-slate-700 p-4">
        <BellOff size={32} color="#9ca3af" />
      </View>
      <Text className="font-semibold text-xl dark:text-white">
        {t("alerts.noAlerts")}
      </Text>
      <Text className="text-center text-gray-600 dark:text-gray-400">
        {message}
      </Text>
    </View>
  );
};

const SkeletonBar = () => {
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className="h-14 w-full rounded-lg bg-gray-200 dark:bg-slate-700"
      style={{ opacity }}
    />
  );
};

export const AlertsSkeleton = () => {
  return (
    <View className="p-4 gap-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonBar key={index} />
      ))}
    </View>
  );
};

export const ErrorPage = ({ message }: { message: string }) => {
  return (
    <View className="p-4">
      <View className="w-full rounded-lg p-3 border border-red-500 dark:border-red-700 bg-red-50 dark:bg-red-950/50">
        <Text className="text-red-500 dark:text-red-400 text-sm">
          {message}
        </Text>
      </View>
    </View>
  );
};

export const AlertTypeFilters = () => {
  const { chosenFilter, handleFilterChange } = useAlertsPageHook();
  const { t } = useI18n();

  return (
    <View className="flex-row items-center gap-1 flex-wrap">
      {FILTERS.map((filter) => {
        const isActive = chosenFilter === filter;
        return (
          <Pressable
            key={filter}
            className={`px-4 py-2 rounded-md ${
              isActive ? "bg-primary dark:bg-accent" : "bg-accent/70"
            }`}
            onPress={() => handleFilterChange(filter)}
          >
            <Text
              className={`text-sm ${
                isActive ? "text-white dark:text-slate-900" : "text-white"
              }`}
            >
              {t(filterLabelKeys[filter as keyof typeof filterLabelKeys])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
