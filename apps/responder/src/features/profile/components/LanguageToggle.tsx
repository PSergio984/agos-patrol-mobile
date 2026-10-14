import { Pressable, Text, View } from "react-native";
import Card from "./common/Card";
import SectionLabel from "./common/SectionLabel";
import { useI18n } from "../../../context/I18nContext";

const options: { locale: "en" | "fil"; label: string }[] = [
  { locale: "en", label: "English" },
  { locale: "fil", label: "Filipino" },
];

export default function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <View>
      <SectionLabel label={t("profile.language")} />
      <Card className="p-2">
        <View className="flex-row gap-1">
          {options.map((option) => {
            const isActive = locale === option.locale;
            return (
              <Pressable
                key={option.locale}
                onPress={() => setLocale(option.locale)}
                className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5 ${
                  isActive
                    ? "bg-accent/15"
                    : "active:bg-gray-100 dark:active:bg-slate-700"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-accent"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
