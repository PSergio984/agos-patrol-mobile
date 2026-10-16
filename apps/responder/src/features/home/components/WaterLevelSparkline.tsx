import { useEffect, useState } from "react";
import { useColorScheme } from "nativewind";
import { Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { sensorAPI, type WaterLevelTrendPoint } from "../../../lib/api/sensor";
import { useCoreHook, useI18n } from "../hooks";
import Card from "./common/Card";
import CardTitle from "./common/CardTitle";
import Skeleton from "./common/Skeleton";

export default function WaterLevelSparkline() {
  const { effectiveLocationId } = useCoreHook();
  const [data, setData] = useState<WaterLevelTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (!effectiveLocationId) return;

    const fetchTrend = async () => {
      try {
        const res = await sensorAPI.getWaterLevelTrend(effectiveLocationId);
        setData(res);
      } catch {
        // Silently fail — sparkline is supplementary
      } finally {
        setIsLoading(false);
      }
    };

    // Drop the previous site's trend immediately — deferred a tick because a
    // synchronous setState inside the effect body trips the render lint.
    queueMicrotask(() => {
      setData([]);
      setIsLoading(true);
    });
    fetchTrend();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrend, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [effectiveLocationId]);

  if (isLoading) {
    return (
      <Card>
        <CardTitle title={t("home.waterLevelTrend")} />
        <Skeleton className="h-16 rounded-md mt-2" />
      </Card>
    );
  }

  if (data.length < 2) return null;

  return (
    <Card>
      <CardTitle title={t("home.waterLevelTrend")} />
      <View className="mt-2">
        <SparklineSVG points={data} />
      </View>
      <View className="flex-row justify-between mt-1">
        <Text
          className="text-gray-400 dark:text-gray-500"
          style={{ fontSize: 10 }}
        >
          24h ago
        </Text>
        <Text
          className="text-gray-400 dark:text-gray-500"
          style={{ fontSize: 10 }}
        >
          Now
        </Text>
      </View>
    </Card>
  );
}

function SparklineSVG({ points }: { points: WaterLevelTrendPoint[] }) {
  const isDark = useColorScheme().colorScheme === "dark";
  // PWA: stroke rgb(10,61,98) (primary), dark: accent #1ABC9C
  const lineColor = isDark ? "#1ABC9C" : "rgb(10, 61, 98)";

  const width = 300;
  const height = 60;
  const padding = 4;

  const values = points.map((p) => p.waterLevelCm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) =>
    padding + (i / (points.length - 1)) * (width - padding * 2);
  const toY = (v: number) =>
    height - padding - ((v - min) / range) * (height - padding * 2);

  const pathData = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(
          p.waterLevelCm
        ).toFixed(1)}`
    )
    .join(" ");

  // Area fill
  const areaPath = `${pathData} L ${toX(points.length - 1).toFixed(1)} ${height} L ${toX(0).toFixed(1)} ${height} Z`;

  const lastValue = values[values.length - 1];
  const lastX = toX(points.length - 1);
  const lastY = toY(lastValue);

  return (
    <Svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={64}
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="rgb(10, 61, 98)" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="rgb(10, 61, 98)" stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#sparkFill)" />
      <Path
        d={pathData}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={lastX} cy={lastY} r="2.5" fill={lineColor} />
    </Svg>
  );
}
