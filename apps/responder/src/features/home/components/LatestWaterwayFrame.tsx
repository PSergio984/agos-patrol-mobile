import { useState } from "react";
import { Camera, ChevronRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Pressable, Text, View } from "react-native";

import { useCoreHook, useI18n, useWebSocketMessage } from "../hooks";
import { cardShadow } from "../../../styles/shadow";
import {
  getLatestCameraFrame,
  type CameraFrameSnapshot,
} from "../../../lib/api/camera";
import LatestFrameModal from "./LatestFrameModal";

interface CameraUpdateWire {
  image: string;
  timestamp: string;
}

export default function LatestWaterwayFrame() {
  const { responder } = useCoreHook();
  const { t } = useI18n();
  const isDark = useColorScheme().colorScheme === "dark";
  const [latestFrame, setLatestFrame] = useState<CameraFrameSnapshot | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const locationId = responder?.locationId;

  useWebSocketMessage<CameraUpdateWire>("camera_update", (data) => {
    if (!data?.image || !data.timestamp) return;
    setLatestFrame(data);
    setHasError(false);
  });

  const openLatestFrame = () => {
    setIsModalOpen(true);
    setIsLoading(true);
    setHasError(false);

    if (!locationId) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    getLatestCameraFrame(locationId)
      .then((frame) => setLatestFrame(frame))
      .catch(() => {
        if (!latestFrame) setHasError(true);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      <Pressable
        onPress={openLatestFrame}
        className="w-full flex-row items-center gap-3 rounded-xl bg-white px-3.5 py-3 active:bg-gray-50 dark:border dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700"
        style={[cardShadow, { minHeight: 66 }]}
        accessibilityRole="button"
        accessibilityLabel={t("home.frame.open")}
      >
        <View
          className="h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: isDark ? "#1ABC9C" : "#0A3D62" }}
        >
          <Camera size={20} color={isDark ? "#0f172a" : "#ffffff"} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className="font-semibold text-gray-950 dark:text-white"
            style={{ fontSize: 12 }}
          >
            {t("home.frame.title")}
          </Text>
          <Text
            className="mt-0.5 text-gray-500 dark:text-slate-400"
            style={{ fontSize: 10 }}
            numberOfLines={1}
          >
            {t("home.frame.open")}
          </Text>
        </View>
        <ChevronRight size={16} color="#9ca3af" />
      </Pressable>

      <LatestFrameModal
        isOpen={isModalOpen}
        frame={latestFrame}
        isLoading={isLoading}
        hasError={hasError}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
