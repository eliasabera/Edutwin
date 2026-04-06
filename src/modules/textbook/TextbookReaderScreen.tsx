import {
    generateAIResponseStream,
    type ChatHistoryItem,
} from "@/shared/services/ai-service";
import type { SubjectName } from "@/shared/types/domain.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOKENS = {
  bgDeep: "#F4F7FC",
  bgMid: "#EAF1FF",
  textHeading: "#1A202C",
  textBody: "#35507E",
  textMuted: "#5A6C87",
  glass: "rgba(255,255,255,0.84)",
  glassStrong: "rgba(255,255,255,0.92)",
  glassBorder: "rgba(11, 95, 255, 0.14)",
  neonPrimary: "#0B5FFF",
  neonSecondary: "#1E90FF",
  neonHighlight: "#FF9600",
  quoteBg: "rgba(245, 248, 255, 0.95)",
  quoteBorder: "rgba(11, 95, 255, 0.65)",
  scrim: "rgba(14, 35, 78, 0.22)",
};

const SAMPLE_HEADING = "Biology: Cellular Respiration";
const SAMPLE_PARAGRAPH =
  "Cellular respiration is the process by which cells convert glucose and oxygen into ATP, the energy currency of the cell. It occurs in multiple stages including glycolysis, the Krebs cycle, and oxidative phosphorylation, each releasing usable energy for cellular work.";
const SAMPLE_SELECTION =
  "Cellular respiration is the process by which cells convert glucose and oxygen into ATP, the energy currency of the cell.";

type ReaderLesson = {
  subject: "Biology" | "Chemistry" | "Physics" | "Math";
  unit: string;
  topic: string;
};

type TextbookReaderScreenProps = {
  lesson?: ReaderLesson;
};

type CopilotMessage = {
  id: string;
  text: string;
  isUser: boolean;
};

const subjectToTutor = {
  Biology: "biology",
  Chemistry: "chemistry",
  Physics: "physics",
  Math: "math",
} as const satisfies Record<ReaderLesson["subject"], SubjectName>;

const buildSheetHistory = (messages: CopilotMessage[]): ChatHistoryItem[] =>
  messages
    .filter((message) => message.text.trim().length > 0)
    .slice(-6)
    .map((message) => ({
      role: message.isUser ? "user" : "assistant",
      content: message.text.trim(),
    }));

export default function TextbookReaderScreen({
  lesson,
}: TextbookReaderScreenProps) {
  const insets = useSafeAreaInsets();

  const [selectedText, setSelectedText] = useState("");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);

  const tooltipProgress = useRef(new Animated.Value(0)).current;
  const sheetProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tooltipProgress, {
      toValue: selectedText && !isCopilotOpen ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isCopilotOpen, selectedText, tooltipProgress]);

  useEffect(() => {
    Animated.timing(sheetProgress, {
      toValue: isCopilotOpen ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isCopilotOpen, sheetProgress]);

  const tooltipStyle = useMemo(
    () => ({
      opacity: tooltipProgress,
      transform: [
        {
          translateY: tooltipProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    }),
    [tooltipProgress],
  );

  const sheetTranslateY = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [560, 0],
  });

  const scrimOpacity = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const simulateSelection = () => {
    setSelectedText(SAMPLE_SELECTION);
  };

  const clearSelection = () => {
    setSelectedText("");
    setIsCopilotOpen(false);
    setQuestion("");
    setCopilotMessages([]);
    setIsAsking(false);
  };

  const openCopilot = () => {
    if (!selectedText) {
      return;
    }
    setIsCopilotOpen(true);
  };

  const closeCopilot = () => {
    setIsCopilotOpen(false);
  };

  const askCopilot = async () => {
    if (isAsking || !selectedText.trim()) {
      return;
    }

    const userQuestion = question.trim();
    const userText =
      userQuestion || "Explain this highlighted text in simple terms.";
    const prompt =
      userQuestion.length > 0
        ? `Help me understand this highlighted textbook text from ${lesson?.subject ?? "Biology"}.\n\nHighlighted text:\n\"${selectedText}\"\n\nStudent question:\n${userQuestion}`
        : `Help me understand this highlighted textbook text from ${lesson?.subject ?? "Biology"}.\n\nHighlighted text:\n\"${selectedText}\"\n\nGive a concise explanation and one study tip.`;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      text: userText,
      isUser: true,
    };
    const aiMessageId = `ai-${Date.now()}`;
    const aiPlaceholder: CopilotMessage = {
      id: aiMessageId,
      text: "",
      isUser: false,
    };

    const history = buildSheetHistory(copilotMessages);
    const subject = lesson ? subjectToTutor[lesson.subject] : "biology";

    setCopilotMessages((current) => [...current, userMessage, aiPlaceholder]);
    setQuestion("");
    setIsAsking(true);

    let streamed = "";

    try {
      const finalText = await generateAIResponseStream(
        prompt,
        (chunk) => {
          streamed += chunk;
          setCopilotMessages((current) =>
            current.map((message) =>
              message.id === aiMessageId
                ? { ...message, text: streamed || " " }
                : message,
            ),
          );
        },
        subject,
        history,
      );

      const resolved =
        (finalText || streamed).trim() ||
        "I could not generate an explanation right now.";

      setCopilotMessages((current) =>
        current.map((message) =>
          message.id === aiMessageId ? { ...message, text: resolved } : message,
        ),
      );
    } catch {
      setCopilotMessages((current) =>
        current.map((message) =>
          message.id === aiMessageId
            ? {
                ...message,
                text: "I cannot reach the EduTwin server right now. Please make sure the backend is running.",
              }
            : message,
        ),
      );
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgAuroraOne} />
      <View style={styles.bgAuroraTwo} />
      <View style={styles.bgAuroraThree} />

      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flexFill}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + 18,
              paddingBottom: 160 + Math.max(insets.bottom, 12),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.readerCard}>
            <Text style={styles.heading}>{SAMPLE_HEADING}</Text>
            <Text style={styles.meta}>Chapter 3 • Energy Systems</Text>

            <Text selectable style={styles.paragraph}>
              {SAMPLE_PARAGRAPH}
            </Text>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.subtleButton}
                onPress={simulateSelection}
              >
                <Ionicons
                  name="color-wand-outline"
                  size={16}
                  color={TOKENS.neonPrimary}
                />
                <Text style={styles.subtleButtonText}>Simulate Highlight</Text>
              </Pressable>

              {selectedText ? (
                <Pressable style={styles.subtleButton} onPress={clearSelection}>
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color={TOKENS.textMuted}
                  />
                  <Text style={styles.subtleButtonText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>

        <Animated.View
          pointerEvents={selectedText && !isCopilotOpen ? "auto" : "none"}
          style={[
            styles.tooltipWrap,
            {
              bottom: 102 + Math.max(insets.bottom, 10),
            },
            tooltipStyle,
          ]}
        >
          <Pressable style={styles.tooltipPill} onPress={openCopilot}>
            <Ionicons name="sparkles" size={16} color={TOKENS.neonHighlight} />
            <Text style={styles.tooltipText}>Explain this</Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          pointerEvents={isCopilotOpen ? "auto" : "none"}
          style={[styles.scrim, { opacity: scrimOpacity }]}
        >
          <Pressable style={styles.scrimTapArea} onPress={closeCopilot} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Textbook EduTwin</Text>
            <Pressable style={styles.iconClose} onPress={closeCopilot}>
              <Ionicons name="close" size={18} color={TOKENS.textHeading} />
            </Pressable>
          </View>

          <View style={styles.quoteBlock}>
            <View style={styles.quoteAccent} />
            <Text style={styles.quoteText}>
              {selectedText || "Highlight text to send context to EduTwin."}
            </Text>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask EduTwin about this sentence..."
              placeholderTextColor={TOKENS.textMuted}
              multiline
              editable={!isAsking}
            />
            <Pressable
              style={[
                styles.askButton,
                (isAsking || !selectedText.trim()) && styles.askButtonDisabled,
              ]}
              onPress={askCopilot}
              disabled={isAsking || !selectedText.trim()}
            >
              {isAsking ? (
                <ActivityIndicator size="small" color={TOKENS.textHeading} />
              ) : (
                <Ionicons name="send" size={16} color={TOKENS.textHeading} />
              )}
              <Text style={styles.askButtonText}>
                {isAsking ? "Thinking" : "Ask"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.responseCard}>
            <Text style={styles.responseLabel}>Textbook Chat</Text>
            {copilotMessages.length ? (
              <ScrollView
                style={styles.sheetChatScroll}
                contentContainerStyle={styles.sheetChatContent}
                showsVerticalScrollIndicator={false}
              >
                {copilotMessages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.sheetBubble,
                      message.isUser
                        ? styles.sheetBubbleUser
                        : styles.sheetBubbleAi,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sheetBubbleText,
                        message.isUser
                          ? styles.sheetBubbleUserText
                          : styles.sheetBubbleAiText,
                      ]}
                    >
                      {message.text || "..."}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.responseTextMuted}>
                Ask a question to start chatting about this highlighted text.
              </Text>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: TOKENS.bgDeep,
  },
  flexFill: {
    flex: 1,
  },
  bgAuroraOne: {
    position: "absolute",
    top: -120,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(11, 95, 255, 0.16)",
  },
  bgAuroraTwo: {
    position: "absolute",
    right: -120,
    bottom: 160,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(255, 150, 0, 0.14)",
  },
  bgAuroraThree: {
    position: "absolute",
    left: "28%",
    top: "42%",
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(30, 144, 255, 0.08)",
  },
  content: {
    paddingHorizontal: 18,
  },
  readerCard: {
    backgroundColor: TOKENS.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: TOKENS.glassBorder,
    padding: 18,
    shadowColor: TOKENS.neonPrimary,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  heading: {
    color: TOKENS.textHeading,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  meta: {
    marginTop: 6,
    color: TOKENS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  paragraph: {
    marginTop: 18,
    color: TOKENS.textBody,
    fontSize: 16,
    lineHeight: 30,
    letterSpacing: 0.2,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  subtleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: TOKENS.glassStrong,
    borderWidth: 1,
    borderColor: TOKENS.glassBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subtleButtonText: {
    color: TOKENS.textBody,
    fontSize: 12,
    fontWeight: "700",
  },
  tooltipWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 15,
  },
  tooltipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: TOKENS.glassStrong,
    borderWidth: 1,
    borderColor: "rgba(255, 150, 0, 0.45)",
    shadowColor: TOKENS.neonHighlight,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  tooltipText: {
    color: TOKENS.textHeading,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.scrim,
    zIndex: 20,
  },
  scrimTapArea: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: "56%",
    maxHeight: "76%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderTopWidth: 1,
    borderColor: TOKENS.glassBorder,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 30,
    shadowColor: TOKENS.neonPrimary,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 64,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(90, 108, 135, 0.35)",
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: TOKENS.textHeading,
    fontSize: 17,
    fontWeight: "800",
  },
  iconClose: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TOKENS.glass,
    borderWidth: 1,
    borderColor: TOKENS.glassBorder,
  },
  quoteBlock: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    backgroundColor: TOKENS.quoteBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.2)",
    padding: 12,
  },
  quoteAccent: {
    width: 3,
    borderRadius: 999,
    backgroundColor: TOKENS.quoteBorder,
    shadowColor: TOKENS.neonPrimary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  quoteText: {
    flex: 1,
    color: TOKENS.textBody,
    fontSize: 13,
    lineHeight: 20,
  },
  inputWrap: {
    marginTop: 12,
    backgroundColor: TOKENS.glass,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.35)",
    borderRadius: 16,
    padding: 10,
    shadowColor: TOKENS.neonPrimary,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  input: {
    color: TOKENS.textHeading,
    minHeight: 66,
    maxHeight: 116,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  askButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(11, 95, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.8)",
  },
  askButtonDisabled: {
    opacity: 0.6,
  },
  askButtonText: {
    color: TOKENS.textHeading,
    fontSize: 12,
    fontWeight: "800",
  },
  responseCard: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: TOKENS.glass,
    borderWidth: 1,
    borderColor: TOKENS.glassBorder,
    padding: 12,
  },
  responseLabel: {
    color: TOKENS.neonHighlight,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  responseTextMuted: {
    marginTop: 8,
    color: TOKENS.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  sheetChatScroll: {
    marginTop: 8,
    maxHeight: 170,
  },
  sheetChatContent: {
    gap: 8,
    paddingBottom: 4,
  },
  sheetBubble: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  sheetBubbleUser: {
    alignSelf: "flex-end",
    maxWidth: "86%",
    backgroundColor: "rgba(11, 95, 255, 0.14)",
    borderColor: "rgba(11, 95, 255, 0.38)",
  },
  sheetBubbleAi: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    backgroundColor: TOKENS.glassStrong,
    borderColor: TOKENS.glassBorder,
  },
  sheetBubbleText: {
    fontSize: 13,
    lineHeight: 20,
  },
  sheetBubbleUserText: {
    color: TOKENS.textHeading,
    fontWeight: "700",
  },
  sheetBubbleAiText: {
    color: TOKENS.textBody,
    fontWeight: "500",
  },
});