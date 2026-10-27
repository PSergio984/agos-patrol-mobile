import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CircleCheck, MapPin, Siren, X } from "lucide-react-native";
import { isAxiosError } from "axios";
import type { Alert } from "../../types/alert";
import { alertsAPI } from "../../lib/api/alert";
import { responderAPI } from "../../lib/api/responder";
import { enqueueAcknowledgement } from "../alerts/utils/offlineQueue";
import { getResponderId, getResponderToken } from "../../lib/storage";
import { getEligibleSites } from "../../lib/utils/sites";
import { formatTimestamp } from "../../lib/utils/formatter";
import { useI18n } from "../../context/I18nContext";

// Full-screen takeover for alarm pushes (#32) — the surface a future
// full-screen-intent (#34) will launch directly. Lives on the root Stack,
// outside the (tabs) provider tree, so CoreContext/AlertsPageContext aren't
// reachable here: the responder id comes from SecureStore and the push's
// dispatchId is resolved to this responder's delivery via a page-1 alerts
// fetch — the same fallback AlertsPageContext.openAlertByDispatchId uses.
export default function AlarmScreen() {
  const { dispatchId, title, message, issuedAt, locationId } =
    useLocalSearchParams<{
      dispatchId?: string;
      title?: string;
      message?: string;
      issuedAt?: string;
      locationId?: string;
    }>();
  const { t } = useI18n();

  // undefined = still resolving, null = no delivery found, Alert = resolved
  const [delivery, setDelivery] = useState<Alert | null | undefined>(undefined);
  const [responderId, setResponderId] = useState("");
  const [siteName, setSiteName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Keyed to the delivery id, not a boolean — a late resolution from the
  // previous alarm's ack must not flag a reused screen's new delivery.
  const [ackedDeliveryId, setAckedDeliveryId] = useState<string | null>(null);

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
        if (cancelled) return;
        // router.navigate can reuse this mounted screen with a second alarm's
        // params — clear stale state here (sync setState in an effect body
        // trips the cascading-render lint rule).
        setDelivery(undefined);
        setSiteName(null);
        if (!rid) return;
        setResponderId(rid);

        // Site name: the push carries only location_id — match it against the
        // responder's eligible sites (home + open deployments). A missed
        // match (barangay-wide null, foreign site, fetch failure) keeps the
        // generic label.
        const locId = Number(locationId);
        if (locationId && Number.isFinite(locId)) {
          responderAPI
            .getResponderDetails(rid)
            .then((r) => {
              const name = getEligibleSites(r).find(
                (s) => s.locationId === locId
              )?.locationName;
              if (name && !cancelled) setSiteName(name);
            })
            .catch(() => {});
        }

        if (!dispatchId || !Number.isFinite(id)) return;
        const res = await alertsAPI.getAlerts(rid, 1);
        const match = res.items.find((a) => a.dispatchId === id) ?? null;
        if (!cancelled) setDelivery(match);
      } catch {
        // SecureStore or API failure — unresolved fallback shows push content.
      } finally {
        if (!cancelled) setDelivery((d) => (d === undefined ? null : d));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatchId, locationId]);

  const resolving = delivery === undefined;
  const isAcked =
    ackedDeliveryId === delivery?.id || delivery?.isAcknowledged === true;

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
      setAckedDeliveryId(delivery.id);
    } catch (err) {
      // 409 = already acknowledged server-side — that IS the success state,
      // not a retryable failure.
      if (isAxiosError(err) && err.response?.status === 409) {
        setAckedDeliveryId(delivery.id);
        return;
      }
      await enqueueAcknowledgement(payload);
      setAckedDeliveryId(delivery.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = () => {
    // replace — not push — so the modal leaves the stack instead of stacking
    // a second (tabs) provider tree on top of it.
    router.replace({
      pathname: "/(tabs)/alerts",
      params: dispatchId ? { dispatchId } : {},
    });
  };

  // fullScreenModal has no swipe-dismiss on iOS — an explicit affordance is
  // the only way off the screen besides View details.
  const handleDismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <Pressable
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel={t("alarm.dismiss")}
        className="absolute right-4 top-4 z-10 p-2"
      >
        <X size={24} color="#6b7280" />
      </Pressable>
      <View className="flex-1 justify-between px-6 py-6">
        <View className="items-center gap-3 pt-4">
          <View className="rounded-full bg-red-100 dark:bg-red-950/60 p-5">
            <Siren size={44} color="#b91c1c" />
          </View>
          <Text className="text-3xl font-bold uppercase tracking-widest text-red-700 dark:text-red-400">
            {t("alerts.alarm")}
          </Text>
          {/* Resolved from the responder's eligible sites when the push
              carries location_id; generic label for barangay-wide or
              unmatched sites. */}
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color="#6b7280" />
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              {siteName ?? t("alarm.siteLabel")}
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
