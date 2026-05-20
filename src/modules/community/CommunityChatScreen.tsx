import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/shared/constants/colors";
import { useTranslation } from "@/shared/i18n";
import {
  getEffectiveThemeMode,
  useAppSettings,
} from "@/shared/store/settings-store";
import { getActiveUserOrResolve } from "@/shared/services/auth-service";
import { supabase } from "@/shared/services/supabase-client";
import {
  ChatGroup,
  ChatMember,
  ChatMessage,
  CommunityClass,
  ensureGroupMember,
  ensureTeacherMember,
  fetchGroupMembers,
  fetchGroupMessages,
  getChatGroupDisplayName,
  getOrCreateChatGroup,
  getStudentClasses,
  sendGroupMessage,
  uploadChatImage,
} from "@/shared/services/community-chat";
import CommunityMessageBubble from "./CommunityMessageBubble";

const formatMessageTime = (value?: string) => {
  if (!value) {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const appendUniqueMessage = (prev: ChatMessage[], incoming: ChatMessage) => {
  if (!incoming?.id) return prev;
  if (prev.some((item) => item.id === incoming.id)) {
    return prev;
  }
  return [...prev, incoming];
};

export default function CommunityChatScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const appSettings = useAppSettings();
  const deviceTheme = useColorScheme();
  const isDark =
    appSettings.themeMode === "system"
      ? (deviceTheme ?? getEffectiveThemeMode()) === "dark"
      : appSettings.themeMode === "dark";

  const [classes, setClasses] = useState<CommunityClass[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [chatGroup, setChatGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingChat, setRefreshingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const shouldAutoScrollRef = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastLoadedClassIdRef = useRef<string | null>(null);
  const classesRef = useRef<CommunityClass[]>([]);

  const activeClass =
    classes.find((item) => item.id === activeClassId) ?? classes[0] ?? null;
  const canChat = Boolean(chatGroup && classes.length > 0);
  const displayClassName = activeClass
    ? getChatGroupDisplayName(activeClass, chatGroup)
    : null;

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    if (!query) {
      return members;
    }
    return members.filter((member) =>
      member.name.toLowerCase().includes(query),
    );
  }, [memberQuery, members]);

  const teacherMembers = useMemo(
    () => filteredMembers.filter((member) => member.role === "teacher"),
    [filteredMembers],
  );

  const studentMembers = useMemo(
    () => filteredMembers.filter((member) => member.role !== "teacher"),
    [filteredMembers],
  );

  const memberNameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of members) {
      if (member.user_id) {
        map.set(member.user_id, member.name);
      }
    }
    return map;
  }, [members]);

  const scrollToEnd = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const updateAutoScrollState = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  };

  const loadClasses = useCallback(async () => {
    try {
      const user = await getActiveUserOrResolve();
      setCurrentUserId(user?.id ?? null);
      if (!user) {
        setClasses([]);
        setActiveClassId(null);
        return;
      }

      const available = await getStudentClasses();
      classesRef.current = available;
      setClasses(available);
      setActiveClassId((prev) => {
        if (prev && available.some((item) => item.id === prev)) {
          return prev;
        }
        return available[0]?.id ?? null;
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("classChat.loadFailed");
      Alert.alert(t("navigation.classChat"), message);
    }
  }, [t]);

  const loadChatForClass = useCallback(async (classId: string) => {
      setRefreshingChat(true);
      try {
        const user = await getActiveUserOrResolve();
        if (!user) {
          return;
        }

        const classInfo = classesRef.current.find((item) => item.id === classId);
        if (!classInfo) {
          return;
        }

        const group = await getOrCreateChatGroup(classInfo);
        setChatGroup(group);

        await ensureGroupMember(group.id, user.id, "student");
        await ensureTeacherMember(group.id, classInfo.teacher_user_id);

        const [loadedMessages, loadedMembers] = await Promise.all([
          fetchGroupMessages(group.id),
          fetchGroupMembers(group.id),
        ]);
        setMessages([...loadedMessages].reverse());
        setMembers(loadedMembers);
        lastLoadedClassIdRef.current = classId;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("classChat.loadFailed");
        Alert.alert(t("navigation.classChat"), message);
      } finally {
        setRefreshingChat(false);
      }
    }, [t]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      await loadClasses();
      if (!cancelled) {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadClasses]);

  useEffect(() => {
    if (!activeClassId || classes.length === 0) {
      return;
    }

    if (lastLoadedClassIdRef.current === activeClassId) {
      return;
    }

    void loadChatForClass(activeClassId);
  }, [activeClassId, classes.length, loadChatForClass]);

  useEffect(() => {
    if (classes.length > 0) {
      return;
    }

    lastLoadedClassIdRef.current = null;
    setChatGroup((prev) => (prev ? null : prev));
    setMessages((prev) => (prev.length > 0 ? [] : prev));
    setMembers((prev) => (prev.length > 0 ? [] : prev));
  }, [classes.length]);

  useFocusEffect(
    useCallback(() => {
      const classId = activeClassId;
      const groupId = chatGroup?.id;
      if (
        !classId ||
        !groupId ||
        lastLoadedClassIdRef.current !== classId
      ) {
        return;
      }

      void (async () => {
        try {
          const [loadedMessages, loadedMembers] = await Promise.all([
            fetchGroupMessages(groupId),
            fetchGroupMembers(groupId),
          ]);
          setMessages([...loadedMessages].reverse());
          setMembers(loadedMembers);
        } catch {
          // Keep existing chat data on background refresh failure.
        }
      })();
    }, [activeClassId, chatGroup?.id]),
  );

  useEffect(() => {
    const groupId = chatGroup?.id;
    if (!groupId) {
      return undefined;
    }

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribeToMessages = async () => {
      const previous = channelRef.current;
      channelRef.current = null;
      if (previous) {
        await supabase.removeChannel(previous);
      }
      if (cancelled) {
        return;
      }

      // Unique topic per subscription — Supabase reuses channels by topic name.
      const nextChannel = supabase.channel(
        `class-chat-${groupId}-${Date.now()}`,
      );

      nextChannel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "community_chat_messages",
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            const incoming = payload.new as ChatMessage;
            setMessages((prev) => {
              const next = appendUniqueMessage(prev, incoming);
              if (next !== prev && shouldAutoScrollRef.current) {
                setTimeout(scrollToEnd, 0);
              }
              return next;
            });
          },
        )
        .subscribe();

      if (cancelled) {
        await supabase.removeChannel(nextChannel);
        return;
      }

      channel = nextChannel;
      channelRef.current = nextChannel;
    };

    void subscribeToMessages();

    return () => {
      cancelled = true;
      const activeChannel = channel ?? channelRef.current;
      channelRef.current = null;
      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
      }
    };
  }, [chatGroup?.id]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
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

  const handleSend = async () => {
    const user = await getActiveUserOrResolve();
    if (!user || !chatGroup || !canChat) return;

    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    try {
      const sentMessage = await sendGroupMessage({
        groupId: chatGroup.id,
        senderId: user.id,
        body,
      });
      setMessages((prev) => appendUniqueMessage(prev, sentMessage));
      setDraft("");
      shouldAutoScrollRef.current = true;
      scrollToEnd();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("classChat.sendFailed");
      Alert.alert(t("navigation.classChat"), message);
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async () => {
    const user = await getActiveUserOrResolve();
    if (!user || !chatGroup || !canChat || uploading) return;

    setUploading(true);
    try {
      const imageUrl = await uploadChatImage();
      if (!imageUrl) return;
      const sentMessage = await sendGroupMessage({
        groupId: chatGroup.id,
        senderId: user.id,
        attachmentUrl: imageUrl,
        attachmentType: "image",
      });
      setMessages((prev) => appendUniqueMessage(prev, sentMessage));
      shouldAutoScrollRef.current = true;
      scrollToEnd();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("classChat.uploadFailed");
      Alert.alert(t("navigation.classChat"), message);
    } finally {
      setUploading(false);
    }
  };

  const resolveSenderLabel = (senderId: string) => {
    const name = memberNameByUserId.get(senderId);
    if (!name) {
      return t("classChat.classmate");
    }
    const member = members.find((item) => item.user_id === senderId);
    if (member?.role === "teacher") {
      return `${name} · ${t("classChat.teacher")}`;
    }
    return name;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.sender_id === currentUserId;
    return (
      <CommunityMessageBubble
        body={item.body}
        attachmentUrl={item.attachment_url}
        attachmentType={item.attachment_type}
        isUser={isMine}
        senderLabel={isMine ? null : resolveSenderLabel(item.sender_id)}
        timestamp={formatMessageTime(item.created_at)}
        isDark={isDark}
      />
    );
  };

  const listHeader = (
    <View>
      <Text style={[styles.screenTitle, { color: isDark ? "#F4F7FB" : "#12233F" }]}>
        {t("navigation.classChat")}
      </Text>
      <Text
        style={[styles.screenSubtitle, { color: isDark ? "#9FB2D6" : "#5C6E90" }]}
      >
        {t("classChat.subtitle")}
      </Text>

      {activeClass ? (
        <TouchableOpacity
          style={[
            styles.classCard,
            {
              backgroundColor: isDark ? "rgba(14,26,44,0.95)" : "#F5F8FF",
              borderColor: isDark
                ? "rgba(123,167,255,0.24)"
                : "rgba(11, 95, 255, 0.18)",
            },
          ]}
          onPress={() => members.length > 0 && setShowMembersPanel(true)}
          disabled={!members.length}
          activeOpacity={0.85}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={isDark ? "#78A5FF" : "#0B5FFF"}
          />
          <View style={styles.classCardText}>
            <Text
              style={[
                styles.classCardTitle,
                { color: isDark ? "#F4F7FB" : "#12233F" },
              ]}
            >
              {displayClassName || activeClass.name}
            </Text>
            {members.length > 0 ? (
              <Text
                style={[
                  styles.classCardMeta,
                  { color: isDark ? "#9FB2D6" : "#5C6E90" },
                ]}
              >
                {t("classChat.memberCount", { count: members.length })}
                {" · "}
                {t("classChat.viewMembers")}
              </Text>
            ) : (
              <Text
                style={[
                  styles.classCardMeta,
                  { color: isDark ? "#9FB2D6" : "#5C6E90" },
                ]}
              >
                {t("classChat.subtitle")}
              </Text>
            )}
          </View>
          {members.length > 0 ? (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#9FB2D6" : "#5C6E90"}
            />
          ) : null}
        </TouchableOpacity>
      ) : null}

      {classes.length > 1 ? (
        <View style={styles.classRow}>
          {classes.map((item) => {
            const active = item.id === activeClassId;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  if (item.id === activeClassId) {
                    return;
                  }
                  lastLoadedClassIdRef.current = null;
                  setChatGroup(null);
                  setMessages([]);
                  setMembers([]);
                  setActiveClassId(item.id);
                }}
                style={[
                  styles.classChip,
                  {
                    backgroundColor: active
                      ? "#0B5FFF"
                      : isDark
                        ? "rgba(14,26,44,0.95)"
                        : "#F5F8FF",
                    borderColor: active
                      ? "#0B5FFF"
                      : isDark
                        ? "rgba(123,167,255,0.24)"
                        : "rgba(11, 95, 255, 0.18)",
                  },
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={{
                    color: active ? "#FFFFFF" : isDark ? "#EAF1FF" : "#24406A",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#AAB7CF" : "#5A6C87" },
          ]}
        >
          {t("classChat.conversation")}
        </Text>
        {loading || refreshingChat || sending || uploading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : null}
      </View>

      {!loading && classes.length > 0 && messages.length === 0 ? (
        <Text
          style={[
            styles.emptyInline,
            { color: isDark ? "#AAB7CF" : "#5C6E90" },
          ]}
        >
          {t("classChat.empty")}
        </Text>
      ) : null}
    </View>
  );

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

        {loading && classes.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#0B5FFF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            style={styles.list}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: Math.max(insets.top, 16),
                flexGrow: 1,
              },
            ]}
            ListEmptyComponent={
              !loading && classes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text
                    style={{
                      color: isDark ? "#AAB7CF" : "#5C6E90",
                      fontSize: 14,
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  >
                    {t("classChat.noClass")}
                  </Text>
                </View>
              ) : null
            }
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScroll={updateAutoScrollState}
            scrollEventThrottle={16}
            ListHeaderComponent={listHeader}
            onContentSizeChange={() => {
              if (shouldAutoScrollRef.current) {
                scrollToEnd();
              }
            }}
          />
        )}

        <View
          style={[
            styles.composerWrap,
            {
              paddingBottom: isKeyboardVisible
                ? Platform.OS === "android"
                  ? Math.max(keyboardHeight + 12, 16)
                  : Math.max(insets.bottom + 8, 12)
                : Math.max(insets.bottom + 12, 16),
            },
          ]}
        >
          {!canChat && !loading ? (
            <Text
              style={[
                styles.composerHint,
                { color: isDark ? "#9FB2D6" : "#5C6E90" },
              ]}
            >
              {t("classChat.inputDisabled")}
            </Text>
          ) : null}
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
                opacity: canChat ? 1 : 0.72,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.attachBtn,
                (!canChat || uploading || sending) && styles.sendBtnDisabled,
              ]}
              onPress={handleAttach}
              disabled={!canChat || uploading || sending}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#0B5FFF" />
              ) : (
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={canChat ? "#0B5FFF" : "#9BAECC"}
                />
              )}
            </TouchableOpacity>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                  color: isDark ? "#F4F7FB" : "#1A202C",
                },
              ]}
              value={draft}
              onChangeText={setDraft}
              placeholder={
                canChat
                  ? t("classChat.placeholder")
                  : t("classChat.inputDisabled")
              }
              placeholderTextColor={isDark ? "#8FA1BF" : COLORS.textLight}
              multiline
              textAlignVertical="top"
              editable={canChat && !sending && !uploading}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!canChat || !draft.trim() || sending || uploading) &&
                  styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!canChat || !draft.trim() || sending || uploading}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={showMembersPanel}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowMembersPanel(false);
          setMemberQuery("");
        }}
      >
        <View style={styles.membersBackdrop}>
          <View
            style={[
              styles.membersSheet,
              {
                backgroundColor: isDark ? "#0E1A2E" : "#FFFFFF",
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.membersSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.membersSheetTitle,
                    { color: isDark ? "#F4F7FB" : "#12233F" },
                  ]}
                >
                  {t("classChat.membersTitle")}
                </Text>
                {displayClassName ? (
                  <Text
                    style={[
                      styles.membersSheetSubtitle,
                      { color: isDark ? "#9FB2D6" : "#5C6E90" },
                    ]}
                  >
                    {displayClassName}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowMembersPanel(false);
                  setMemberQuery("");
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? "#9FB2D6" : "#5C6E90"}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.membersSearch,
                {
                  backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                  color: isDark ? "#F4F7FB" : "#1A202C",
                  borderColor: isDark
                    ? "rgba(123,167,255,0.24)"
                    : "rgba(11, 95, 255, 0.18)",
                },
              ]}
              value={memberQuery}
              onChangeText={setMemberQuery}
              placeholder={t("classChat.searchMembers")}
              placeholderTextColor={isDark ? "#8FA1BF" : COLORS.textLight}
            />

            <ScrollView
              style={styles.membersList}
              keyboardShouldPersistTaps="handled"
            >
              {teacherMembers.length > 0 ? (
                <View style={styles.membersSection}>
                  <Text
                    style={[
                      styles.membersSectionTitle,
                      { color: isDark ? "#AAB7CF" : "#5A6C87" },
                    ]}
                  >
                    {t("classChat.teachers")}
                  </Text>
                  {teacherMembers.map((member) => (
                    <View key={member.user_id} style={styles.memberRow}>
                      <View
                        style={[
                          styles.memberAvatar,
                          { backgroundColor: isDark ? "#1A2F4F" : "#E7F0FF" },
                        ]}
                      >
                        <Text style={styles.memberAvatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text
                          style={[
                            styles.memberName,
                            { color: isDark ? "#F4F7FB" : "#12233F" },
                          ]}
                        >
                          {member.name}
                          {member.user_id === currentUserId ? " (You)" : ""}
                        </Text>
                        <Text
                          style={[
                            styles.memberRole,
                            { color: isDark ? "#9FB2D6" : "#5C6E90" },
                          ]}
                        >
                          {t("classChat.teacher")}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {studentMembers.length > 0 ? (
                <View style={styles.membersSection}>
                  <Text
                    style={[
                      styles.membersSectionTitle,
                      { color: isDark ? "#AAB7CF" : "#5A6C87" },
                    ]}
                  >
                    {t("classChat.students")}
                  </Text>
                  {studentMembers.map((member) => (
                    <View key={member.user_id} style={styles.memberRow}>
                      <View
                        style={[
                          styles.memberAvatar,
                          { backgroundColor: isDark ? "#1A2F4F" : "#E7F0FF" },
                        ]}
                      >
                        <Text style={styles.memberAvatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text
                          style={[
                            styles.memberName,
                            { color: isDark ? "#F4F7FB" : "#12233F" },
                          ]}
                        >
                          {member.name}
                          {member.user_id === currentUserId ? " (You)" : ""}
                        </Text>
                        <Text
                          style={[
                            styles.memberRole,
                            { color: isDark ? "#9FB2D6" : "#5C6E90" },
                          ]}
                        >
                          {t("classChat.classmate")}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {filteredMembers.length === 0 ? (
                <Text
                  style={[
                    styles.membersEmpty,
                    { color: isDark ? "#AAB7CF" : "#5C6E90" },
                  ]}
                >
                  {t("classChat.noMembers")}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  classCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  classCardText: {
    flex: 1,
  },
  classCardTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  classCardMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  classRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionHeader: {
    marginTop: 16,
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
  },
  emptyInline: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  composerHint: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginBottom: 8,
    textAlign: "center",
  },
  composerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "flex-end",
    gap: 10,
    shadowColor: "#0E234E",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(11,95,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 110,
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
    opacity: 0.85,
  },
  membersBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(8, 17, 31, 0.45)",
  },
  membersSheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  membersSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  membersSheetTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  membersSheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  membersSearch: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  membersList: {
    maxHeight: 420,
  },
  membersSection: {
    marginBottom: 16,
  },
  membersSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: "#0B5FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
  },
  memberRole: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  membersEmpty: {
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 14,
    fontWeight: "600",
  },
});
