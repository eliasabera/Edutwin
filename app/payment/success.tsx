import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  clearPendingTransaction,
  formatDate,
  getPendingTransactionRef,
  verifyChapaPayment,
} from "@/shared/services/subscription-service";
import type { UserSubscription } from "@/shared/services/subscription-service";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  const txRefParam = useMemo(() => {
    const raw = params.tx_ref;
    if (Array.isArray(raw)) return raw[0];
    return typeof raw === "string" ? raw : null;
  }, [params.tx_ref]);

  useEffect(() => {
    const verifyPayment = async () => {
      setLoading(true);
      setError(null);

      const txRef = txRefParam || (await getPendingTransactionRef());
      if (!txRef) {
        setError("Missing transaction reference.");
        setLoading(false);
        return;
      }

      const result = await verifyChapaPayment(txRef);
      if (!result.verified) {
        setError(result.message || "Payment verification failed.");
        setLoading(false);
        return;
      }

      await clearPendingTransaction();
      setSubscription(result.subscription ?? null);
      setLoading(false);
    };

    void verifyPayment();
  }, [txRefParam]);

  const planLabel = subscription?.plan_type === "premium_yearly"
    ? "Premium Yearly"
    : subscription?.plan_type === "premium_monthly"
      ? "Premium Monthly"
      : "Premium";

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0B5FFF" />
        <Text style={styles.subtitle}>Verifying your payment...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Payment verification failed</Text>
        <Text style={styles.subtitle}>{error}</Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace("/settings")}
        >
          <Text style={styles.buttonText}>Back to Settings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment successful</Text>
      <Text style={styles.subtitle}>Your subscription is active.</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Plan</Text>
        <Text style={styles.cardValue}>{planLabel}</Text>
        <Text style={styles.cardLabel}>Valid until</Text>
        <Text style={styles.cardValue}>
          {formatDate(subscription?.current_period_end)}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.replace("/settings")}
      >
        <Text style={styles.buttonText}>Go to Settings</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
        onPress={() => router.replace("/home")}
      >
        <Text style={styles.linkButtonText}>Go to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#12233F",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#4E6387",
    textAlign: "center",
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#DCE9FC",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 6,
  },
  cardLabel: {
    fontSize: 12,
    color: "#6D84AA",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#12233F",
    marginBottom: 6,
  },
  button: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  linkButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE9FC",
    alignItems: "center",
  },
  linkButtonPressed: {
    opacity: 0.8,
  },
  linkButtonText: {
    color: "#35507E",
    fontWeight: "600",
  },
});
