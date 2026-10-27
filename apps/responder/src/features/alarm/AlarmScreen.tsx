import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CircleCheck, MapPin, Siren } from "lucide-react-native";
import { isAxiosError } from "axios";
import type { Alert } from "../../types/alert";
import { alertsAPI } from "../../lib/api/alert";
import { enqueueAcknowledgement } from "../alerts/utils/offlineQueue";
import { getResponderId, getResponderToken } from "../../lib/storage";
import { formatTimestamp } from "../../lib/utils/formatter";
import { useI18n } from "../../context/I18nContext";

// Full-screen takeover for alarm pushes (#32) — the surface a future
// full-screen-intent (#34) will launch directly. Lives on the root Stack,
// outside the (tabs) provider tree, so CoreContext/AlertsPageContext aren't
// reachable here: the responder id comes from SecureStore and the push's
// dispatchId is resolved to this responder's delivery via a page-1 alerts
// fetch — the same fallback AlertsPageContext.openAlertByDispatchId uses.
export default function AlarmScreen() {
  const { dispatchId, title, message, issuedAt } = useLocalSearchParams<{
    dispatchId?: string;
    title?: string;
    message?: string;
    issuedAt?: string;
  }>();
  const { t } = useI18n();

  // undefined = still resolving, null = no delivery found, Alert = resolved
  const [delivery, setDelivery] = useState<Alert | null | undefined>(undefined);
  const [responderId, setResponderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acked, setAcked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const id = Number(dispatchId);
        // getResponderToken also warms the axios cachedToken mirror — without
        // it a cold launch straight into this screen sends requests bare.
        const [rid] = await Promise.all([
          getResponderId(),
          getResponderToken(),
        ]);
        if (!rid || !dispatchId || !Number.isFinite(id)) return;
        if (cancelled) return;
        setResponderId(rid);
        try {
          const res = await alertsAPI.getAlerts(rid, 1);
          const match = res.items.find((a) => a.dispatchId === id) ?? null;
          if (!cancelled) setDelivery(match);
        } catch {
          // Offline / API failure — unresolved fallback shows push content.
        }
      } catch {
        // SecureStore read failed — fall through to the unresolvable state.
      } finally {
        if (!cancelled) setDelivery((d) => (d === undefined ? null : d));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatchId]);

  const resolving = delivery === undefined;
  const isAcked = acked || delivery?.isAcknowledged === true;

  const displayTitle = delivery?.title ?? title ?? t("alarm.fallbackTitle");
  const displayMessage = delivery?.message ?? message;
  const displayTimestamp = delivery?.timestamp ?? issuedAt;

  // Same api + 409 + offline-queue pattern as AlertDetails'
  // AcknowledgeNotification — the takeover ack is a single tap, no message.
  const handleAcknowledge = async () => {
    if (isSubmitting || !delivery || !responderId) return;
    const payload = {
      message: null,
      responderId,
      deliveryId: delivery.id,
    };
    try {
      setIsSubmitting(true);
      await alertsAPI.acknowledgeNotification(payload);
      setAcked(true);
    } catch (err) {
      // 409 = already acknowledged server-side — that IS the success state,
      // not a retryable failure.
      if (isAxiosError(err) && err.response?.status === 409) {
        setAcked(true);
        return;
      }
      await enqueueAcknowledgement(payload);
      setAcked(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = () => {
    router.push({
      pathname: "/(tabs)/alerts",
      params: dispatchId ? { dispatchId } : {},
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 justify-between px-6 py-6">
        <View className="items-center gap-3 pt-4">
          <View className="rounded-full bg-red-100 dark:bg-red-950/60 p-5">
            <Siren size={44} color="#b91c1c" />
          </View>
          <Text className="text-3xl font-bold uppercase tracking-widest text-red-700 dark:text-red-400">
            {t("alerts.alarm")}
          </Text>
          {/* The push carries only location_id and no site-name lookup exists
              outside the (tabs) providers — generic label until #34 lands a
              richer payload. */}
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color="#6b7280" />
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              {t("alarm.siteLabel")}
            </Text>
          </View>
        </View>

        <View className="items-center gap-2 px-2">
          <Text className="text-lg font-semibold text-center dark:text-white">
            {displayTitle}
          </Text>
          {displayMessage ? (
            <Text className="text-sm text-center text-gray-700 dark:text-gray-300">
              {displayMessage}
            </Text>
          ) : null}
          {displayTimestamp ? (
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(displayTimestamp)}
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          {resolving ? (
            <ActivityIndicator size="large" color="#b91c1c" />
          ) : isAcked ? (
            <View className="flex-row items-center justify-center gap-2 py-4">
              <CircleCheck size={22} color="#16a34a" />
              <Text className="text-base font-semibold text-green-700 dark:text-green-400">
                {t("alerts.acknowledged")}
              </Text>
            </View>
          ) : delivery ? (
            <Pressable
              onPress={handleAcknowledge}
              disabled={isSubmitting}
              className="bg-red-600 rounded-xl py-4 flex-row items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <ActivityIndicator size="small" color="#ffffff" />
              )}
              <Text className="text-white text-base font-semibold">
                {t("alerts.acknowledge")}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleViewDetails}
            className="border border-gray-300 dark:border-slate-600 rounded-xl py-3 items-center"
          >
            <Text className="text-sm text-gray-700 dark:text-gray-200">
              {t("alarm.viewDetails")}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
