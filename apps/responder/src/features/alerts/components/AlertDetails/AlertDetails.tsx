import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlertsPageHook } from "../../context/AlertsPageContext";
import {
  Header,
  NotificationDetails,
  AcknowledgeNotification,
  AcknowledgementDetails,
  ClaimNotification,
  ClaimedDetails,
} from "./components/PageComponents";

// RN port of the PWA bottom-sheet drawer (DrawerContainer + sliding panel):
// Modal with slide animation, translucent backdrop tap-to-close, and
// onRequestClose covering the Android back button (the PWA's Escape handler).
// The acknowledge footer is pinned outside the ScrollView so the action is
// always reachable without scrolling, regardless of message length.
export default function AlertDetails() {
  const { chosenAlert, handleCloseAlertDetail } = useAlertsPageHook();
  const isOpen = Boolean(chosenAlert);
  // Sheet must clear the gesture-nav bar — without it the content bottom
  // sits under system chrome and reads as "cut off / needs scrolling".
  const insets = useSafeAreaInsets();
  // Numeric maxHeight — a "85%" string resolves against the KAV wrapper,
  // whose own height is content-derived, so the sheet collapses. Measuring
  // the window directly gives the cap a real reference frame.
  const { height: windowHeight } = useWindowDimensions();

  return (
    <Modal
      visible={isOpen}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={handleCloseAlertDetail}
    >
      <View className="flex-1 justify-end bg-black/30">
        <Pressable className="flex-1" onPress={handleCloseAlertDetail} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="rounded-t-2xl bg-white dark:bg-slate-800 pt-4"
            style={{
              maxHeight: windowHeight * 0.92,
              paddingBottom: Math.max(insets.bottom, 12),
            }}
          >
            <View className="w-full items-center pb-4">
              <View className="h-1.5 rounded-full w-16 bg-gray-300 dark:bg-slate-600" />
            </View>

            <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
              {chosenAlert && (
                <View className="gap-4 pb-2">
                  <Header
                    type={chosenAlert.type}
                    title={chosenAlert.title}
                    isAcknowledged={chosenAlert.isAcknowledged}
                    claimedBy={chosenAlert.claimedBy}
                    claimedByName={chosenAlert.claimedByName}
                  />

                  <NotificationDetails
                    message={chosenAlert.message}
                    timestamp={chosenAlert.timestamp}
                  />
                </View>
              )}
            </ScrollView>

            {chosenAlert && (
              <View className="px-4 pt-3 border-t border-gray-200 dark:border-slate-700 gap-3">
                {chosenAlert.type === "blockage" &&
                  (chosenAlert.claimedBy ? (
                    <ClaimedDetails
                      claimedBy={chosenAlert.claimedBy}
                      claimedByName={chosenAlert.claimedByName}
                      claimedAt={chosenAlert.claimedAt}
                    />
                  ) : !chosenAlert.isAcknowledged ? (
                    <ClaimNotification />
                  ) : null)}
                {chosenAlert.isAcknowledged ? (
                  <AcknowledgementDetails
                    acknowledgeMessage={chosenAlert.acknowledgeMessage}
                    acknowledgedAt={chosenAlert.acknowledgedAt!}
                  />
                ) : (
                  <AcknowledgeNotification />
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
