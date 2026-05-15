import { COLORS } from "@/shared/constants/colors";
import { getArTopicById, getArTopics } from "@/shared/services/ar-service";
import { useStudentProfile } from "@/shared/store/user-store";
import ARWebView from "@/src/modules/lab/ARWebView";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ArViewScreen() {
  const { modelId } = useLocalSearchParams<{ modelId?: string }>();
  const router = useRouter();
  const topic = modelId ? getArTopicById(modelId) : null;
  const studentProfile = useStudentProfile();
  const [cameraPermission, requestPermission] = useCameraPermissions();

  const freeArIds = useMemo(() => {
    const bySubject = new Map<string, string>();
    const chapterOrder = (value: string): number => {
      const match = String(value || "").match(/\d+/);
      return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
    };

    const sorted = [...getArTopics()].sort((a, b) => {
      const subjectOrder = String(a.subject).localeCompare(String(b.subject));
      if (subjectOrder !== 0) {
        return subjectOrder;
      }

      const chapterDiff = chapterOrder(a.chapter) - chapterOrder(b.chapter);
      if (chapterDiff !== 0) {
        return chapterDiff;
      }

      return String(a.topic).localeCompare(String(b.topic), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    for (const item of sorted) {
      const subject = String(item.subject || "").toLowerCase();
      if (!bySubject.has(subject)) {
        bySubject.set(subject, item.id);
      }
    }

    return new Set(Array.from(bySubject.values()));
  }, []);

  const hasAccess =
    topic &&
    (studentProfile.isSubscribed === true || freeArIds.has(topic.id));

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

  if (!hasAccess) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>This AR model is locked</Text>
        <Text style={styles.permissionSubtitle}>
          Your account is not subscribed. You can use one free AR model per
          subject, and this one requires subscription.
        </Text>
        <Pressable
          style={styles.permissionButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace("/(tabs)/lab");
          }}
        >
          <Text style={styles.permissionButtonText}>Back to Lab</Text>
        </Pressable>
      </View>
    );
  }

  if (!cameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </Pressable>
        <Text style={styles.permissionTitle}>Checking camera access...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access is needed</Text>
        <Text style={styles.permissionSubtitle}>
          Allow camera permission to continue with AR viewing.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView facing="back" style={styles.camera} />
      <View style={styles.modelLayer}>
        <ARWebView
          topic={topic}
          fullScreen
          transparentBackground
          onSessionEnded={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace("/(tabs)/lab");
          }}
        />
      </View>

      <Pressable
        style={styles.closeButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace("/(tabs)/lab");
        }}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </Pressable>

      <View style={styles.topOverlay}>
        <Text style={styles.overlayTitle}>{topic.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{topic.subject}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{topic.chapter}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050B15",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  modelLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    position: "absolute",
    top: 72,
    left: 16,
    right: 16,
    backgroundColor: "rgba(5, 11, 21, 0.54)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButton: {
    position: "absolute",
    top: 22,
    right: 16,
    backgroundColor: "rgba(5, 11, 21, 0.74)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#EAF1FF",
    fontWeight: "800",
    fontSize: 12,
  },
  overlayTitle: {
    fontSize: 16,
    color: "#EAF1FF",
    fontWeight: "800",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    backgroundColor: "rgba(23, 56, 112, 0.82)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaPillText: {
    color: "#D8E6FF",
    textTransform: "capitalize",
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#EAF1FF",
  },
  subtitle: {
    fontSize: 14,
    color: "#ACBEDF",
    marginTop: 8,
    lineHeight: 20,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#050B15",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionTitle: {
    marginTop: 14,
    fontSize: 18,
    color: "#EAF1FF",
    fontWeight: "700",
    textAlign: "center",
  },
  permissionSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: "#ACBEDF",
    textAlign: "center",
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 18,
    backgroundColor: "#2F7BFF",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
