import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const HEART_MODEL_ID = "d9845afb1ee64ad094adc96320c67d98";

const HEART_PARTS: Record<number, { title: string; description: string }> = {
  0: {
    title: "Right Atrium",
    description:
      "Receives deoxygenated blood returning from the body through the superior and inferior vena cava. This chamber collects blood before passing it through the tricuspid valve into the right ventricle.",
  },
  1: {
    title: "Right Ventricle",
    description:
      "Pumps deoxygenated blood to the lungs through the pulmonary artery. Its muscular wall contracts to send blood for gas exchange, where carbon dioxide is removed and oxygen is absorbed.",
  },
  2: {
    title: "Left Atrium",
    description:
      "Receives oxygen-rich blood from the lungs through the pulmonary veins. It then pushes this oxygenated blood through the mitral valve into the left ventricle for systemic circulation.",
  },
  3: {
    title: "Left Ventricle",
    description:
      "The strongest and most muscular chamber of the heart. It pumps oxygenated blood into the aorta with enough force to deliver blood to all parts of the body.",
  },
};

const FALLBACK_PART = {
  title: "Heart Structure",
  description:
    "This hotspot is not mapped yet in the textbook dictionary. Add its index to HEART_PARTS.",
};

const SURFACE_BG = "rgba(255, 255, 255, 0.9)";
const SURFACE_BORDER = "rgba(11, 95, 255, 0.18)";
const SURFACE_SHADOW = "#0E234E";

const buildHeartViewerHtml = (modelId: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: rgba(3, 7, 18, 1);
      }

      #api-frame {
        width: 100%;
        height: 100%;
        border: 0;
        background: rgba(3, 7, 18, 1);
      }
    </style>
    <script src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"></script>
  </head>
  <body>
    <iframe
      id="api-frame"
      title="Beating Heart"
      allow="autoplay; fullscreen; xr-spatial-tracking"
      allowfullscreen
    ></iframe>

    <script>
      (function initHeartViewer() {
        var iframe = document.getElementById("api-frame");
        if (!iframe || !window.Sketchfab) {
          return;
        }

        var client = new window.Sketchfab(iframe);

        client.init("${modelId}", {
          autostart: 1,
          preload: 1,
          transparent: 1,
          ui_infos: 0,
          ui_controls: 1,
          ui_stop: 0,
          ui_watermark: 0,
          ui_annotations: 0,
          success: function onSuccess(api) {
            api.start();

            api.addEventListener("annotationSelect", function onAnnotationSelect(index) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(String(index));
              }
            });
          },
          error: function onError() {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage("error:viewer_init_failed");
            }
          },
        });
      })();
      true;
    </script>
  </body>
</html>
`;

export default function HeartViewer() {
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);

  const html = useMemo(() => buildHeartViewerHtml(HEART_MODEL_ID), []);

  const partInfo =
    selectedPart !== null ? (HEART_PARTS[selectedPart] ?? FALLBACK_PART) : null;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html, baseUrl: "https://localhost" }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webView}
        onMessage={(event) => {
          const payload = event.nativeEvent.data?.trim();

          if (!payload) {
            return;
          }

          if (payload.startsWith("error:")) {
            setViewerError(
              "Unable to initialize the heart viewer. Check network access and try again.",
            );
            setSelectedPart(null);
            return;
          }

          const parsed = Number.parseInt(payload, 10);
          if (!Number.isNaN(parsed) && HEART_PARTS[parsed]) {
            setSelectedPart(parsed);
            setViewerError(null);
          }
        }}
      />

      <View style={styles.annotationRail}>
        {Object.entries(HEART_PARTS).map(([index, part]) => {
          const annotationIndex = Number(index);
          const active = selectedPart === annotationIndex;

          return (
            <Pressable
              key={index}
              onPress={() => {
                setSelectedPart(annotationIndex);
                setViewerError(null);
              }}
              style={({ pressed }) => [
                styles.annotationDot,
                active && styles.annotationDotActive,
                pressed && styles.annotationDotPressed,
              ]}
            >
              <Text
                style={[
                  styles.annotationDotText,
                  active && styles.annotationDotTextActive,
                ]}
              >
                {annotationIndex + 1}
              </Text>
              <Text style={styles.annotationDotLabel} numberOfLines={1}>
                {part.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {viewerError ? (
        <View pointerEvents="none" style={styles.overlayArea}>
          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>Viewer Error</Text>
            <Text style={styles.cardDescription}>{viewerError}</Text>
          </View>
        </View>
      ) : null}

      {partInfo ? (
        <View style={styles.overlayArea}>
          <View style={styles.glassCard}>
            <Pressable
              onPress={() => setSelectedPart(null)}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              hitSlop={8}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </Pressable>

            <Text style={styles.cardTitle}>{partInfo.title}</Text>
            <Text style={styles.cardDescription}>{partInfo.description}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  annotationRail: {
    position: "absolute",
    top: 18,
    right: 14,
    gap: 8,
    maxWidth: 126,
    zIndex: 30,
    elevation: 30,
  },
  annotationDot: {
    minHeight: 34,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: SURFACE_BG,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  annotationDotActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  annotationDotPressed: {
    opacity: 0.9,
  },
  annotationDotText: {
    width: 18,
    color: "#35507E",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  annotationDotTextActive: {
    color: "#FFFFFF",
  },
  annotationDotLabel: {
    flex: 1,
    color: "#35507E",
    fontSize: 11,
    fontWeight: "700",
  },
  overlayArea: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
    zIndex: 40,
    elevation: 40,
  },
  glassCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    backgroundColor: SURFACE_BG,
    shadowColor: SURFACE_SHADOW,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F8FF",
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  closeButtonText: {
    color: "#35507E",
    fontSize: 12,
    fontWeight: "800",
  },
  cardTitle: {
    color: "#1A202C",
    fontSize: 15,
    fontWeight: "800",
    marginRight: 32,
    marginBottom: 6,
  },
  cardDescription: {
    color: "#5A6C87",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
});
