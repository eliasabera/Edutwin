import type { ArTopic } from "@/shared/services/ar-service";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  topic: ArTopic;
  fullScreen?: boolean;
  transparentBackground?: boolean;
};

const DEFAULT_SKETCHFAB_MODEL_UID = "d9845afb1ee64ad094adc96320c67d98";

const extractSketchfabModelUid = (url?: string) => {
  if (!url) {
    return null;
  }
  const match = url.match(/sketchfab\.com\/models\/([a-zA-Z0-9]+)\/embed/i);
  return match?.[1] ?? null;
};

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

const DEFAULT_ANNOTATION = {
  title: "Heart Anatomy",
  description:
    "Tap a numbered hotspot on the model to see the English textbook explanation.",
};

const SURFACE_BG = "rgba(255, 255, 255, 0.9)";
const SURFACE_BORDER = "rgba(11, 95, 255, 0.18)";
const SURFACE_SHADOW = "#0E234E";

const buildSketchfabHtml = (modelUid: string, darkBackground: string) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      html,
      body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: ${darkBackground};
      }

      #api-frame {
        width: 100%;
        height: 100%;
        border: 0;
        background: ${darkBackground};
      }
    </style>
    <script src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"></script>
  </head>
  <body>
    <iframe id="api-frame" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>

    <script>
      (function initSketchfabViewer() {
        var iframe = document.getElementById("api-frame");
        if (!iframe || !window.Sketchfab) {
          return;
        }

        var client = new window.Sketchfab(iframe);

        client.init("${modelUid}", {
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
</html>`;

export default function ARWebView({
  topic,
  fullScreen = false,
  transparentBackground = false,
}: Props) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<number | null>(
    null,
  );
  const [viewerError, setViewerError] = useState<string | null>(null);

  const backgroundColor = transparentBackground ? "transparent" : "#F4F7FC";
  const modelUid =
    extractSketchfabModelUid(topic.webViewerUrl) ?? DEFAULT_SKETCHFAB_MODEL_UID;

  const html = useMemo(
    () => buildSketchfabHtml(modelUid, backgroundColor),
    [backgroundColor, modelUid],
  );

  const annotationInfo =
    selectedAnnotation !== null
      ? (HEART_PARTS[selectedAnnotation] ?? {
          title: `Heart Part ${selectedAnnotation + 1}`,
          description:
            "This hotspot is not mapped yet in the English dictionary.",
        })
      : DEFAULT_ANNOTATION;

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreenContainer,
        { backgroundColor },
      ]}
    >
      <WebView
        source={{ html, baseUrl: "https://localhost" }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
        onMessage={(event) => {
          const payload = event.nativeEvent.data?.trim();

          if (!payload) {
            return;
          }

          if (payload.startsWith("error:")) {
            setViewerError(
              "Unable to initialize the 3D viewer. Please check your network and try again.",
            );
            return;
          }

          const index = Number.parseInt(payload, 10);
          if (!Number.isNaN(index) && HEART_PARTS[index]) {
            setSelectedAnnotation(index);
            setViewerError(null);
          }
        }}
      />

      <View style={styles.annotationRail}>
        {Object.entries(HEART_PARTS).map(([index, part]) => {
          const annotationIndex = Number(index);
          const active = selectedAnnotation === annotationIndex;

          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.annotationDot,
                active && styles.annotationDotActive,
                pressed && styles.annotationDotPressed,
              ]}
              onPress={() => {
                setSelectedAnnotation(annotationIndex);
                setViewerError(null);
              }}
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

      <View pointerEvents="none" style={styles.overlayWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>English Guide</Text>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.glassTitle}>{annotationInfo.title}</Text>
          <Text style={styles.glassBody}>
            {viewerError ?? annotationInfo.description}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F4F7FC",
  },
  fullScreenContainer: {
    borderRadius: 0,
  },
  webview: {
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
  overlayWrap: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 18,
    gap: 10,
    zIndex: 40,
    elevation: 40,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    backgroundColor: "#E7F0FF",
  },
  badgeText: {
    color: "#0B5FFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  glassCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    backgroundColor: SURFACE_BG,
    shadowColor: SURFACE_SHADOW,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  glassTitle: {
    color: "#1A202C",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  glassBody: {
    color: "#5A6C87",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
  },
});
