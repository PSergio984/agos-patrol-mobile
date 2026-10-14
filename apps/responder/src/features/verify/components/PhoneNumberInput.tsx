import { Text, TextInput, View } from "react-native";
import { formatPhoneInputDisplay } from "../utils/phone";

interface PhoneNumberInputProps {
  value: string;
  onChange: (input: string) => void;
  /** Optional keyboard "done" action — submits when the parent passes it. */
  onSubmit?: () => void;
}

/**
 * Port of PWA src/pages/Verify/components/PhoneNumberInput.tsx.
 *
 * DOM → RN notes:
 * - The keydown allow-list is unnecessary — `keyboardType="number-pad"`
 *   restricts input and `normalizeNumberInput` strips non-digits anyway.
 * - Clipboard paste needs no handler: pasted text arrives via onChangeText
 *   and the digits-only normalization handles it.
 * - `p-0` on the TextInput removes Android's default inner padding so the
 *   row keeps the PWA's py-2.5 spacing.
 * - `placeholder-gray-400` (no dark variant in the PWA) → #9ca3af constant.
 */
export default function PhoneNumberInput({
  value,
  onChange,
  onSubmit,
}: PhoneNumberInputProps) {
  return (
    <View className="flex-row items-center border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 px-3 py-2.5">
      <Text className="text-gray-400 dark:text-gray-500 mr-2 border-r border-gray-400 dark:border-slate-500 pr-3">
        +63
      </Text>
      <TextInput
        className="flex-1 p-0 text-gray-900 dark:text-gray-100"
        placeholder="9XX XXX XXXX"
        placeholderTextColor="#9ca3af"
        maxLength={12}
        keyboardType="number-pad"
        autoComplete="tel"
        value={formatPhoneInputDisplay(value)}
        onChangeText={onChange}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}
