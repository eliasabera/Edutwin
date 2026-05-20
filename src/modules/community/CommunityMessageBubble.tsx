import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/shared/i18n";

type CommunityMessageBubbleProps = {
  body: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  isUser: boolean;
  senderLabel?: string | null;
  timestamp: string;
  isDark: boolean;
};

export default function CommunityMessageBubble({
  body,
  attachmentUrl,
  attachmentType,
  isUser,
  senderLabel,
  timestamp,
  isDark,
}: CommunityMessageBubbleProps) {
  const { t } = useTranslation();
  const hasImage = Boolean(attachmentUrl && attachmentType === "image");

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.otherContainer,
      ]}
    >
      {!isUser ? (
        <View style={styles.avatar}>
          <Ionicons name="people" size={18} color="#FFFFFF" />
        </View>
      ) : null}

      <View
        style={[
          styles.bubble,
          isUser
            ? styles.userBubble
            : [
                styles.otherBubble,
                {
                  backgroundColor: isDark
                    ? "rgba(14,26,44,0.95)"
                    : "rgba(255,255,255,0.9)",
                  borderColor: isDark
                    ? "rgba(123,167,255,0.26)"
                    : "rgba(11,95,255,0.14)",
                },
              ],
        ]}
      >
        {!isUser && senderLabel ? (
          <Text
            style={[styles.senderLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}
          >
            {senderLabel}
          </Text>
        ) : null}

        {hasImage ? (
          <Image
            source={{ uri: attachmentUrl! }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : null}

        {body ? (
          <Text
            style={[
              styles.text,
              isUser
                ? styles.userText
                : [styles.otherText, { color: isDark ? "#F4F7FB" : "#1A202C" }],
            ]}
          >
            {body}
          </Text>
        ) : null}

        {attachmentUrl && attachmentType !== "image" ? (
          <Text
            style={[
              styles.text,
              isUser
                ? styles.userText
                : [styles.otherText, { color: isDark ? "#F4F7FB" : "#1A202C" }],
            ]}
          >
            [Attachment]
          </Text>
        ) : null}

        <Text
          style={[
            styles.time,
            isUser
              ? styles.userTime
              : [styles.otherTime, { color: isDark ? "#8FA1BF" : "#718096" }],
          ]}
        >
          {timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 15,
    maxWidth: "88%",
  },
  userContainer: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  otherContainer: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0B5FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 2,
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    shadowColor: "#0E234E",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  userBubble: {
    backgroundColor: "#0B5FFF",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  senderLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  messageImage: {
    width: 220,
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  otherText: {
    color: "#1A202C",
  },
  time: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  userTime: {
    color: "rgba(255,255,255,0.7)",
  },
  otherTime: {
    color: "#718096",
  },
});
