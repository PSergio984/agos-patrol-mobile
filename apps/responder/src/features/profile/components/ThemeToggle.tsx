import { Monitor, Moon, Sun } from "lucide-react-native";
import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";
import Card from "./common/Card";
import SectionLabel from "./common/SectionLabel";
import { useTheme } from "../../../context/ThemeContext";
import { useI18n } from "../../../context/I18nContext";

type ThemeMode = "light" | "dark" | "system";

type ThemeLabelKey = "profile.light" | "profile.dark" | "profile.system";

const options: {
  mode: ThemeMode;
  icon: ComponentType<{ size?: number; color?: string }>;
  labelKey: ThemeLabelKey;
}[] = [
  { mode: "light", icon: Sun, labelKey: "profile.light" },
  { mode: "dark", icon: Moon, labelKey: "profile.dark" },
  { mode: "system", icon: Monitor, labelKey: "profile.system" },
];

export default function ThemeToggle() {
  const { mode, isDark, setMode } = useTheme();
  const { t } = useI18n();

  return (
    <View>
      <SectionLabel label={t("profile.appearance")} />
      <Card className="p-2">
        <View className="flex-row gap-1">
          {options.map((option) => {
            const isActive = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => setMode(option.mode)}
                className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5 ${
                  isActive
                    ? "bg-accent/15"
                    : "active:bg-gray-100 dark:active:bg-slate-700"
                }`}
              >
                <option.icon
                  size={16}
                  color={isActive ? "#1ABC9C" : isDark ? "#9ca3af" : "#4b5563"}
                />
                <Text
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-accent"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {t(option.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
