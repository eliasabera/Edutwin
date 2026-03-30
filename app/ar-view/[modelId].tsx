import { COLORS } from "@/shared/constants/colors";
import { getArTopicById } from "@/shared/services/ar-service";
import ARWebView from "@/src/modules/lab/ARWebView";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ArViewScreen() {
  const { modelId } = useLocalSearchParams<{ modelId?: string }>();
  const topic = modelId ? getArTopicById(modelId) : null;
  const [cameraPermission, requestPermission] = useCameraPermissions();

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
        <ARWebView topic={topic} fullScreen transparentBackground />
      </View>

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
