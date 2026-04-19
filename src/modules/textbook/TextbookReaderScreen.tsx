import Constants from "expo-constants";
import {
  fetchTextbookResources,
  fetchTextbookSelectionAsk,
  type TextbookResourceItem,
} from "@/shared/services/ai-service";
import { useStudentProfile } from "@/shared/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type ReaderLesson = {
  subject: "Biology" | "Chemistry" | "Physics" | "Math";
  textbookUrl: string;
  grade?: string;
};

type TextbookReaderScreenProps = {
  lesson?: ReaderLesson;
};

type LearningResource = TextbookResourceItem;

const HIDE_PDFJS_UI_SCRIPT = `
  (function() {
    var lastSentSelection = '';

    var hide = function(selector) {
      var node = document.querySelector(selector);
      if (node) {
        node.style.display = 'none';
      }
    };

    var apply = function() {
      hide('#toolbarContainer');
      hide('#sidebarContainer');
      hide('#sidebarToggleButton');

      var outer = document.getElementById('outerContainer');
      if (outer) {
        outer.classList.remove('sidebarOpen');
      }

      var viewer = document.getElementById('viewerContainer');
      if (viewer) {
        viewer.style.top = '0px';
        viewer.style.left = '0px';
      }
    };

    var emitSelection = function() {
      try {
        var selected = '';
        if (window.getSelection) {
          selected = String(window.getSelection().toString() || '').trim();
        }
        if (selected === lastSentSelection) {
          return;
        }
        lastSentSelection = selected;
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'TEXT_SELECTION',
            text: selected,
          }));
        }
      } catch (e) {
        // noop
      }
    };

    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 1000);

    document.addEventListener('selectionchange', function() {
      setTimeout(emitSelection, 120);
    });
    document.addEventListener('mouseup', function() {
      setTimeout(emitSelection, 120);
    });
    document.addEventListener('touchend', function() {
      setTimeout(emitSelection, 180);
    });
    setInterval(emitSelection, 600);
  })();
  true;
`;

const sanitizeSelectionAnswerText = (text: string) => {
  let cleaned = String(text || "");
  cleaned = cleaned.replace(/\*+/g, "");
  cleaned = cleaned.replace(/#+/g, "");
  cleaned = cleaned.replace(
    /\b(?:Example|Examples|Summary|Practice\s*Question|Activity(?:\s*\d+)?)\s*:.*/i,
    "",
  );

  cleaned = cleaned.replace(/\r\n/g, "\n");
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1] !== ""))
    .join("\n")
    .trim();

  // If the backend returns one long sentence block, split it into readable lines.
  if (!cleaned.includes("\n") && cleaned.length > 220) {
    cleaned = cleaned.replace(/([.!?])\s+(?=[A-Z0-9])/g, "$1\n");
  }

  return cleaned || "I could not generate a clear answer from the selected text.";
};

const toAnswerParagraphs = (text: string): string[] =>
  String(text || "")
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean);

export default function TextbookReaderScreen({
  lesson,
}: TextbookReaderScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const studentProfile = useStudentProfile();
  const textbookUrl = lesson?.textbookUrl?.trim();
  const viewerUrl = textbookUrl ? textbookUrl : "";
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [activeResource, setActiveResource] = useState<LearningResource | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [chapterFilter, setChapterFilter] = useState("All");
  const [selectedText, setSelectedText] = useState("");
  const [selectedTextDraft, setSelectedTextDraft] = useState("");
  const [showAskAiModal, setShowAskAiModal] = useState(false);
  const [selectionQuestion, setSelectionQuestion] = useState("");
  const [selectionAnswer, setSelectionAnswer] = useState("");
  const [isAskingSelection, setIsAskingSelection] = useState(false);
  const triggerScale = useRef(new Animated.Value(1)).current;
  const answerParagraphs = useMemo(
    () => toAnswerParagraphs(selectionAnswer),
    [selectionAnswer],
  );

  const subjectName = useMemo(() => {
    const lowered = (lesson?.subject || "").toLowerCase();
    if (lowered === "biology" || lowered === "chemistry" || lowered === "physics" || lowered === "math") {
      return lowered;
    }
    return "physics";
  }, [lesson?.subject]);

  const chapterOptions = useMemo(() => {
    const chapterSortValue = (chapter: string) => {
      const match = String(chapter || "").match(/chapter\s*(\d+)/i);
      if (!match) return Number.MAX_SAFE_INTEGER;
      return Number(match[1]);
    };

    const sortedChapters = Array.from(new Set(resources.map((item) => item.chapter))).sort(
      (a, b) => {
        const numDiff = chapterSortValue(a) - chapterSortValue(b);
        if (numDiff !== 0) return numDiff;
        return a.localeCompare(b);
      },
    );

    return ["All", ...sortedChapters];
  }, [resources]);

  const filteredResources = useMemo(
    () =>
      resources.filter(
        (item) => chapterFilter === "All" || item.chapter === chapterFilter,
      ),
    [chapterFilter, resources],
  );

  const groupedResources = useMemo(() => {
    const grouped: Record<string, { canvas: LearningResource[]; ar: LearningResource[] }> = {};

    const chapterSortValue = (chapter: string) => {
      const match = String(chapter || "").match(/chapter\s*(\d+)/i);
      if (!match) return Number.MAX_SAFE_INTEGER;
      return Number(match[1]);
    };

    for (const item of filteredResources) {
      if (!grouped[item.chapter]) {
        grouped[item.chapter] = { canvas: [], ar: [] };
      }

      if (item.type === "ar") {
        grouped[item.chapter].ar.push(item);
      } else {
        grouped[item.chapter].canvas.push(item);
      }
    }

    return Object.entries(grouped)
      .map(([chapter, entries]) => ({
        chapter,
        canvas: [...entries.canvas].sort((a, b) => a.title.localeCompare(b.title)),
        ar: [...entries.ar].sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => {
        const numDiff = chapterSortValue(a.chapter) - chapterSortValue(b.chapter);
        if (numDiff !== 0) return numDiff;
        return a.chapter.localeCompare(b.chapter);
      });
  }, [filteredResources]);

  const showResourceButton = Boolean(textbookUrl);
  const requestSubject =
    subjectName === "biology" ||
    subjectName === "chemistry" ||
    subjectName === "physics" ||
    subjectName === "math"
      ? subjectName
      : "physics";
  const requestGrade = String(lesson?.grade || studentProfile.grade || "9").trim() || "9";

  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      if (!textbookUrl) {
        setResources([]);
        return;
      }

      setIsLoadingResources(true);
      try {
        const remoteResources = await fetchTextbookResources({
          subject: requestSubject,
          grade: requestGrade,
        });
        if (!isMounted) return;

        if (remoteResources.length > 0) {
          setResources(remoteResources);
          setChapterFilter("All");
        } else {
          setResources([]);
          setChapterFilter("All");
        }
      } catch {
        if (!isMounted) return;
        setResources([]);
        setChapterFilter("All");
      } finally {
        if (isMounted) {
          setIsLoadingResources(false);
        }
      }
    };

    void loadResources();
    return () => {
      isMounted = false;
    };
  }, [requestGrade, requestSubject, textbookUrl]);

  const askFromSelection = async () => {
    const normalizedSelection = selectedTextDraft.trim();
    const normalizedQuestion = selectionQuestion.trim();
    if (!normalizedQuestion) {
      return;
    }

    setIsAskingSelection(true);
    setSelectionAnswer("");

    try {
      const response = await fetchTextbookSelectionAsk({
        subject: requestSubject,
        grade: requestGrade,
        chapter: "",
        question: normalizedQuestion,
        selected_text: normalizedSelection,
        full_name:
          typeof studentProfile.fullName === "string" && studentProfile.fullName.trim()
            ? studentProfile.fullName
            : "Student",
        support_subjects: Array.isArray(studentProfile.supportSubjects)
          ? studentProfile.supportSubjects
          : [],
        strong_subjects: Array.isArray(studentProfile.strongSubjects)
          ? studentProfile.strongSubjects
          : [],
        mastery_score:
          typeof studentProfile.masteryScore === "number"
            ? studentProfile.masteryScore
            : null,
        performance_band:
          typeof studentProfile.performanceBand === "string" &&
          studentProfile.performanceBand.trim()
            ? studentProfile.performanceBand
            : "unknown",
      });
      setSelectionAnswer(sanitizeSelectionAnswerText(response.response || "No answer generated."));
    } catch {
      setSelectionAnswer("I could not process this selection right now. Please try again.");
    } finally {
      setIsAskingSelection(false);
    }
  };

  const openResource = (item: LearningResource) => {
    if (item.type === "ar") {
      if (item.url.startsWith("ar://")) {
        const modelId = item.url.replace("ar://", "").trim();
        if (modelId) {
          setShowResourceModal(false);
          setActiveResource(null);
          router.push(`/ar-view/${modelId}` as never);
          return;
        }
      }

      if (item.id.toLowerCase().includes("heart") || item.title.toLowerCase().includes("heart")) {
        setShowResourceModal(false);
        setActiveResource(null);
        router.push("/ar-view/heart-demo" as never);
        return;
      }
    }

    setActiveResource(item);
  };

  useEffect(() => {
    if (!showResourceButton) {
      triggerScale.stopAnimation();
      triggerScale.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(triggerScale, {
          toValue: 1.08,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(triggerScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [showResourceButton, triggerScale]);

  if (!textbookUrl) {
    return (
      <View style={[styles.emptyWrap, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.emptyTitle}>No textbook URL found.</Text>
        <Text style={styles.emptyHint}>Please select a textbook from the library.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen} pointerEvents="box-none">
      <WebView
        source={{ uri: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(viewerUrl)}` }}
        style={styles.webView}
        originWhitelist={["*"]}
        startInLoadingState
        injectedJavaScript={HIDE_PDFJS_UI_SCRIPT}
        onMessage={(event) => {
          try {
            const parsed = JSON.parse(event.nativeEvent.data || "{}");
            if (parsed?.type !== "TEXT_SELECTION") {
              return;
            }
            const nextText =
              typeof parsed?.text === "string" ? parsed.text.trim() : "";
            setSelectedText(nextText);
            if (!nextText) {
              setShowAskAiModal(false);
            }
          } catch {
            // ignore malformed bridge messages
          }
        }}
        renderLoading={() => (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#0B5FFF" />
            <Text style={styles.loaderText}>Opening textbook...</Text>
          </View>
        )}
      />

      {showResourceButton ? (
        <View style={[styles.bubbleWrap, { top: insets.top + 10 }]} pointerEvents="box-none">
          <Animated.View style={{ transform: [{ scale: triggerScale }] }}>
            <Pressable
              style={({ pressed }) => [styles.circleTrigger, pressed && styles.circleTriggerPressed]}
              onPress={() => {
                setChapterFilter("All");
                setShowResourceModal(true);
              }}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      <View style={[styles.selectionAskWrap, { top: insets.top + 62 }]} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [styles.selectionAskButton, pressed && styles.selectionAskButtonPressed]}
          onPress={() => {
            setSelectedTextDraft(selectedText);
            setShowAskAiModal(true);
          }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
          <Text style={styles.selectionAskText}>Ask AI</Text>
        </Pressable>
      </View>

      <Modal
        visible={showResourceModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (activeResource) {
            setActiveResource(null);
            return;
          }
          setShowResourceModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingTop: insets.top + 8 }]}> 
            <View style={styles.modalHeader}>
              {activeResource ? (
                <Pressable
                  style={styles.inlineBackButton}
                  onPress={() => setActiveResource(null)}
                >
                  <Ionicons name="chevron-back" size={18} color="#0B5FFF" />
                  <Text style={styles.inlineBackText}>Back to list</Text>
                </Pressable>
              ) : (
                <Text style={styles.modalTitle}>Canvas and AR resources</Text>
              )}

              <Pressable
                onPress={() => {
                  setShowResourceModal(false);
                  setActiveResource(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#1A202C" />
              </Pressable>
            </View>

            {activeResource ? (
              <WebView
                source={{ uri: activeResource.url }}
                style={styles.modalWebView}
                originWhitelist={["*"]}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.loaderWrap}>
                    <ActivityIndicator size="small" color="#0B5FFF" />
                    <Text style={styles.loaderText}>Opening canvas model...</Text>
                  </View>
                )}
              />
            ) : (
              <ScrollView contentContainerStyle={styles.canvasChooserWrap}>
                <Text style={styles.canvasChooserTitle}>Filter learning resources</Text>
                <Text style={styles.canvasChooserHint}>
                  Pick chapter and topic, then open Canvas or AR without leaving the textbook screen.
                </Text>

                <Text style={styles.filterLabel}>Chapter</Text>
                <View style={styles.filterRow}>
                  {chapterOptions.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => setChapterFilter(option)}
                      style={[
                        styles.filterChip,
                        chapterFilter === option && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          chapterFilter === option && styles.filterChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {groupedResources.length > 0 ? (
                  groupedResources.map((group) => (
                    <View key={group.chapter} style={styles.chapterGroupCard}>
                      <Text style={styles.chapterGroupTitle}>{group.chapter}</Text>

                      <Text style={styles.groupTypeTitle}>Canvas</Text>
                      {group.canvas.length > 0 ? (
                        group.canvas.map((item) => (
                          <Pressable
                            key={item.id}
                            style={styles.canvasChoiceCard}
                            onPress={() => openResource(item)}
                          >
                            <View style={styles.canvasChoiceLeft}>
                              <Ionicons name="cube-outline" size={18} color="#0B5FFF" />
                              <View>
                                <Text style={styles.canvasChoiceTitle}>{item.title}</Text>
                                <Text style={styles.canvasChoiceSubtitle}>
                                  {item.topic} • CANVAS
                                </Text>
                              </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#0B5FFF" />
                          </Pressable>
                        ))
                      ) : (
                        <Text style={styles.groupEmptyText}>No canvas models in this chapter.</Text>
                      )}

                      <Text style={styles.groupTypeTitle}>AR</Text>
                      {group.ar.length > 0 ? (
                        group.ar.map((item) => (
                          <Pressable
                            key={item.id}
                            style={styles.canvasChoiceCard}
                            onPress={() => openResource(item)}
                          >
                            <View style={styles.canvasChoiceLeft}>
                              <Ionicons name="scan-outline" size={18} color="#0B5FFF" />
                              <View>
                                <Text style={styles.canvasChoiceTitle}>{item.title}</Text>
                                <Text style={styles.canvasChoiceSubtitle}>
                                  {item.topic} • AR
                                </Text>
                              </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#0B5FFF" />
                          </Pressable>
                        ))
                      ) : (
                        <Text style={styles.groupEmptyText}>No AR models in this chapter.</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>
                      {isLoadingResources
                        ? "Loading textbook models..."
                        : "No models found for this textbook/filter."}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAskAiModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAskAiModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.askModalCard, { paddingTop: insets.top + 8 }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ask AI about highlighted text</Text>
              <Pressable
                onPress={() => setShowAskAiModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#1A202C" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.askModalContent}>
              <Text style={styles.askLabel}>Selected text</Text>
              <TextInput
                value={selectedTextDraft}
                onChangeText={setSelectedTextDraft}
                placeholder="Highlight text from the textbook, or paste/type excerpt here."
                placeholderTextColor="#7E8EA8"
                multiline
                style={styles.askInput}
              />

              <Text style={styles.askLabel}>Your question</Text>
              <TextInput
                value={selectionQuestion}
                onChangeText={setSelectionQuestion}
                placeholder="Ask anything about the highlighted text..."
                placeholderTextColor="#7E8EA8"
                multiline
                style={styles.askInput}
              />

              <Pressable
                onPress={() => {
                  setSelectedText(selectedTextDraft);
                  void askFromSelection();
                }}
                disabled={!selectionQuestion.trim() || isAskingSelection}
                style={({ pressed }) => [
                  styles.askSubmitButton,
                  (!selectionQuestion.trim() || isAskingSelection) &&
                    styles.askSubmitButtonDisabled,
                  pressed && styles.askSubmitButtonPressed,
                ]}
              >
                <Text style={styles.askSubmitText}>
                  {isAskingSelection ? "Thinking..." : "Ask AI"}
                </Text>
              </Pressable>

              {selectionAnswer ? (
                <View style={styles.answerCard}>
                  <Text style={styles.askLabel}>AI answer</Text>
                  <ScrollView
                    style={styles.answerScroll}
                    contentContainerStyle={styles.answerScrollContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {answerParagraphs.length > 0 ? (
                      answerParagraphs.map((paragraph, index) => (
                        <Text key={`answer-${index}`} style={styles.answerText}>
                          {paragraph}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.answerText}>{selectionAnswer}</Text>
                    )}
                  </ScrollView>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  bubbleWrap: {
    position: "absolute",
    right: 14,
    zIndex: 99,
    elevation: 99,
  },
  circleTrigger: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B5FFF",
    shadowColor: "#0E234E",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  circleTriggerPressed: {
    transform: [{ scale: 0.96 }],
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
  canvasChooserWrap: {
    padding: 18,
    gap: 12,
  },
  canvasChooserTitle: {
    color: "#102443",
    fontSize: 18,
    fontWeight: "800",
  },
  canvasChooserHint: {
    color: "#5A6C87",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  canvasChoiceCard: {
    borderWidth: 1,
    borderColor: "#C8DCF9",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  canvasChoiceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  canvasChoiceTitle: {
    color: "#102443",
    fontSize: 14,
    fontWeight: "800",
  },
  canvasChoiceSubtitle: {
    marginTop: 2,
    color: "#4E6284",
    fontSize: 12,
    fontWeight: "600",
  },
  chapterGroupCard: {
    borderWidth: 1,
    borderColor: "#D4E3FA",
    borderRadius: 14,
    backgroundColor: "#F9FBFF",
    padding: 12,
    gap: 8,
  },
  chapterGroupTitle: {
    color: "#102443",
    fontSize: 14,
    fontWeight: "800",
  },
  groupTypeTitle: {
    color: "#27446E",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  groupEmptyText: {
    color: "#5A6C87",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  filterLabel: {
    marginTop: 4,
    color: "#27446E",
    fontSize: 12,
    fontWeight: "800",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 2,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C8DCF9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: "#0B5FFF",
    backgroundColor: "#E7F0FF",
  },
  filterChipText: {
    color: "#4E6284",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#0B5FFF",
  },
  emptyFilterState: {
    borderWidth: 1,
    borderColor: "#D4E3FA",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F7FAFF",
  },
  emptyFilterText: {
    color: "#5A6C87",
    fontSize: 12,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 20, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    height: "88%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  askModalCard: {
    height: "86%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  modalHeader: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E3ECF8",
  },
  modalTitle: {
    color: "#102443",
    fontSize: 15,
    fontWeight: "800",
  },
  inlineBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  inlineBackText: {
    color: "#0B5FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FD",
  },
  modalWebView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  selectionAskWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
  selectionAskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0B5FFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#0E234E",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  selectionAskButtonPressed: {
    opacity: 0.85,
  },
  selectionAskText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  askModalContent: {
    padding: 16,
    gap: 10,
  },
  askLabel: {
    color: "#27446E",
    fontSize: 12,
    fontWeight: "800",
  },
  selectionPreviewCard: {
    borderWidth: 1,
    borderColor: "#C8DCF9",
    borderRadius: 12,
    backgroundColor: "#F8FBFF",
    padding: 12,
  },
  selectionPreviewText: {
    color: "#2A3E60",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  askInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#C8DCF9",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#1D2B45",
    fontSize: 14,
    fontWeight: "600",
    textAlignVertical: "top",
  },
  askSubmitButton: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "#0B5FFF",
    paddingVertical: 10,
    alignItems: "center",
  },
  askSubmitButtonDisabled: {
    backgroundColor: "#9CB9F2",
  },
  askSubmitButtonPressed: {
    opacity: 0.86,
  },
  askSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  answerCard: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#C8DCF9",
    borderRadius: 12,
    backgroundColor: "#F8FBFF",
    padding: 12,
    gap: 6,
  },
  answerScroll: {
    maxHeight: 230,
  },
  answerScrollContent: {
    gap: 10,
    paddingBottom: 2,
  },
  answerText: {
    color: "#1D2B45",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 22,
  },
});
