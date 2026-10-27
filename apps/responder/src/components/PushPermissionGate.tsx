import { Bell, BellOff, ShieldAlert, Siren } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Constants from "expo-constants";
import {
  ALARM_CHANNEL_ID,
  alarmChannelBypassesDnd,
  ensureAlarmChannel,
} from "../lib/alarmChannel";
import { isExpoGo } from "../lib/notifications";
import { getStoredValue, setStoredValue } from "../lib/storage";
import { useCoreHook } from "../context/CoreContext";
import { useI18n } from "../context/I18nContext";
import {
  usePushNotifications,
  type PushPermission,
} from "../hooks/usePushNotifications";

interface ContentProps {
  permission: PushPermission;
  error: string | null;
  isSubscribing: boolean;
  onAction: () => void;
  onRecheck: () => void;
}

function GateContent({
  permission,
  error,
  isSubscribing,
  onAction,
  onRecheck,
}: ContentProps) {
  const { t } = useI18n();
  const { logOut } = useCoreHook();

  if (permission === "unsupported") {
    return (
      <>
        <View className="flex-col items-center gap-3">
          <View className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
            <BellOff size={28} color="#dc2626" />
          </View>
          <Text className="text-lg font-poppins-semibold dark:text-white text-center">
            {t("push.unsupportedTitle")}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300 text-center">
            {t("push.unsupportedBody")}
          </Text>
        </View>
        <Pressable
          onPress={logOut}
          className="w-full mt-5 rounded-lg border border-gray-300 dark:border-slate-600 py-2.5 active:bg-gray-100 dark:active:bg-slate-700"
        >
          <Text className="text-sm font-poppins-medium text-gray-700 dark:text-gray-200 text-center">
            {t("push.logoutButton")}
          </Text>
        </Pressable>
      </>
    );
  }

  if (permission === "denied") {
    return (
      <>
        <View className="flex-col items-center gap-3">
          <View className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3">
            <ShieldAlert size={28} color="#d97706" />
          </View>
          <Text className="text-lg font-poppins-semibold dark:text-white text-center">
            {t("push.deniedTitle")}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300 text-center">
            {t("push.deniedBody")}
          </Text>
        </View>
        <View className="mt-4 rounded-lg bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 p-3">
          <Text className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
            {Platform.OS === "ios"
              ? t("push.iosSteps")
              : t("push.androidSteps")}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            void Linking.openSettings();
            onRecheck();
          }}
          className="w-full mt-4 rounded-lg bg-accent py-2.5 active:opacity-90"
        >
          <Text className="text-sm font-poppins-semibold text-white text-center">
            {t("push.recheckButton")}
          </Text>
        </Pressable>
        <Pressable
          onPress={logOut}
          className="w-full mt-2 rounded-lg border border-gray-300 dark:border-slate-600 py-2.5 active:bg-gray-100 dark:active:bg-slate-700"
        >
          <Text className="text-sm font-poppins-medium text-gray-700 dark:text-gray-200 text-center">
            {t("push.logoutButton")}
          </Text>
        </Pressable>
      </>
    );
  }

  // default OR granted-but-not-subscribed (subscription error case)
  const isRetryCase = permission === "granted" && !!error;
  const errorMessage =
    error === "vapid_missing"
      ? t("push.errorVapid")
      : error === "subscribe_failed"
        ? t("push.errorSubscribe")
        : null;

  return (
    <>
      <View className="flex-col items-center gap-3">
        <View className="rounded-full bg-accent/10 p-3">
          <Bell size={28} color="#1ABC9C" />
        </View>
        <Text className="text-lg font-poppins-semibold dark:text-white text-center">
          {isRetryCase ? t("push.retryTitle") : t("push.title")}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-300 text-center">
          {isRetryCase ? t("push.retrySubtitle") : t("push.subtitle")}
        </Text>
      </View>

      {errorMessage && (
        <Text className="mt-4 text-xs text-red-600 dark:text-red-400 text-center">
          {errorMessage}
        </Text>
      )}

      <Pressable
        onPress={onAction}
        disabled={isSubscribing}
        className="w-full mt-5 rounded-lg bg-accent py-2.5 active:opacity-90 disabled:opacity-60"
      >
        <Text className="text-sm font-poppins-semibold text-white text-center">
          {isSubscribing
            ? t("push.enabling")
            : isRetryCase
              ? t("push.retryButton")
              : t("push.enableButton")}
        </Text>
      </Pressable>
      <Pressable
        onPress={logOut}
        className="w-full mt-2 rounded-lg border border-gray-300 dark:border-slate-600 py-2.5 active:bg-gray-100 dark:active:bg-slate-700"
      >
        <Text className="text-sm font-poppins-medium text-gray-700 dark:text-gray-200 text-center">
          {t("push.logoutButton")}
        </Text>
      </Pressable>
    </>
  );
}

function DndPrompt({
  onEnable,
  onDismiss,
}: {
  onEnable: () => void;
  onDismiss: () => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <View className="flex-col items-center gap-3">
        <View className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3">
          <Siren size={28} color="#d97706" />
        </View>
        <Text className="text-lg font-poppins-semibold dark:text-white text-center">
          {t("push.dndTitle")}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-300 text-center">
          {t("push.dndBody")}
        </Text>
      </View>
      <Pressable
        onPress={onEnable}
        className="w-full mt-5 rounded-lg bg-accent py-2.5 active:opacity-90"
      >
        <Text className="text-sm font-poppins-semibold text-white text-center">
          {t("push.dndEnable")}
        </Text>
      </Pressable>
      <Pressable
        onPress={onDismiss}
        className="w-full mt-2 rounded-lg border border-gray-300 dark:border-slate-600 py-2.5 active:bg-gray-100 dark:active:bg-slate-700"
      >
        <Text className="text-sm font-poppins-medium text-gray-700 dark:text-gray-200 text-center">
          {t("push.dndLater")}
        </Text>
      </Pressable>
    </>
  );
}

export default function PushPermissionGate() {
  const { responderId } = useCoreHook();
  const { permission, isSubscribed, isSubscribing, error, subscribe, recheck } =
    usePushNotifications();

  const [dndBypassed, setDndBypassed] = useState<boolean | null>(null);
  // null = never asked → policy-access screen; "attempted" → the flag is still
  // off so the remaining cause is a user-locked channel → channel settings;
  // "dismissed" = asked for good. Per-responder, persisted.
  const [dndPromptState, setDndPromptState] = useState<
    "attempted" | "dismissed" | null
  >(null);
  const dndPromptKey = `dndAlarmPrompt.${responderId}`;
  useEffect(() => {
    if (Platform.OS !== "android" || !responderId) return;
    void getStoredValue(dndPromptKey)
      .then((v) =>
        setDndPromptState(v === "attempted" || v === "dismissed" ? v : null)
      )
      .catch(() => {});
  }, [responderId, dndPromptKey]);

  const dismissDndPrompt = () => {
    setDndPromptState("dismissed");
    void setStoredValue(dndPromptKey, "dismissed").catch(() => {});
  };

  const openDndSettings = () => {
    if (dndPromptState === "attempted") {
      // Policy access was already attempted and the flag still reads off —
      // the user locked Override-DND on the channel itself, which only the
      // channel's own settings page can unlock.
      void Linking.sendIntent(
        "android.settings.CHANNEL_NOTIFICATION_SETTINGS",
        [
          { key: "android.provider.extra.CHANNEL_ID", value: ALARM_CHANNEL_ID },
          {
            key: "android.provider.extra.APP_PACKAGE",
            value: Constants.expoConfig?.android?.package ?? "ph.agos.patrol",
          },
        ]
      ).catch(() => {});
      return;
    }
    setDndPromptState("attempted");
    void setStoredValue(dndPromptKey, "attempted").catch(() => {});
    void Linking.sendIntent(
      "android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS"
    ).catch(() => {});
  };

  // After subscribing, alarm pushes only ring through Do Not Disturb if the
  // user grants notification-policy access — check once per subscribe/dismiss
  // and again whenever the app returns (they may have just toggled it).
  useEffect(() => {
    if (
      Platform.OS !== "android" ||
      !isSubscribed ||
      dndPromptState === "dismissed"
    )
      return;
    const check = () =>
      void ensureAlarmChannel()
        .then(alarmChannelBypassesDnd)
        .then(setDndBypassed)
        // No grant state readable → leave null → don't prompt.
        .catch(() => {});
    check();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => sub.remove();
  }, [isSubscribed, dndPromptState]);

  // Remote push cannot work in Expo Go at all — gating would only block
  // development smoke tests. Dev builds and production enforce normally.
  const needsGate =
    !isExpoGo &&
    !!responderId &&
    !isSubscribed &&
    (permission !== "granted" || error !== null);

  const showDndPrompt =
    !needsGate &&
    !isExpoGo &&
    Platform.OS === "android" &&
    !!responderId &&
    isSubscribed &&
    dndBypassed === false &&
    dndPromptState !== "dismissed";

  if (showDndPrompt) {
    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={dismissDndPrompt}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6">
            <DndPrompt
              onEnable={openDndSettings}
              onDismiss={dismissDndPrompt}
            />
          </View>
        </View>
      </Modal>
    );
  }

  if (!needsGate) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <View className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6">
          <GateContent
            permission={permission}
            error={error}
            isSubscribing={isSubscribing}
            onAction={subscribe}
            onRecheck={recheck}
          />
        </View>
      </View>
    </Modal>
  );
}
