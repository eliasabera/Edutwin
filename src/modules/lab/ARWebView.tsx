/*
Supabase Storage CORS Setup (SQL Editor):

1) Open Supabase -> SQL Editor -> New query.
2) Run this statement to allow public GET/HEAD/OPTIONS from any origin for bucket `3d-models`.

update storage.buckets
set
  cors_origins = '["*"]'::jsonb,
  cors_methods = '["GET","HEAD","OPTIONS"]'::jsonb
where id = '3d-models';

3) If your project schema differs, use Dashboard path:
Storage -> Buckets -> 3d-models -> CORS -> allow origin * and methods GET, HEAD, OPTIONS.
*/

import type { ArTopic } from "@/shared/services/ar-service";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  type AppStateStatus,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  topic: ArTopic;
  fullScreen?: boolean;
  transparentBackground?: boolean;
  onSessionEnded?: () => void;
};

type ArLaunchStage =
  | "checking-device"
  | "checking-model"
  | "launching"
  | "error";

const DEFAULT_HEART_MODEL_URL =
  "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/3d-models/beating_heart.glb";

const withTimeout = async <T,>(
  promise: Promise<T>,
  ms: number,
  message: string,
) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const buildSceneViewerUrl = (modelUrl: string, titleText: string) => {
  const file = encodeURIComponent(modelUrl);
  const title = encodeURIComponent(titleText);
  return `https://arvr.google.com/scene-viewer/1.0?file=${file}&mode=ar_only&resizable=true&title=${title}`;
};

const buildSceneViewerIntentUrl = (modelUrl: string, titleText: string) => {
  const file = encodeURIComponent(modelUrl);
  const title = encodeURIComponent(titleText);
  const fallback = encodeURIComponent(buildSceneViewerUrl(modelUrl, titleText));
  return `intent://arvr.google.com/scene-viewer/1.0?file=${file}&mode=ar_only&resizable=true&title=${title}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
};

const checkModelAvailability = async (modelUrl: string) => {
  const response = await withTimeout(
    fetch(modelUrl, {
      method: "HEAD",
      cache: "no-store",
      headers: {
        Accept: "model/gltf-binary,application/octet-stream,*/*",
      },
    }),
    10000,
    "Model check timed out",
  );

  if (!response.ok) {
    throw new Error(`Model URL returned ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || "0");
  return {
    contentLength: Number.isFinite(contentLength) ? contentLength : 0,
  };
};

const getLaunchStatusMessage = (stage: ArLaunchStage) => {
  if (stage === "checking-device") {
    return "Checking AR support on this device...";
  }

  if (stage === "checking-model") {
    return "Preparing your model for AR...";
  }

  return "Opening camera AR experience...";
};

export default function ARWebView({
  topic,
  fullScreen = false,
  transparentBackground = false,
  onSessionEnded,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const backgroundColor = transparentBackground
    ? "transparent"
    : isDark
      ? "#08111F"
      : "#F4F7FC";
  const modelUrl = topic.modelUrl || DEFAULT_HEART_MODEL_URL;
  const modelTitle = topic.title || "AR Model";
  const sceneViewerIntentUrl = useMemo(
    () => buildSceneViewerIntentUrl(modelUrl, modelTitle),
    [modelTitle, modelUrl],
  );
  const sceneViewerUrl = useMemo(
    () => buildSceneViewerUrl(modelUrl, modelTitle),
    [modelTitle, modelUrl],
  );
  const hasLaunchedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [stage, setStage] = useState<ArLaunchStage>("checking-device");
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [wasExternalArOpened, setWasExternalArOpened] = useState(false);

  const openRealWorldAR = useCallback(async (): Promise<boolean> => {
    setLaunchError(null);

    if (Platform.OS !== "android") {
      setStage("error");
      setLaunchError(
        "This model is GLB. iPhone real-world AR requires USDZ. Upload a USDZ model to enable Quick Look AR.",
      );
      return false;
    }

    setStage("checking-device");
    const [canOpenIntent, canOpenFallback] = await Promise.all([
      Linking.canOpenURL(sceneViewerIntentUrl),
      Linking.canOpenURL(sceneViewerUrl),
    ]);

    if (!canOpenIntent && !canOpenFallback) {
      setStage("error");
      setLaunchError(
        "This device cannot open Google Scene Viewer. Update Google app/Chrome and Google Play Services for AR.",
      );
      return false;
    }

    setStage("checking-model");
    try {
      const { contentLength } = await checkModelAvailability(modelUrl);
      const modelSizeMb = contentLength / (1024 * 1024);
      if (contentLength > 0 && modelSizeMb > 35) {
        setStage("error");
        setLaunchError(
          "This AR model is very large and may crash or close on some phones. Optimize the GLB to under 35 MB and try again.",
        );
        return false;
      }
    } catch {
      setStage("error");
      setLaunchError(
        "The AR model could not be loaded. Check Supabase file permissions, CORS, and network connection.",
      );
      return false;
    }

    setStage("launching");

    if (Platform.OS === "android") {
      try {
        setWasExternalArOpened(true);
        await Linking.openURL(sceneViewerIntentUrl);
        return true;
      } catch {
        try {
          setWasExternalArOpened(true);
          await Linking.openURL(sceneViewerUrl);
          return true;
        } catch {
          Linking.openURL("market://details?id=com.google.ar.core").catch(
            () => {
              // Keep silent if Play Store is unavailable.
            },
          );
          setStage("error");
          setLaunchError(
            "Install or update Google Play Services for AR, then try again.",
          );
        }
      }
      return false;
    }

    return false;
  }, [modelUrl, sceneViewerIntentUrl, sceneViewerUrl]);

  useEffect(() => {
    if (hasLaunchedRef.current) {
      return;
    }

    hasLaunchedRef.current = true;
    openRealWorldAR().catch(() => {
      setStage("error");
      setLaunchError("Could not open AR. Try again.");
    });
  }, [openRealWorldAR]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const wasInBackground =
        appStateRef.current === "background" ||
        appStateRef.current === "inactive";

      if (wasInBackground && nextState === "active" && wasExternalArOpened) {
        if (onSessionEnded) {
          onSessionEnded();
        } else {
          setStage("error");
          setLaunchError(
            "AR session ended. Tap Retry AR Launch to open it again.",
          );
        }
      }

      appStateRef.current = nextState;
    });

    return () => {
      sub.remove();
    };
  }, [onSessionEnded, wasExternalArOpened]);

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreenContainer,
        { backgroundColor },
      ]}
    >
      <View style={styles.content}>
        {launchError ? (
          <>
            <Text style={styles.title}>AR Launch Failed</Text>
            <Text style={styles.subtitle}>{launchError}</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Launching AR</Text>
            <Text style={styles.subtitle}>{getLaunchStatusMessage(stage)}</Text>
          </>
        )}
      </View>
      {launchError ? (
        <Pressable
          style={styles.arLaunchButton}
          onPress={() => {
            setWasExternalArOpened(false);
            openRealWorldAR().catch(() => {
              setStage("error");
              setLaunchError("Could not open AR. Try again.");
            });
          }}
        >
          <Text style={styles.arLaunchButtonText}>Retry AR Launch</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F4F7FC", // Default background color
  },
  fullScreenContainer: {
    borderRadius: 0,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  arLaunchButton: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#0B5FFF",
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  arLaunchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
