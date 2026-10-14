import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { getResponderId, getResponderToken } from "../src/lib/storage";

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [token, id] = await Promise.all([
          getResponderToken(),
          getResponderId(),
        ]);
        if (!cancelled) {
          setDestination(token && id ? "/(tabs)" : "/(auth)/verify");
        }
      } catch {
        // Storage read failure — fail closed to verify
        if (!cancelled) {
          setDestination("/(auth)/verify");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!destination) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <ActivityIndicator size="large" color="#1ABC9C" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
