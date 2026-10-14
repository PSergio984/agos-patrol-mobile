import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useAlertsPageHook } from "../../context/AlertsPageContext";
import {
  Header,
  NotificationDetails,
  AcknowledgeNotification,
  AcknowledgementDetails,
} from "./components/PageComponents";

// RN port of the PWA bottom-sheet drawer (DrawerContainer + sliding panel):
// Modal with slide animation, translucent backdrop tap-to-close, and
// onRequestClose covering the Android back button (the PWA's Escape handler).
export default function AlertDetails() {
  const { chosenAlert, handleCloseAlertDetail } = useAlertsPageHook();
  const isOpen = Boolean(chosenAlert);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleCloseAlertDetail}
    >
      <Pressable
        className="flex-1 bg-black/30 justify-end"
        onPress={handleCloseAlertDetail}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            className="rounded-t-2xl bg-white dark:bg-slate-800 p-4"
            style={{ maxHeight: "80%" }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {chosenAlert && (
                <View className="gap-4">
                  <View className="w-full items-center">
                    <View className="h-1.5 rounded-full w-16 bg-gray-300 dark:bg-slate-600" />
                  </View>

                  <Header
                    type={chosenAlert.type}
                    title={chosenAlert.title}
                    isAcknowledged={chosenAlert.isAcknowledged}
                  />

                  <NotificationDetails
                    message={chosenAlert.message}
                    timestamp={chosenAlert.timestamp}
                  />

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
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
