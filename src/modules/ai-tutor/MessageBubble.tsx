import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface MessageProps {
  text: string;
  isUser: boolean; // true = Student, false = AI
  timestamp?: string;
  isTyping?: boolean;
}

export default function MessageBubble({
  text,
  isUser,
  timestamp,
  isTyping,
}: MessageProps) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    if (!isTyping) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : `${prev}.`));
    }, 400);
    return () => clearInterval(interval);
  }, [isTyping]);

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      {/* AI Avatar (Only show on left) */}
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="school" size={20} color="white" />
        </View>
      )}

      {/* The Bubble */}
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}
      >
        {!isUser && <Text style={styles.aiLabel}>EduTwin</Text>}
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {isTyping ? `Thinking${dots}` : text}
        </Text>

        {/* Timestamp */}
        <Text style={[styles.time, isUser ? styles.userTime : styles.aiTime]}>
          {timestamp || "Just now"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 15,
    maxWidth: "85%",
  },
  userContainer: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  aiContainer: {
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
  aiBubble: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(11,95,255,0.14)",
    borderTopLeftRadius: 4,
  },

  aiLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    color: "#5A6C87",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "700",
  },

  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "white",
  },
  aiText: {
    color: "#1A202C",
  },

  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  userTime: {
    color: "rgba(255,255,255,0.7)",
  },
  aiTime: {
    color: "#718096",
  },
});
