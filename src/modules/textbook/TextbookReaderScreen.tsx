import {
  fetchTextbookResources,
  fetchTextbookSelectionAsk,
  type ChatHistoryItem,
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
};

type TextbookReaderScreenProps = {
  lesson?: ReaderLesson;
};

type LearningResource = TextbookResourceItem;

const PHYSICS_UNIT1_RESOURCES: LearningResource[] = [
  {
    id: "ch1-newton-canvas",
    chapter: "Chapter 1",
    topic: "Definition and Nature of Physics",
    title: "Newton Canvas Model",
    type: "canvas",
    url: "https://chemistry3d-view-for-final-year-project-1.onrender.com/physics/chapter1/Definition%20and%20Nature%20of%20Physics.html?model=newton",
  },
  {
    id: "ch1-faraday-canvas",
    chapter: "Chapter 1",
    topic: "Definition and Nature of Physics",
    title: "Faraday Canvas Model",
    type: "canvas",
    url: "https://chemistry3d-view-for-final-year-project-1.onrender.com/physics/chapter1/Definition%20and%20Nature%20of%20Physics.html?model=faraday",
  },
  {
    id: "ch1-figure3-canvas",
    chapter: "Chapter 1",
    topic: "Definition and Nature of Physics",
    title: "Figure 3 Canvas Model",
    type: "canvas",
    url: "https://chemistry3d-view-for-final-year-project-1.onrender.com/physics/chapter1/figur-3.html",
  },
  {
    id: "ch1-newton-ar",
    chapter: "Chapter 1",
    topic: "Definition and Nature of Physics",
    title: "Newton AR Model",
    type: "ar",
    url: "https://chemistry3d-view-for-final-year-project-1.onrender.com/physics/chapter1/Definition%20and%20Nature%20of%20Physics.html?model=newton",
  },
  {
    id: "ch1-faraday-ar",
    chapter: "Chapter 1",
    topic: "Definition and Nature of Physics",
    title: "Faraday AR Model",
    type: "ar",
    url: "https://chemistry3d-view-for-final-year-project-1.onrender.com/physics/chapter1/Definition%20and%20Nature%20of%20Physics.html?model=faraday",
  },
];

const BIOLOGY_HEART_RESOURCES: LearningResource[] = [
  {
    id: "bio-ch1-heart-ar",
    chapter: "Chapter 1",
    topic: "Human Circulatory System",
    title: "Heart AR Model",
    type: "ar",
    url: "ar://heart-demo",
  },
];

const HIDE_PDFJS_UI_SCRIPT = `
  (function() {
    var lastSentSelection = '';
    var lastNonEmptySelection = '';

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
        if (selected) {
          lastNonEmptySelection = selected;
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

    window.__EDUTWIN_SELECTION__ = {
      getCurrentOrLast: function() {
        var selected = '';
        try {
          if (window.getSelection) {
            selected = String(window.getSelection().toString() || '').trim();
          }
        } catch (e) {
          // noop
        }
        if (selected) {
          lastNonEmptySelection = selected;
          return selected;
        }
        return lastNonEmptySelection || '';
      },
    };
  })();
  true;
`;

const sanitizeSelectionAnswerText = (text: string) => {
  let cleaned = String(text || "");
  cleaned = cleaned.replace(/\*+/g, "");
  cleaned = cleaned.replace(/#+/g, "");
  cleaned = cleaned.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  return cleaned || "I could not generate a clear answer from the selected text.";
};

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
  const [topicFilter, setTopicFilter] = useState("All");
  const [selectedText, setSelectedText] = useState("");
  const [selectedTextDraft, setSelectedTextDraft] = useState("");
  const [showAskAiModal, setShowAskAiModal] = useState(false);
  const [selectionQuestion, setSelectionQuestion] = useState("");
  const [selectionAnswer, setSelectionAnswer] = useState("");
  const [selectionHistory, setSelectionHistory] = useState<ChatHistoryItem[]>([]);
  const [isAskingSelection, setIsAskingSelection] = useState(false);
  const triggerScale = useRef(new Animated.Value(1)).current;
  const webViewRef = useRef<WebView>(null);
  const pendingSelectionSubmitRef = useRef(false);
  const lastNonEmptySelectionRef = useRef("");

  const subjectName = useMemo(() => {
    const lowered = (lesson?.subject || "").toLowerCase();
    if (lowered === "biology" || lowered === "chemistry" || lowered === "physics" || lowered === "math") {
      return lowered;
    }
    return "physics";
  }, [lesson?.subject]);

  const chapterOptions = useMemo(
    () => ["All", ...Array.from(new Set(resources.map((item) => item.chapter)))],
    [resources],
  );

  const topicOptions = useMemo(() => {
    const base =
      chapterFilter === "All"
        ? resources
        : resources.filter((item) => item.chapter === chapterFilter);
    return ["All", ...Array.from(new Set(base.map((item) => item.topic)))];
  }, [chapterFilter, resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      const chapterMatch = chapterFilter === "All" || item.chapter === chapterFilter;
      const topicMatch = topicFilter === "All" || item.topic === topicFilter;
      return chapterMatch && topicMatch;
    });
  }, [chapterFilter, resources, topicFilter]);

  const showResourceButton = Boolean(textbookUrl);
  const requestSubject =
    subjectName === "biology" ||
    subjectName === "chemistry" ||
    subjectName === "physics" ||
    subjectName === "math"
      ? subjectName
      : "physics";
  const requestGrade = String(studentProfile.grade || "9").trim() || "9";

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
        } else if (requestSubject === "physics") {
          setResources(PHYSICS_UNIT1_RESOURCES);
        } else if (requestSubject === "biology") {
          setResources(BIOLOGY_HEART_RESOURCES);
        } else {
          setResources([]);
        }
      } catch {
        if (!isMounted) return;
        if (requestSubject === "physics") {
          setResources(PHYSICS_UNIT1_RESOURCES);
        } else if (requestSubject === "biology") {
          setResources(BIOLOGY_HEART_RESOURCES);
        } else {
          setResources([]);
        }
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

  const syncSelectionFromWebView = () => {
    webViewRef.current?.injectJavaScript(`
      (function () {
        try {
          var selected = '';
          if (window.__EDUTWIN_SELECTION__ && window.__EDUTWIN_SELECTION__.getCurrentOrLast) {
            selected = String(window.__EDUTWIN_SELECTION__.getCurrentOrLast() || '').trim();
          } else if (window.getSelection) {
            selected = String(window.getSelection().toString() || '').trim();
          }
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'TEXT_SELECTION',
              text: selected,
            }));
          }
        } catch (e) {
          // noop
        }
      })();
      true;
    `);
  };

  const askFromSelection = async (providedSelection?: string) => {
    const normalizedSelection = (
      providedSelection ||
      selectedTextDraft ||
      selectedText ||
      lastNonEmptySelectionRef.current
    )
      .trim()
      .slice(0, 1800);
    const normalizedQuestion = selectionQuestion.trim();
    if (!normalizedSelection) {
      setSelectionAnswer("Please highlight textbook text first, then ask AI.");
      return;
    }
    if (!normalizedQuestion) {
      return;
    }

    setIsAskingSelection(true);
    setSelectionAnswer("");

    const requestHistory =
      normalizedSelection && normalizedSelection !== selectedText.trim()
        ? []
        : selectionHistory;

    try {
      const response = await fetchTextbookSelectionAsk({
        subject: requestSubject,
        grade: requestGrade,
        chapter: "",
        question: normalizedQuestion,
        selected_text: normalizedSelection,
        history: requestHistory,
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
      const normalizedAnswer = sanitizeSelectionAnswerText(
        response.response || "No answer generated.",
      );
      const userHistoryItem: ChatHistoryItem = {
        role: "user",
        content: normalizedQuestion,
      };
      const assistantHistoryItem: ChatHistoryItem = {
        role: "assistant",
        content: normalizedAnswer,
      };
      const nextHistory: ChatHistoryItem[] = [
        ...requestHistory,
        userHistoryItem,
        assistantHistoryItem,
      ].slice(-10);

      setSelectedText(normalizedSelection);
      lastNonEmptySelectionRef.current = normalizedSelection;
      setSelectionAnswer(normalizedAnswer);
      setSelectionHistory(nextHistory);
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

  useEffect(() => {
    if (!showAskAiModal) {
      return;
    }
    syncSelectionFromWebView();
  }, [showAskAiModal]);

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
        ref={webViewRef}
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
            // Keep the last non-empty selection. PDF.js often emits an empty
            // selection on touch/mouse release right before pressing Ask AI.
            if (nextText) {
              lastNonEmptySelectionRef.current = nextText;
              setSelectedText(nextText);
              setSelectedTextDraft(nextText);
              if (
                pendingSelectionSubmitRef.current &&
                selectionQuestion.trim() &&
                !isAskingSelection
              ) {
                pendingSelectionSubmitRef.current = false;
                setSelectedText(nextText);
                setSelectedTextDraft(nextText);
                void askFromSelection(nextText);
              }
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
            syncSelectionFromWebView();
            const prefillSelection =
              selectedText.trim() ||
              selectedTextDraft.trim() ||
              lastNonEmptySelectionRef.current.trim();
            if (prefillSelection) {
              setSelectedTextDraft(prefillSelection);
            }
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
                      onPress={() => {
                        setChapterFilter(option);
                        setTopicFilter("All");
                      }}
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

                <Text style={styles.filterLabel}>Topic</Text>
                <View style={styles.filterRow}>
                  {topicOptions.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => setTopicFilter(option)}
                      style={[
                        styles.filterChip,
                        topicFilter === option && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          topicFilter === option && styles.filterChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {filteredResources.length > 0 ? (
                  filteredResources.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.canvasChoiceCard}
                      onPress={() => openResource(item)}
                    >
                      <View style={styles.canvasChoiceLeft}>
                        <Ionicons
                          name={item.type === "ar" ? "scan-outline" : "cube-outline"}
                          size={18}
                          color="#0B5FFF"
                        />
                        <View>
                          <Text style={styles.canvasChoiceTitle}>{item.title}</Text>
                          <Text style={styles.canvasChoiceSubtitle}>
                            {item.chapter} • {item.topic} • {item.type.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#0B5FFF" />
                    </Pressable>
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
              <View style={styles.selectionPreviewCard}>
                <Text style={styles.selectionPreviewText}>
                  {selectedTextDraft.trim()
                    ? selectedTextDraft
                    : "No text selected yet. Highlight the textbook question first."}
                </Text>
              </View>

              <Text style={styles.askLabel}>Your question</Text>
              <TextInput
                value={selectionQuestion}
                onChangeText={setSelectionQuestion}
                placeholder="Ask anything about the highlighted text..."
                placeholderTextColor="#7E8EA8"
                multiline
                style={styles.askInput}
              />
              <Text style={styles.askHint}>Tip: Highlight text directly in the PDF, then ask AI.</Text>

              <Pressable
                onPress={() => {
                  const submitSelection =
                    selectedTextDraft.trim() ||
                    selectedText.trim() ||
                    lastNonEmptySelectionRef.current.trim();
                  if (!submitSelection) {
                    pendingSelectionSubmitRef.current = true;
                    setSelectionAnswer("Capturing selected text...");
                    syncSelectionFromWebView();
                    return;
                  }

                  pendingSelectionSubmitRef.current = false;
                  setSelectedTextDraft(submitSelection);
                  setSelectedText(submitSelection);
                  void askFromSelection(submitSelection);
                }}
                disabled={
                  !selectionQuestion.trim() ||
                  isAskingSelection
                }
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
                  <Text style={styles.answerText}>{selectionAnswer}</Text>
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
  askHint: {
    color: "#5A6C87",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
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
  answerText: {
    color: "#1D2B45",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
});
