import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import Container from "./components/Container";
import VerifyScreenLayout from "./components/VerifyScreenLayout";
import { normalizeNumberInput, formatPHNumber } from "./utils/phone";
import PhoneNumberInput from "./components/PhoneNumberInput";
import { verifyAPI } from "../../lib/api/verify";
import { useVerify } from "./context/VerifyPageContext";
import { useI18n } from "../../context/I18nContext";
import { apiErrorMessage } from "../../lib/utils/apiError";

/**
 * Port of PWA src/pages/Verify/pages/PhoneLookup.tsx.
 * navigate("/verify/otp-verification") → router.push("/(auth)/otp").
 * The .spinner div maps to ActivityIndicator tinted to the PWA's currentColor
 * (button text color: gray-100 light / slate-900 dark).
 */
export default function PhoneLookup() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [normalizedPhoneNumber, setNormalizedPhoneNumber] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setResponderDetails } = useVerify();

  // Clear any stale responder details from a previous verify session —
  // the PWA's VerifyPageProvider reset on unmount; this store persists
  // for the app lifetime so it must be cleared on flow entry.
  useEffect(() => {
    setResponderDetails(null);
  }, [setResponderDetails]);
  const { t } = useI18n();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleInputNumber = (input: string) => {
    setError(null);
    normalizeNumberInput(input, setPhoneNumber, setNormalizedPhoneNumber);
  };

  // PWA: disabled={normalizedPhoneNumber.length < 13} ("+63" + 10 digits)
  const isReady = normalizedPhoneNumber.length >= 13;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await verifyAPI.getResponderDetailsForApproval({
        phoneNumber: normalizedPhoneNumber,
      });
      setResponderDetails(res);
      router.push("/(auth)/otp");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Unable to reach the server. Please check your connection and try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VerifyScreenLayout>
      <Container
        headerTitle={t("verify.activateAccount")}
        headerSubtitle={t("verify.activateSubtitle")}
      >
        {error && (
          <Text className="text-sm mt-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 py-2 px-2 border border-red-500 dark:border-red-700 rounded-md">
            {error}
          </Text>
        )}
        <View className="mt-5">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("verify.mobileNumber")}
          </Text>
          <PhoneNumberInput
            value={phoneNumber}
            onChange={handleInputNumber}
            onSubmit={() => {
              if (isReady) void handleSubmit();
            }}
          />
          {normalizedPhoneNumber !== "" && (
            <Text className="text-sm mt-1 text-gray-500">{`${t("verify.fullNumber")} ${formatPHNumber(normalizedPhoneNumber)}`}</Text>
          )}
          {/* PWA .btn-submit */}
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={!isReady}
            className="mt-5 w-full flex-row items-center justify-center gap-3 rounded-xl py-3 bg-primary dark:bg-accent"
            style={({ pressed }) => ({
              opacity: !isReady ? 0.5 : pressed ? 0.9 : 1,
            })}
          >
            {isSubmitting && (
              <ActivityIndicator
                size="small"
                color={isDark ? "#0f172a" : "#f3f4f6"}
              />
            )}
            <Text className="text-gray-100 dark:text-slate-900">
              {t("verify.continue")}
            </Text>
          </Pressable>
        </View>
      </Container>
    </VerifyScreenLayout>
  );
}
