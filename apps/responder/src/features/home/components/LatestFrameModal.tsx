import { useEffect, useState } from "react";
import { Camera, Loader2, X } from "lucide-react-native";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

import { useI18n } from "../hooks";
import type { CameraFrameSnapshot } from "../../../lib/api/camera";

interface LatestFrameModalProps {
  isOpen: boolean;
  frame: CameraFrameSnapshot | null;
  isLoading: boolean;
  hasError: boolean;
  onClose: () => void;
}

// PWA renders raw base64 as `data:image/jpeg;base64,...`; tolerate a
// pre-built data URI in case the mobile API already prefixes it.
const toImageUri = (image: string) =>
  image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

const SpinningLoader = () => {
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: spin.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            }),
          },
        ],
      }}
    >
      <Loader2 size={32} color="#cbd5e1" />
    </Animated.View>
  );
};

export default function LatestFrameModal({
  isOpen,
  frame,
  isLoading,
  hasError,
  onClose,
}: LatestFrameModalProps) {
  const { t, locale } = useI18n();

  const capturedAt = frame
    ? new Intl.DateTimeFormat(locale === "fil" ? "fil-PH" : "en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(frame.timestamp))
    : null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 items-center justify-center bg-slate-950/70 p-3"
        onPress={onClose}
        accessibilityRole="button"
      >
        {/* Dialog — inner Pressable swallows taps so they don't close */}
        <Pressable
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-800"
          onPress={() => {}}
          accessibilityViewIsModal
          accessibilityRole="none"
        >
          <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-slate-700">
            <View
              className="h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(26, 188, 156, 0.1)" }}
            >
              <Camera size={20} color="#1ABC9C" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold text-gray-950 dark:text-white">
                {t("home.frame.title")}
              </Text>
              {capturedAt && (
                <Text
                  className="mt-0.5 text-gray-500 dark:text-slate-400"
                  style={{ fontSize: 10 }}
                  numberOfLines={1}
                >
                  {t("home.frame.captured")} {capturedAt}
                </Text>
              )}
            </View>
            <Pressable
              onPress={onClose}
              className="h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-slate-700"
              accessibilityRole="button"
              accessibilityLabel={t("home.frame.close")}
            >
              <X size={20} color="#6b7280" />
            </Pressable>
          </View>

          <View className="bg-slate-950">
            {frame ? (
              <Image
                source={{ uri: toImageUri(frame.image) }}
                accessibilityLabel={t("home.frame.alt")}
                resizeMode="contain"
                style={{
                  width: "100%",
                  height: Dimensions.get("window").height * 0.58,
                  minHeight: 208,
                }}
              />
            ) : (
              <View
                className="flex-col items-center justify-center gap-3 px-6"
                style={{ minHeight: 256 }}
              >
                {isLoading ? (
                  <>
                    <SpinningLoader />
                    <Text className="text-sm text-slate-300">
                      {t("home.frame.loading")}
                    </Text>
                  </>
                ) : (
                  <>
                    <Camera size={36} color="#64748b" />
                    <Text className="text-sm text-slate-300 text-center">
                      {t(hasError ? "home.frame.error" : "home.frame.empty")}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          <Text
            className="px-4 py-3 leading-relaxed text-gray-500 dark:text-slate-400"
            style={{ fontSize: 10 }}
          >
            {t("home.frame.disclaimer")}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
