import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../shared/constants/colors";
import {
  fetchChatHistory,
  generateAIResponseStream,
  getChatSessionId,
  type ChatHistoryItem,
  type PersistedChatMessage,
} from "../../../shared/services/ai-service";
import { useStudentProfile } from "../../../shared/store/user-store";
import type { SubjectName } from "../../../shared/types/domain.types";
import MessageBubble from "./MessageBubble";

type ChatMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
};

const subjectOptions: Array<{ label: string; value: SubjectName }> = [
  { label: "Biology", value: "biology" },
  { label: "Chemistry", value: "chemistry" },
  { label: "Physics", value: "physics" },
  { label: "Math", value: "math" },
];

const getTimeLabel = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const buildChatHistory = (messages: ChatMessage[]): ChatHistoryItem[] =>
  messages
    .filter(
      (message) => message.id !== "welcome" && message.text.trim().length > 0,
    )
    .slice(-6)
    .map((message) => ({
      role: message.isUser ? "user" : "assistant",
      content: message.text.trim(),
    }));

export default function ChatContainer() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const studentProfile = useStudentProfile();

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>(
    studentProfile.supportSubjects[0] ||
      studentProfile.strongSubjects[0] ||
      "biology",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: `Hi ${studentProfile.fullName}, I am ${studentProfile.twinName}.`,
      isUser: false,
      timestamp: getTimeLabel(),
    },
  ]);

  const buildWelcomeMessage = useCallback(
    (): ChatMessage => ({
      id: "welcome",
      text: `Hi ${studentProfile.fullName}, I am ${studentProfile.twinName}.`,
      isUser: false,
      timestamp: getTimeLabel(),
    }),
    [studentProfile.fullName, studentProfile.twinName],
  );

  const mapPersistedToChatMessage = (item: PersistedChatMessage): ChatMessage => {
    const date = item.timestamp ? new Date(item.timestamp) : new Date();
    const timestamp = Number.isNaN(date.getTime())
      ? getTimeLabel()
      : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      id: item._id || `${item.sender}-${Date.now()}-${Math.random()}`,
      text: item.message_text || "",
      isUser: item.sender === "USER",
      timestamp,
    };
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadChatHistory = async () => {
        const sessionId = getChatSessionId();
        if (!sessionId) {
          setMessages([buildWelcomeMessage()]);
          return;
        }

        try {
          const history = await fetchChatHistory(sessionId);
          if (!isMounted) return;

          if (!history.length) {
            setMessages([buildWelcomeMessage()]);
            return;
          }

          const mapped = history
            .map(mapPersistedToChatMessage)
            .filter((message) => message.text.trim().length > 0);

          setMessages([buildWelcomeMessage(), ...mapped]);
          setTimeout(scrollToEnd, 0);
        } catch (error) {
          console.warn("Failed to load chat history:", error);
          if (isMounted) {
            setMessages([buildWelcomeMessage()]);
          }
        }
      };

      loadChatHistory();

      return () => {
        isMounted = false;
      };
    }, [buildWelcomeMessage]),
  );

  const scrollToEnd = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const cycleSubject = () => {
    const currentIndex = subjectOptions.findIndex(
      (subject) => subject.value === selectedSubject,
    );
    const nextIndex = (currentIndex + 1) % subjectOptions.length;
    setSelectedSubject(subjectOptions[nextIndex].value);
  };

  const selectedSubjectLabel =
    subjectOptions.find((subject) => subject.value === selectedSubject)
      ?.label ?? "Subject";

  const sendMessage = async (presetText?: string) => {
    const trimmed = (presetText ?? inputText).trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: trimmed,
      isUser: true,
      timestamp: getTimeLabel(),
    };

    const aiMessageId = `ai-${Date.now()}`;
    const aiPlaceholder: ChatMessage = {
      id: aiMessageId,
      text: "",
      isUser: false,
      timestamp: getTimeLabel(),
    };

    const history = buildChatHistory(messages);

    setMessages((current) => [...current, userMessage, aiPlaceholder]);
    setInputText("");
    setIsLoading(true);
    scrollToEnd();

    let accumulated = "";

    try {
      const finalText = await generateAIResponseStream(
        trimmed,
        (chunk) => {
          accumulated += chunk;
          setMessages((current) =>
            current.map((message) =>
              message.id === aiMessageId
                ? { ...message, text: accumulated || " " }
                : message,
            ),
          );
          scrollToEnd();
        },
        selectedSubject,
        history,
      );

      const resolvedText =
        (finalText || accumulated).trim() ||
        "I could not generate a textbook-grounded answer right now.";

      setMessages((current) =>
        current.map((message) =>
          message.id === aiMessageId
            ? { ...message, text: resolvedText, timestamp: getTimeLabel() }
            : message,
        ),
      );
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === aiMessageId
            ? {
                ...message,
                text: "I cannot reach the EduTwin server right now. Make sure the backend is running on your PC.",
                timestamp: getTimeLabel(),
              }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
      scrollToEnd();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 20}
    >
      <View style={styles.backgroundLayer} />
      <View style={styles.bgOrbOne} />
      <View style={styles.bgOrbTwo} />
      <View style={styles.bgOrbThree} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            text={item.text}
            isUser={item.isUser}
            timestamp={item.timestamp}
            isTyping={
              !item.isUser && isLoading && item.text.trim().length === 0
            }
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: 188 + insets.bottom,
          },
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Conversation</Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : null}
            </View>
          </View>
        }
        onContentSizeChange={scrollToEnd}
      />

      <View
        style={[
          styles.composerWrap,
          {
            bottom: 86 + Math.max(insets.bottom, 10),
          },
        ]}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={
              isLoading
                ? "EduTwin is thinking..."
                : "Ask a textbook question..."
            }
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={COLORS.textLight}
            editable={!isLoading}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.subjectBtn}
            onPress={cycleSubject}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Ionicons name="book-outline" size={16} color="white" />
            <Text style={styles.subjectBtnText}>{selectedSubjectLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F4F7FC",
  },
  bgOrbOne: {
    position: "absolute",
    top: -80,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(11, 95, 255, 0.16)",
    opacity: 0.6,
  },
  bgOrbTwo: {
    position: "absolute",
    bottom: 120,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255, 150, 0, 0.14)",
    opacity: 0.62,
  },
  bgOrbThree: {
    position: "absolute",
    top: "42%",
    right: "22%",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(30, 144, 255, 0.08)",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#5A6C87",
  },
  composerWrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.18)",
    alignItems: "flex-end",
    gap: 10,
    shadowColor: "#0E234E",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F8FF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A202C",
    maxHeight: 110,
  },
  subjectBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0B5FFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  subjectBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0B5FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: "#9BAECC",
  },
});
