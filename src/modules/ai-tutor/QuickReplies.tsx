import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  options: string[];
  onSelect: (text: string) => void;
}

export default function QuickReplies({ options, onSelect }: Props) {
  if (!options || options.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Try a quick prompt</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.chip}
            onPress={() => onSelect(option)}
          >
            <Text style={styles.text}>{option}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 6,
    backgroundColor: "transparent",
  },
  title: {
    marginLeft: 16,
    marginBottom: 6,
    fontSize: 12,
    color: "#5A6C87",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  container: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "rgba(11,95,255,0.16)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#0E234E",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  text: {
    color: "#0B5FFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
