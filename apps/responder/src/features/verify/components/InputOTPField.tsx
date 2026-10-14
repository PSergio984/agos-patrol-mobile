import { useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";

interface InputOTPFieldProps {
  isLoading: boolean;
  disabled?: boolean;
  otp: string[];
  setOtp: Dispatch<SetStateAction<string[]>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
  handleVerify: (code: string) => Promise<void>;
  inputRefs: RefObject<(TextInput | null)[]>;
}

/**
 * Port of PWA src/pages/Verify/components/InputOTPField.tsx — six boxes,
 * auto-advance, auto-verify on the 6th digit.
 *
 * DOM → RN notes:
 * - onPaste has no RN equivalent. Multi-character input arriving in a single
 *   onChangeText (paste, or iOS/Android one-time-code autofill) is treated
 *   like the PWA's paste path: digits fill boxes from index 0 and a full
 *   6-digit code verifies immediately. Typing a digit over a filled box
 *   produces a 2-char change — kept as a replace of that box (PWA's
 *   `value.substring(length - 1)` semantics) rather than a paste.
 * - Backspace on an empty box focuses the previous box (RN onKeyPress).
 * - Arrow-key handling is dropped — mobile keyboards have none.
 * - focus:border-primary needs a focus state in RN → focusedIndex state.
 */
export default function InputOTPField({
  isLoading,
  disabled = false,
  otp,
  setOtp,
  setErrorMessage,
  handleVerify,
  inputRefs,
}: InputOTPFieldProps) {
  const isLocked = isLoading || disabled;
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // PWA onPaste path — digits fill the whole array starting at index 0.
  const fillFromPaste = (digits: string) => {
    const data = digits.slice(0, 6);
    const newOtp = data.split("");
    const fullOtp = [...newOtp, ...new Array(6 - newOtp.length).fill("")];
    setOtp(fullOtp);

    if (data.length === 6) {
      handleVerify(data);
    } else {
      inputRefs.current?.[data.length]?.focus();
    }
  };

  const handleChange = (value: string, index: number) => {
    if (isLocked) return;

    if (value && !/^\d+$/.test(value)) return;

    setErrorMessage("");

    // Multi-char change = paste/autofill, unless it's exactly one extra
    // char over an occupied box (typing over a filled digit → replace).
    if (value.length > 1 && !(value.length === 2 && otp[index])) {
      fillFromPaste(value);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    const currentCode = newOtp.join("");

    if (currentCode.length === 6) {
      handleVerify(currentCode);
    } else if (value && index < 5) {
      inputRefs.current?.[index + 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    // PWA handleClick: tapping a box past the first empty one redirects
    // focus to the first empty box.
    const firstEmptyIndex = otp.findIndex((val) => val === "");
    if (firstEmptyIndex !== -1 && index > firstEmptyIndex) {
      inputRefs.current?.[firstEmptyIndex]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current?.[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row items-center justify-center gap-2">
      {otp.map((digit, index) => (
        <TextInput
          editable={!isLocked}
          key={index}
          ref={(el) => {
            if (inputRefs.current) {
              inputRefs.current[index] = el;
            }
          }}
          value={digit}
          onFocus={() => handleFocus(index)}
          onBlur={() => setFocusedIndex((cur) => (cur === index ? null : cur))}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onChangeText={(value) => handleChange(value, index)}
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          className={`w-12 h-14 text-center border-2 bg-transparent dark:text-gray-100 text-xl font-semibold rounded-lg ${
            focusedIndex === index
              ? "border-primary"
              : "border-gray-300 dark:border-slate-600"
          } ${isLocked ? "bg-gray-100 dark:bg-slate-700/50 text-gray-400 dark:text-gray-500" : ""}`}
        />
      ))}
    </View>
  );
}
