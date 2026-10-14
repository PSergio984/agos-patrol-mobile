import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import type { Alert } from "../../types/alert";
import AlertCard from "./components/AlertCard";
import AlertDetails from "./components/AlertDetails/AlertDetails";
import {
  AlertsSkeleton,
  AlertTypeFilters,
  EmptyPage,
  ErrorPage,
} from "./components/PageComponents";
import { useAlertsPageHook } from "./context/AlertsPageContext";
import { useI18n } from "../../context/I18nContext";

export default function Alerts() {
  const {
    shownAlerts,
    isFetching,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    chosenFilter,
    loadMore,
    refresh,
  } = useAlertsPageHook();
  const { t } = useI18n();
  const listRef = useRef<FlatList<Alert>>(null);

  // P parity: the PWA calls window.scrollTo(0, 0) on filter change
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [chosenFilter]);

  if (isFetching) {
    return <AlertsSkeleton />;
  }

  if (error) {
    return <ErrorPage message={error} />;
  }

  return (
    <View className="flex-1 bg-[#F8F8F8] dark:bg-slate-900">
      <FlatList
        ref={listRef}
        data={shownAlerts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlertCard alert={item} />}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListHeaderComponent={<AlertTypeFilters />}
        ListEmptyComponent={<EmptyPage isAllChosen={chosenFilter === "all"} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              onPress={loadMore}
              disabled={isLoadingMore}
              className="w-full py-3 rounded-lg disabled:opacity-50"
            >
              {isLoadingMore ? (
                <View className="flex-row items-center justify-center gap-2">
                  <ActivityIndicator size="small" color="#0A3D62" />
                  <Text className="text-sm font-medium text-primary dark:text-accent">
                    {t("alerts.loading") || "Loading..."}
                  </Text>
                </View>
              ) : (
                <Text className="text-center text-sm font-medium text-primary dark:text-accent">
                  {t("alerts.loadMore") || "Load more"}
                </Text>
              )}
            </Pressable>
          ) : null
        }
      />
      <AlertDetails />
    </View>
  );
}
