import { COLORS } from "@/shared/constants/colors";
import { getArTopicById } from "@/shared/services/ar-service";
import { hasStudentLabAccess } from "@/shared/services/student-access-service";
import ARWebView from "@/src/modules/lab/ARWebView";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ArViewScreen() {
  const { modelId } = useLocalSearchParams<{ modelId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topic = modelId ? getArTopicById(modelId) : null;
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    void hasStudentLabAccess().then((allowed) => {
      if (mounted) {
        setHasAccess(allowed);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!topic) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>AR model not found</Text>
        <Text style={styles.subtitle}>
          The requested AR topic does not exist in the registry yet.
        </Text>
      </View>
    );
  }

  if (hasAccess === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>This AR model is locked</Text>
        <Text style={styles.permissionSubtitle}>
          Your 7-day free trial has ended. Subscribe to unlock all Canvas and AR
          models.
        </Text>
        <Pressable
          style={styles.permissionButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace("/settings");
          }}
        >
          <Text style={styles.permissionButtonText}>Go to subscription</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace("/(tabs)/lab");
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {topic.title}
        </Text>
      </View>
      <ARWebView topic={topic} fullScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#08111F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#12233F",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#5A6C87",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#12233F",
    marginBottom: 8,
    textAlign: "center",
  },
  permissionSubtitle: {
    fontSize: 14,
    color: "#5A6C87",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
