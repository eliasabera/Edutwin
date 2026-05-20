import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardEvent,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../shared/constants/colors";
import {
  getEffectiveThemeMode,
  useAppSettings,
} from "../../../shared/store/settings-store";
import {
  classifyTutorPrompt,
  recordTutorInteraction,
} from "../../../shared/services/gamification";
import {
  fetchLatestChatHistory,
  generateAIResponseStream,
  type ChatHistoryItem,
  type PersistedChatMessage,
} from "../../../shared/services/ai-service";
import { getCurrentUser } from "../../../shared/services/auth-service";
import { useStudentProfile } from "../../../shared/store/user-store";
import type { SubjectName } from "../../../shared/types/domain.types";
import MessageBubble from "./MessageBubble";

type ChatMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
};

let cachedChatMessages: ChatMessage[] | null = null;
let cachedChatUserId: string | null = null;

export const clearTutorChatCache = () => {
  cachedChatMessages = null;
  cachedChatUserId = null;
};

const subjectOptions: { label: string; value: SubjectName }[] = [
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
    .slice(-20)
    .map((message) => ({
      role: message.isUser ? "user" : "assistant",
      content: message.text.trim(),
    }));

const RECENT_CHAT_WINDOW = 80;

const dedupeMessages = (items: ChatMessage[]) => {
  const merged = items.filter(
    (message) => message.id !== "welcome" && message.text.trim().length > 0,
  );

  const deduped = merged.filter(
    (message, index, arr) =>
      index ===
      arr.findIndex(
        (candidate) =>
          candidate.text === message.text &&
          candidate.isUser === message.isUser &&
          candidate.timestamp === message.timestamp,
      ),
  );

  return deduped.slice(-RECENT_CHAT_WINDOW);
};

export default function ChatContainer() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const appSettings = useAppSettings();
  const deviceTheme = useColorScheme();
  const isDark =
    appSettings.themeMode === "system"
      ? (deviceTheme ?? getEffectiveThemeMode()) === "dark"
      : appSettings.themeMode === "dark";
  const params = useLocalSearchParams<{
    prefill?: string | string[];
    prefillKey?: string | string[];
    subject?: string | string[];
  }>();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const shouldAutoScrollRef = useRef(true);
  const studentProfile = useStudentProfile();
  const handledPrefillRef = useRef<string | null>(null);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>(
    studentProfile.supportSubjects[0] ||
      studentProfile.strongSubjects[0] ||
      "biology",
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const currentUserId = getCurrentUser()?.id ?? null;
    if (
      cachedChatMessages?.length &&
      cachedChatUserId &&
      currentUserId &&
      cachedChatUserId === currentUserId
    ) {
      return cachedChatMessages;
    }
    return [
      {
        id: "welcome",
        text: `Hi ${studentProfile.fullName}, I am ${studentProfile.twinName}.`,
        isUser: false,
        timestamp: getTimeLabel(),
      },
    ];
  });

  const buildWelcomeMessage = useCallback(
    (): ChatMessage => ({
      id: "welcome",
      text: `Hi ${studentProfile.fullName}, I am ${studentProfile.twinName}.`,
      isUser: false,
      timestamp: getTimeLabel(),
    }),
    [studentProfile.fullName, studentProfile.twinName],
  );

  const mapPersistedToChatMessage = (
    item: PersistedChatMessage,
  ): ChatMessage => {
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

  useEffect(() => {
    const currentUserId = getCurrentUser()?.id ?? null;
    cachedChatMessages = messages;
    cachedChatUserId = currentUserId;
  }, [messages]);

  useEffect(() => {
    setMessages((prev) => {
      const withoutWelcome = prev.filter((message) => message.id !== "welcome");
      if (withoutWelcome.length > 0) {
        return prev;
      }
      return [buildWelcomeMessage()];
    });
  }, [buildWelcomeMessage]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const currentUserId = getCurrentUser()?.id ?? null;

      if (
        currentUserId &&
        cachedChatUserId &&
        cachedChatUserId !== currentUserId
      ) {
        clearTutorChatCache();
        setMessages([buildWelcomeMessage()]);
      }

      const loadChatHistory = async () => {
        try {
          const latest = await fetchLatestChatHistory();
          if (!isMounted || !latest.messages.length) return;

          const mapped = latest.messages
            .map(mapPersistedToChatMessage)
            .filter((message) => message.text.trim().length > 0);

          if (!mapped.length) return;

          // Use persisted history as source of truth to avoid re-merging duplicates
          // from local cache every time the screen regains focus.
          const hydrated = [buildWelcomeMessage(), ...dedupeMessages(mapped)];
          setMessages(hydrated);
          cachedChatMessages = hydrated;
          cachedChatUserId = getCurrentUser()?.id ?? null;
          setTimeout(scrollToEnd, 0);
        } catch (error) {
          console.warn("Failed to load chat history:", error);
        }
      };

      void loadChatHistory();

      return () => {
        isMounted = false;
      };
    }, [buildWelcomeMessage]),
  );

  const scrollToEnd = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const updateAutoScrollState = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    // Only auto-scroll while the user is close to the latest messages.
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  };

  const selectedSubjectLabel =
    subjectOptions.find((subject) => subject.value === selectedSubject)
      ?.label ?? "Subject";

  const normalizedPrefill = Array.isArray(params.prefill)
    ? params.prefill[0]
    : params.prefill;
  const normalizedSubject = Array.isArray(params.subject)
    ? params.subject[0]
    : params.subject;
  const normalizedPrefillKey = Array.isArray(params.prefillKey)
    ? params.prefillKey[0]
    : params.prefillKey;

  const sendMessage = async (presetText?: string) => {
    const trimmed = (presetText ?? inputText).trim();
    if (!trimmed || isLoading) {
      return;
    }

    recordTutorInteraction(selectedSubject, classifyTutorPrompt(trimmed));

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
    shouldAutoScrollRef.current = true;
    setInputText("");
    setIsSubjectMenuOpen(false);
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

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
      setIsSubjectMenuOpen(false);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!normalizedPrefill || !normalizedPrefill.trim()) {
      return;
    }

    const prefillIdentity = `${normalizedPrefillKey || "no-key"}::${normalizedPrefill}`;

    if (handledPrefillRef.current === prefillIdentity) {
      return;
    }

    const candidateSubject = (normalizedSubject || "").toLowerCase();
    if (
      candidateSubject === "biology" ||
      candidateSubject === "chemistry" ||
      candidateSubject === "physics" ||
      candidateSubject === "math"
    ) {
      setSelectedSubject(candidateSubject as SubjectName);
    }

    handledPrefillRef.current = prefillIdentity;
    void sendMessage(normalizedPrefill);
  }, [normalizedPrefill, normalizedPrefillKey, normalizedSubject]);

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.backgroundLayer,
            { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
          ]}
        />
        <View style={styles.bgOrbOne} />
        <View style={styles.bgOrbTwo} />
        <View style={styles.bgOrbThree} />

        <FlatList
          ref={flatListRef}
          style={styles.list}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              text={item.text}
              isUser={item.isUser}
              timestamp={item.timestamp}
              isDark={isDark}
              isTyping={
                !item.isUser && isLoading && item.text.trim().length === 0
              }
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: 12,
            },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={updateAutoScrollState}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <View>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  Conversation
                </Text>
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : null}
              </View>
            </View>
          }
          onContentSizeChange={() => {
            if (shouldAutoScrollRef.current) {
              scrollToEnd();
            }
          }}
        />

        <View
          style={[
            styles.composerWrap,
            {
              paddingBottom: isKeyboardVisible
                ? Platform.OS === "android"
                  ? Math.max(keyboardHeight + 12, 16)
                  : Math.max(insets.bottom + 8, 12)
                : Math.max(insets.bottom + tabBarHeight + 8, 12),
            },
          ]}
        >
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: isDark
                  ? "rgba(14,26,44,0.95)"
                  : "rgba(255,255,255,0.92)",
                borderColor: isDark
                  ? "rgba(123,167,255,0.24)"
                  : "rgba(11, 95, 255, 0.18)",
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                  color: isDark ? "#F4F7FB" : "#1A202C",
                },
              ]}
              placeholder={
                isLoading
                  ? "EduTwin is thinking..."
                  : "Ask a textbook question..."
              }
              value={inputText}
              onChangeText={setInputText}
              placeholderTextColor={isDark ? "#8FA1BF" : COLORS.textLight}
              editable={!isLoading}
              contextMenuHidden={false}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.subjectWrap}>
              <TouchableOpacity
                onPress={() => setIsSubjectMenuOpen((current) => !current)}
                disabled={isLoading}
                style={styles.subjectBtn}
              >
                <Ionicons name="book-outline" size={16} color="white" />
                <Text style={styles.subjectBtnText}>{selectedSubjectLabel}</Text>
                <Ionicons
                  name={isSubjectMenuOpen ? "chevron-up" : "chevron-down"}
                  size={14}
                  color="white"
                />
              </TouchableOpacity>

              {isSubjectMenuOpen ? (
                <View
                  style={[
                    styles.subjectDropdown,
                    {
                      backgroundColor: isDark ? "#0F213B" : "#FFFFFF",
                      borderColor: isDark ? "#2A3D62" : "#D5E3FA",
                    },
                  ]}
                >
                  {subjectOptions.map((subject) => {
                    const isSelected = selectedSubject === subject.value;
                    return (
                      <TouchableOpacity
                        key={subject.value}
                        style={[
                          styles.subjectOption,
                          isSelected && styles.subjectOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedSubject(subject.value);
                          setIsSubjectMenuOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.subjectOptionText,
                            {
                              color: isSelected
                                ? "#0B5FFF"
                                : isDark
                                  ? "#DDE7F9"
                                  : "#24406A",
                            },
                          ]}
                        >
                          {subject.label}
                        </Text>
                        {isSelected ? (
                          <Ionicons name="checkmark" size={15} color="#0B5FFF" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  bgOrbOne: {
    position: "absolute",
    top: -80,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "transparent",
    opacity: 0.6,
  },
  bgOrbTwo: {
    position: "absolute",
    bottom: 120,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "transparent",
    opacity: 0.62,
  },
  bgOrbThree: {
    position: "absolute",
    top: "42%",
    right: "22%",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "transparent",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
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
    paddingHorizontal: 16,
    paddingTop: 8,
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
  subjectWrap: {
    position: "relative",
  },
  subjectDropdown: {
    position: "absolute",
    right: 0,
    bottom: 52,
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: "#0A1A35",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    zIndex: 20,
  },
  subjectOption: {
    height: 38,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectOptionSelected: {
    backgroundColor: "rgba(11,95,255,0.09)",
  },
  subjectOptionText: {
    fontSize: 13,
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
