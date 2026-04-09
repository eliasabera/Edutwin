import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type ReaderLesson = {
  subject: "Biology" | "Chemistry" | "Physics" | "Math";
  textbookUrl: string;
};

type TextbookReaderScreenProps = {
  lesson?: ReaderLesson;
};

export default function TextbookReaderScreen({
  lesson,
}: TextbookReaderScreenProps) {
  const insets = useSafeAreaInsets();
  const textbookUrl = lesson?.textbookUrl?.trim();
  const viewerUrl = textbookUrl
    ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(textbookUrl)}`
    : "";

  if (!textbookUrl) {
    return (
      <View style={[styles.emptyWrap, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.emptyTitle}>No textbook URL found.</Text>
        <Text style={styles.emptyHint}>Please select a textbook from the library.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <WebView
        source={{ uri: viewerUrl }}
        style={styles.webView}
        originWhitelist={["*"]}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#0B5FFF" />
            <Text style={styles.loaderText}>Opening textbook...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  loaderText: {
    color: "#35507E",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  emptyTitle: {
    color: "#1A202C",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyHint: {
    marginTop: 8,
    color: "#5A6C87",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
