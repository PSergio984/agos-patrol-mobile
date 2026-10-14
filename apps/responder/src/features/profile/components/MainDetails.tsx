import { Pencil, Phone } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useColorScheme } from "nativewind";
import Card from "./common/Card";
import Skeleton from "./common/Skeleton";
import { useCoreHook } from "../../../context/CoreContext";
import { useI18n } from "../../../context/I18nContext";
import { responderAPI } from "../../../lib/api/responder";
import { formatPHNumber } from "../../../lib/utils/formatter";
import ConnectionStatus from "./ConnectionStatus";

const getLastChunkOfId = (id: string) => {
  let res = "";
  let i = id.length - 1;
  while (i >= 0 && id[i] !== "-") {
    res = id[i] + res;
    i--;
  }
  return res;
};

function NameEditor({ onClose }: { onClose: () => void }) {
  const { responder, setResponder } = useCoreHook();
  const { t } = useI18n();
  const [firstName, setFirstName] = useState(responder?.firstName ?? "");
  const [lastName, setLastName] = useState(responder?.lastName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<"first" | "last" | null>(
    null
  );

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const hasChanges =
    trimmedFirst !== responder?.firstName ||
    trimmedLast !== responder?.lastName;
  const isValid = !!trimmedFirst && !!trimmedLast;

  const handleSave = async () => {
    if (!responder || !isValid || !hasChanges || isSaving) return;

    const payload: { firstName?: string; lastName?: string } = {};
    if (trimmedFirst !== responder.firstName) payload.firstName = trimmedFirst;
    if (trimmedLast !== responder.lastName) payload.lastName = trimmedLast;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await responderAPI.updateResponderProfile(
        responder.id,
        payload
      );
      setResponder(updated);
      onClose();
    } catch {
      setError(t("profile.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (field: "first" | "last") =>
    `w-full rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-sm dark:text-white ${
      focusedField === field
        ? "border-accent"
        : "border-gray-300 dark:border-slate-600"
    }`;

  return (
    <View className="gap-2">
      <View className="gap-2">
        <View>
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t("profile.firstName")}
          </Text>
          <TextInput
            value={firstName}
            onChangeText={(text) => {
              setError(null);
              setFirstName(text);
            }}
            onFocus={() => setFocusedField("first")}
            onBlur={() => setFocusedField(null)}
            maxLength={100}
            className={inputClass("first")}
          />
        </View>
        <View>
          <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t("profile.lastName")}
          </Text>
          <TextInput
            value={lastName}
            onChangeText={(text) => {
              setError(null);
              setLastName(text);
            }}
            onFocus={() => setFocusedField("last")}
            onBlur={() => setFocusedField(null)}
            maxLength={100}
            className={inputClass("last")}
          />
        </View>
      </View>

      {error && (
        <Text className="text-xs text-red-600 dark:text-red-400">{error}</Text>
      )}
      {!isValid && (
        <Text className="text-xs text-amber-600 dark:text-amber-400">
          {t("profile.nameRequired")}
        </Text>
      )}

      <View className="flex-row justify-end gap-2 pt-1">
        <Pressable
          onPress={onClose}
          disabled={isSaving}
          className="rounded-lg px-3 py-1.5 active:bg-gray-100 dark:active:bg-slate-700"
        >
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t("profile.cancel")}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!isValid || !hasChanges || isSaving}
          className={`rounded-lg bg-accent px-3 py-1.5 ${
            !isValid || !hasChanges || isSaving ? "opacity-50" : ""
          }`}
        >
          <Text className="text-sm font-medium text-white">
            {isSaving ? t("profile.saving") : t("profile.save")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MainDetails() {
  const { responder } = useCoreHook();
  const { t } = useI18n();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isEditing, setIsEditing] = useState(false);

  if (!responder) {
    return <Skeleton className="h-28 w-full rounded-xl" />;
  }

  return (
    <Card className="px-4 py-5">
      <View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("profile.responderProfile")}
          </Text>
          <ConnectionStatus />
        </View>

        {isEditing ? (
          <View className="mt-3">
            <NameEditor onClose={() => setIsEditing(false)} />
          </View>
        ) : (
          <>
            <View className="flex-row justify-between items-end mt-2">
              <View className="gap-1">
                <Text className="font-bold text-2xl dark:text-white">
                  {`${responder.firstName || ""} ${responder.lastName || ""}`.trim() ||
                    "Unknown"}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Phone size={16} color={isDark ? "#d1d5db" : "#111827"} />
                  <Text className="text-sm dark:text-gray-300">
                    {responder.phoneNumber
                      ? formatPHNumber(responder.phoneNumber)
                      : "N/A"}
                  </Text>
                </View>
              </View>
              <View className="items-end gap-2">
                <Text className="text-xs font-medium bg-accent/10 rounded-full px-2 py-1 text-accent">
                  ID: {responder.id ? getLastChunkOfId(responder.id) : "N/A"}
                </Text>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  accessibilityLabel={t("profile.editName")}
                  className="flex-row items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-600 px-2 py-1 active:bg-gray-100 dark:active:bg-slate-700"
                >
                  <Pencil size={12} color={isDark ? "#d1d5db" : "#4b5563"} />
                  <Text className="text-xs text-gray-600 dark:text-gray-300">
                    {t("profile.editName")}
                  </Text>
                </Pressable>
              </View>
            </View>
            <Text className="mt-2 text-[0.7rem] text-gray-400 dark:text-gray-500 italic">
              {t("profile.phoneAdminOnly")}
            </Text>
          </>
        )}
      </View>
    </Card>
  );
}
