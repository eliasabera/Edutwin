import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function PaymentCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const rawTxRef = params.tx_ref;
    const rawStatus = params.status;
    const txRef = Array.isArray(rawTxRef)
      ? rawTxRef[0]
      : typeof rawTxRef === "string"
        ? rawTxRef
        : null;
    const status = Array.isArray(rawStatus)
      ? rawStatus[0]
      : typeof rawStatus === "string"
        ? rawStatus
        : null;

    if (txRef) {
      const query = status ? `?tx_ref=${encodeURIComponent(txRef)}&status=${encodeURIComponent(status)}` : `?tx_ref=${encodeURIComponent(txRef)}`;
      router.replace(`/payment/success${query}`);
      return;
    }

    router.replace("/settings");
  }, [params.status, params.tx_ref, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0B5FFF" />
      <Text style={styles.text}>Processing your payment...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 14,
    color: "#4E6387",
  },
});
