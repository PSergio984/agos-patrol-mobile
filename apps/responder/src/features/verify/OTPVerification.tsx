import { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { isAxiosError } from "axios";
import Container from "./components/Container";
import VerifyScreenLayout from "./components/VerifyScreenLayout";
import InputOTPField from "./components/InputOTPField";
import { formatPHNumber } from "./utils/phone";
import { verifyAPI } from "../../lib/api/verify";
import { setResponderId, setResponderToken } from "../../lib/storage";
import { useVerify } from "./context/VerifyPageContext";
import { useI18n } from "../../context/I18nContext";

/**
 * Port of PWA src/pages/Verify/pages/OTPVerification.tsx.
 * - navigate("/verify/phone-lookup") → router.replace("/(auth)/verify")
 *   (replace keeps a deep-linked /otp from trapping the back stack)
 * - localStorage session writes → async storage helpers + axios token cache
 * - navigate("/home") → router.replace("/(tabs)")
 */
export default function OTPVerification() {
  const { responderDetails } = useVerify();
  const { t } = useI18n();

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [otpError, setOtpError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [requiresResend, setRequiresResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(
    responderDetails?.devOtp ?? null
  );

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (responderDetails === null) {
      router.replace("/(auth)/verify");
    }
  }, [responderDetails]);

  const handleVerify = async (code: string) => {
    if (!responderDetails) return;
    setIsVerifying(true);
    setOtpError("");
    setRequiresResend(false);

    try {
      const res = await verifyAPI.verifyOTP({
        responderId: responderDetails.responderId,
        otp: code,
      });

      if (res.success) {
        await setResponderId(responderDetails.responderId);
        if (res.responderToken) {
          await setResponderToken(res.responderToken);
        }
        router.replace("/(tabs)");
      } else {
        setOtpError(res.message || "Verification failed. Please try again.");
        setRequiresResend(res.requiresResend);
        setOtp(new Array(6).fill(""));
        inputRefs.current?.[0]?.focus();
      }
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 429) {
          setOtpError(
            "Too many attempts. Please wait a few minutes before trying again."
          );
        } else if (err.code === "ECONNABORTED" || !err.response) {
          setOtpError(
            "Network error. Please check your connection and try again."
          );
        } else {
          setOtpError(
            err.response?.data?.detail ||
              err.response?.data?.message ||
              "Something went wrong. Please try again."
          );
        }
      } else {
        setOtpError("Something went wrong. Please try again.");
      }
      setOtp(new Array(6).fill(""));
      inputRefs.current?.[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!responderDetails) return;
    setIsResending(true);
    setOtpError("");
    setResendSuccess(false);
    setDevOtp(null);

    try {
      const res = await verifyAPI.resendVerificationOTP(
        responderDetails.responderId
      );
      setDevOtp(res.devOtp);
      setResendSuccess(true);
      setRequiresResend(false);
      setOtp(new Array(6).fill(""));
      inputRefs.current?.[0]?.focus();
    } catch {
      setOtpError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!responderDetails) {
    return null;
  }

  return (
    <VerifyScreenLayout>
      <Container
        headerTitle={t("verify.enterCode")}
        headerSubtitle={t("verify.enterCodeSubtitle")}
      >
        <View className="mt-5">
          <View className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg items-center mb-6">
            <Text className="font-semibold text-gray-900 dark:text-gray-100">
              {responderDetails.firstName} {responderDetails.lastName}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {formatPHNumber(responderDetails.phoneNumber)}
            </Text>
          </View>

          {devOtp && (
            <View className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 items-center dark:border-amber-700 dark:bg-amber-950/50">
              <Text className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {t("verify.demoOtp")}
              </Text>
              <Text className="mt-1 font-mono text-2xl font-bold tracking-widest text-amber-900 dark:text-amber-100">
                {devOtp}
              </Text>
            </View>
          )}

          <View className="items-center">
            <InputOTPField
              isLoading={isVerifying}
              disabled={requiresResend}
              otp={otp}
              setOtp={setOtp}
              setErrorMessage={setOtpError}
              handleVerify={handleVerify}
              inputRefs={inputRefs}
            />

            {otpError !== "" && (
              <Text className="mt-3 text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 py-2 px-2 border border-red-200 dark:border-red-700 rounded-md">
                {otpError}
              </Text>
            )}

            {resendSuccess && (
              <Text className="mt-3 text-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 py-2 px-2 border border-green-200 dark:border-green-700 rounded-md">
                {t("verify.newCodeSent")}
              </Text>
            )}

            {isVerifying && (
              <View className="mt-4 flex-row items-center justify-center gap-2">
                <ActivityIndicator size="small" color="#0A3D62" />
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  {t("verify.verifying")}
                </Text>
              </View>
            )}

            <View className="mt-4 items-center">
              {requiresResend ? (
                <Pressable
                  onPress={() => void handleResendOTP()}
                  disabled={isResending}
                  style={({ pressed }) => ({
                    opacity: isResending ? 0.5 : pressed ? 0.8 : 1,
                  })}
                >
                  <Text className="text-sm font-medium text-primary dark:text-accent">
                    {isResending
                      ? t("verify.sending")
                      : t("verify.sendNewCode")}
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {t("verify.didntReceive")}{" "}
                  <Text
                    onPress={() => {
                      if (!isResending) void handleResendOTP();
                    }}
                    className="font-medium text-primary dark:text-accent"
                    style={{
                      opacity: isResending ? 0.5 : 1,
                    }}
                  >
                    {isResending ? t("verify.sending") : t("verify.resend")}
                  </Text>
                </Text>
              )}
            </View>
          </View>
        </View>

        <Text className="mt-6 text-center text-xs text-gray-500">
          {t("verify.agreement")}
        </Text>
      </Container>
    </VerifyScreenLayout>
  );
}
