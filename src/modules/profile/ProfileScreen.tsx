import {
  fetchStudentProfile,
  mapBackendProfileToStudentProfile,
  clearAuthToken,
  setCachedStudentProfile,
} from "@/shared/services/auth-service";
import { clearChatSessionId } from "@/shared/services/ai-service";
import { resetGamificationState } from "@/shared/services/gamification";
import {
  getStudentProfile,
  resetStudentProfile,
  updateStudentProfile,
  useStudentProfile,
} from "@/shared/store/user-store";
import {
  STUDENT_CARTOON_AVATARS,
  TWIN_CARTOON_AVATARS,
} from "@/shared/constants/avatar-presets";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const studentProfile = useStudentProfile();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [activeCard, setActiveCard] = useState<"student" | "twin">("student");
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [avatarPickerTarget, setAvatarPickerTarget] = useState<"student" | "twin">("student");
  const [sliderWidth, setSliderWidth] = useState(0);
  const [pendingPhotoUri, setPendingPhotoUri] = useState("");
  const [pendingPhotoTarget, setPendingPhotoTarget] = useState<"student" | "twin" | null>(null);
  const sliderRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const syncProfile = async () => {
        if (isMounted) {
          setIsSyncing(true);
          setSyncError("");
        }

        try {
          console.log("Profile sync: fetching from backend...");
          const profile = await fetchStudentProfile({ forceRefresh: true });
          if (!isMounted) return;

          setCachedStudentProfile(profile);

          const currentProfile = getStudentProfile();

          const normalizedSupport = (profile.support_subjects || [])
            .filter((item) => ["biology", "chemistry", "physics", "math"].includes(item))
            .map((item) => item as "biology" | "chemistry" | "physics" | "math");

          const normalizedStrong = (profile.strong_subjects || [])
            .filter((item) => ["biology", "chemistry", "physics", "math"].includes(item))
            .map((item) => item as "biology" | "chemistry" | "physics" | "math");

          updateStudentProfile({
            fullName: profile.full_name || currentProfile.fullName,
            grade: String(profile.grade_level ?? profile.grade ?? currentProfile.grade),
            preferredLanguage: profile.language === "om" ? "om" : "en",
            masteryScore:
              typeof profile.mastery_score === "number"
                ? profile.mastery_score
                : currentProfile.masteryScore,
            performanceBand:
              profile.performance_band === "top"
                ? "top"
                : profile.performance_band === "support" || profile.performance_band === "low"
                  ? "support"
                  : "medium",
            twinName: profile.twin_name || currentProfile.twinName,
            supportSubjects:
              normalizedSupport.length > 0 ? normalizedSupport : currentProfile.supportSubjects,
            strongSubjects:
              normalizedStrong.length > 0 ? normalizedStrong : currentProfile.strongSubjects,
            diagnosticCompleted:
              typeof profile.diagnostic_completed === "boolean"
                ? profile.diagnostic_completed
                : currentProfile.diagnosticCompleted,
          });
        } catch (error) {
          console.warn("Profile fetch failed:", error);
          if (isMounted) {
            const message =
              error instanceof Error ? error.message : "Failed to fetch profile";
            setSyncError(message);
          }
        } finally {
          if (isMounted) {
            setIsSyncing(false);
          }
        }
      };

      syncProfile();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  const supportSubjects = studentProfile.supportSubjects.join(", ") || "None";
  const strongSubjects = studentProfile.strongSubjects.join(", ") || "None";
  const studentInitials = (studentProfile.fullName || "Student")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const studentPhotoUri = studentProfile.studentPhotoUri?.trim() || "";
  const twinPhotoUri = studentProfile.twinPhotoUri?.trim() || "";

  const pickPhotoFor = async (target: "student" | "twin") => {
    try {
      if (isPickingPhoto) return;
      setIsPickingPhoto(true);
      setSyncError("");

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setSyncError("Media permission is required to set a profile photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const uri = String(result.assets[0]?.uri || "").trim();
      if (!uri) {
        return;
      }

      setPendingPhotoTarget(target);
      setPendingPhotoUri(uri);
    } catch {
      setSyncError("Could not pick image. Please try again.");
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const applyPendingPhoto = () => {
    if (!pendingPhotoTarget || !pendingPhotoUri.trim()) {
      return;
    }

    if (pendingPhotoTarget === "student") {
      updateStudentProfile({ studentPhotoUri: pendingPhotoUri.trim() });
    } else {
      updateStudentProfile({ twinPhotoUri: pendingPhotoUri.trim() });
    }

    setPendingPhotoUri("");
    setPendingPhotoTarget(null);
  };

  const cancelPendingPhoto = () => {
    setPendingPhotoUri("");
    setPendingPhotoTarget(null);
  };

  const openPhotoOptions = (target: "student" | "twin") => {
    const hasPhoto = target === "student" ? Boolean(studentPhotoUri) : Boolean(twinPhotoUri);
    const targetLabel = target === "student" ? "Student" : "EduTwin";

    Alert.alert(`${targetLabel} photo`, "Choose an option", [
      {
        text: hasPhoto ? "Change photo" : "Add photo",
        onPress: () => {
          void pickPhotoFor(target);
        },
      },
      {
        text: "Choose cartoon avatar",
        onPress: () => {
          setAvatarPickerTarget(target);
          setAvatarPickerVisible(true);
        },
      },
      ...(hasPhoto
        ? [
            {
              text: "Delete photo",
              style: "destructive" as const,
              onPress: () => clearPhotoFor(target),
            },
          ]
        : []),
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const clearPhotoFor = (target: "student" | "twin") => {
    if (target === "student") {
      updateStudentProfile({ studentPhotoUri: undefined });
      return;
    }
    updateStudentProfile({ twinPhotoUri: undefined });
  };

  const choosePresetAvatar = (target: "student" | "twin", uri: string) => {
    if (target === "student") {
      updateStudentProfile({ studentPhotoUri: uri });
    } else {
      updateStudentProfile({ twinPhotoUri: uri });
    }
    setAvatarPickerVisible(false);
  };

  const presetAvatarList =
    avatarPickerTarget === "student" ? STUDENT_CARTOON_AVATARS : TWIN_CARTOON_AVATARS;

  const scrollToCard = (target: "student" | "twin") => {
    setActiveCard(target);
    if (!sliderWidth) return;
    sliderRef.current?.scrollTo({
      x: target === "student" ? 0 : sliderWidth,
      animated: true,
    });
  };

  const handleLogout = () => {
    clearAuthToken();
    clearChatSessionId();
    setCachedStudentProfile(null);
    resetStudentProfile();
    resetGamificationState();
    router.replace("/(auth)/login" as never);
  };

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgGlowBlue} />
      <View pointerEvents="none" style={styles.bgGlowGold} />
      <View pointerEvents="none" style={styles.bgGlowSky} />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 16,
            paddingBottom: 120 + Math.max(insets.bottom, 8),
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
        <View style={styles.heroCard}>
          {isSyncing && (
            <View style={styles.syncPill}>
              <Text style={styles.syncPillText}>Syncing profile...</Text>
            </View>
          )}

          {!!syncError && (
            <View style={styles.syncErrorPill}>
              <Text style={styles.syncErrorText}>{syncError}</Text>
            </View>
          )}

          <View style={styles.heroTopRow}>
            <TouchableOpacity
              style={styles.studentAvatarWrap}
              onPress={() => openPhotoOptions("student")}
              activeOpacity={0.85}
              disabled={isPickingPhoto}
            >
              <View style={styles.studentAvatarOuter}>
                <View style={styles.studentAvatarInner}>
                  {studentPhotoUri ? (
                    <Image source={{ uri: studentPhotoUri }} style={styles.studentAvatarImage} />
                  ) : (
                    <Text style={styles.studentAvatarText}>
                      {studentInitials}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.heroTextBlock}>
              <View style={styles.heroBadge}>
                <Ionicons
                  name="person-circle-outline"
                  size={14}
                  color="#0B5FFF"
                />
                <Text style={styles.heroBadgeText}>Profile Center</Text>
              </View>

              <Text style={styles.title}>
                {studentProfile.fullName || "Student"}
              </Text>
            </View>
          </View>

        </View>

        <View style={styles.sectionCard}>
          <View style={styles.profileSwitchRow}>
            <TouchableOpacity style={styles.profileSwitchItem} onPress={() => scrollToCard("student")}>
              <Text
                style={[
                  styles.profileSwitchText,
                  activeCard === "student" && styles.profileSwitchTextActive,
                ]}
              >
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileSwitchItem} onPress={() => scrollToCard("twin")}>
              <Text
                style={[
                  styles.profileSwitchText,
                  activeCard === "twin" && styles.profileSwitchTextActive,
                ]}
              >
                EduTwin
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              if (width > 0 && width !== sliderWidth) {
                setSliderWidth(width);
              }
            }}
            onMomentumScrollEnd={(event) => {
              const width = sliderWidth || event.nativeEvent.layoutMeasurement.width;
              if (!width) return;
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setActiveCard(nextIndex <= 0 ? "student" : "twin");
            }}
          >
            <View style={[styles.sliderPage, sliderWidth ? { width: sliderWidth } : null]}>
              <View style={styles.pageAvatarRow}>
                <View style={styles.profileSwitchCircle}>
                  {studentPhotoUri ? (
                    <Image source={{ uri: studentPhotoUri }} style={styles.profileSwitchImage} />
                  ) : (
                    <Image
                      source={require("../../../assets/images/icon.png")}
                      style={styles.profileSwitchImage}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.avatarEditBadge}
                  onPress={() => openPhotoOptions("student")}
                  disabled={isPickingPhoto}
                >
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.sectionTitleRow}>
                <Ionicons name="school-outline" size={18} color="#0B5FFF" />
                <Text style={styles.sectionTitle}>Student Profile</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{studentProfile.fullName || "Not set"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Grade</Text>
                <Text style={styles.infoValue}>Grade {studentProfile.grade}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Language</Text>
                <Text style={styles.infoValue}>{studentProfile.preferredLanguage.toUpperCase()}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Learning Level</Text>
                <Text style={styles.infoValue}>
                  {studentProfile.performanceBand === "support"
                    ? "Needs guided support"
                    : studentProfile.performanceBand === "top"
                      ? "Advanced performer"
                      : "On-track learner"}
                </Text>
              </View>
            </View>

            <View style={[styles.sliderPage, sliderWidth ? { width: sliderWidth } : null]}>
              <View style={styles.pageAvatarRow}>
                <View style={styles.profileSwitchCircle}>
                  {twinPhotoUri ? (
                    <Image source={{ uri: twinPhotoUri }} style={styles.profileSwitchImage} />
                  ) : (
                    <Image
                      source={require("../../../assets/images/android-icon-foreground.png")}
                      style={styles.profileSwitchImage}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.avatarEditBadge}
                  onPress={() => openPhotoOptions("twin")}
                  disabled={isPickingPhoto}
                >
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Twin Name</Text>
                <Text style={styles.infoValue}>{studentProfile.twinName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Support Subjects</Text>
                <Text style={styles.infoValue}>{supportSubjects}</Text>
              </View>
              <View style={styles.infoRowLast}>
                <Text style={styles.infoLabel}>Strong Subjects</Text>
                <Text style={styles.infoValue}>{strongSubjects}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.sliderDotsRow}>
            <View style={[styles.sliderDot, activeCard === "student" && styles.sliderDotActive]} />
            <View style={[styles.sliderDot, activeCard === "twin" && styles.sliderDotActive]} />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#B4232D" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={avatarPickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAvatarPickerVisible(false)}
      >
        <Pressable
          style={styles.avatarPickerBackdrop}
          onPress={() => setAvatarPickerVisible(false)}
        >
          <Pressable style={styles.avatarPickerCard} onPress={() => {}}>
            <View style={styles.avatarPickerHeader}>
              <Text style={styles.avatarPickerTitle}>
                {avatarPickerTarget === "student" ? "Choose Student Avatar" : "Choose EduTwin Avatar"}
              </Text>
              <TouchableOpacity
                onPress={() => setAvatarPickerVisible(false)}
                style={styles.avatarPickerClose}
              >
                <Ionicons name="close" size={18} color="#1A202C" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarGrid}>
              {presetAvatarList.map((uri) => {
                const selected =
                  avatarPickerTarget === "student"
                    ? studentPhotoUri === uri
                    : twinPhotoUri === uri;
                return (
                  <TouchableOpacity
                    key={uri}
                    onPress={() => choosePresetAvatar(avatarPickerTarget, uri)}
                    style={[styles.avatarGridItem, selected && styles.avatarGridItemSelected]}
                  >
                    <Image source={{ uri }} style={styles.avatarGridImage} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(pendingPhotoUri)}
        animationType="fade"
        transparent
        onRequestClose={cancelPendingPhoto}
      >
        <Pressable style={styles.avatarPickerBackdrop} onPress={cancelPendingPhoto}>
          <Pressable style={styles.avatarPickerCard} onPress={() => {}}>
            <Text style={styles.avatarPickerTitle}>Use this photo?</Text>
            {pendingPhotoUri ? (
              <Image source={{ uri: pendingPhotoUri }} style={styles.pendingPreviewImage} />
            ) : null}
            <View style={styles.pendingActionRow}>
              <TouchableOpacity
                style={styles.pendingBackButton}
                onPress={cancelPendingPhoto}
                activeOpacity={0.85}
              >
                <Text style={styles.pendingBackText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pendingUseButton}
                onPress={applyPendingPhoto}
                activeOpacity={0.85}
              >
                <Text style={styles.pendingUseText}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    overflow: "hidden",
  },
  bgGlowBlue: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -50,
    left: -70,
    backgroundColor: "rgba(11, 95, 255, 0.16)",
  },
  bgGlowGold: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 999,
    bottom: 120,
    right: -90,
    backgroundColor: "rgba(255, 150, 0, 0.14)",
  },
  bgGlowSky: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: "42%",
    left: "34%",
    backgroundColor: "rgba(30, 144, 255, 0.08)",
  },
  container: {
    paddingHorizontal: 18,
    gap: 14,
  },
  heroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowColor: "#0E234E",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  syncPill: {
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E7F0FF",
  },
  syncPillText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  syncErrorPill: {
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFEAEC",
  },
  syncErrorText: {
    color: "#B4232D",
    fontSize: 12,
    fontWeight: "700",
  },
  studentAvatarWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  studentAvatarOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(11, 95, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.18)",
  },
  studentAvatarInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  studentAvatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  studentAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E7F0FF",
  },
  heroBadgeText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: "800",
    color: "#1A202C",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#5A6C87",
  },
  heroMetaPill: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F5F8FF",
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  heroMetaText: {
    color: "#35507E",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    padding: 14,
    shadowColor: "#0E234E",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 8,
  },
  logoutButton: {
    marginTop: 6,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    paddingVertical: 14,
  },
  logoutButtonText: {
    color: "#B4232D",
    fontSize: 15,
    fontWeight: "800",
  },
  profileSwitchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EEFF",
  },
  profileSwitchItem: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  profileSwitchCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF4FF",
    borderWidth: 2,
    borderColor: "#D6E4FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileSwitchImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  profileSwitchText: {
    color: "#5A6C87",
    fontSize: 12,
    fontWeight: "700",
  },
  profileSwitchTextActive: {
    color: "#0B5FFF",
  },
  sliderPage: {
    paddingTop: 4,
  },
  pageAvatarRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarEditBadge: {
    position: "absolute",
    right: "38%",
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  sliderDotsRow: {
    marginTop: 6,
    marginBottom: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  sliderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#C8D8F5",
  },
  sliderDotActive: {
    width: 16,
    backgroundColor: "#0B5FFF",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: "#1A202C",
    fontSize: 18,
    fontWeight: "800",
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EEFF",
  },
  infoRowLast: {
    paddingVertical: 10,
  },
  infoLabel: {
    color: "#5A6C87",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    marginTop: 4,
    color: "#1A202C",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  avatarPickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 11, 21, 0.46)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  avatarPickerCard: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E9F8",
    padding: 14,
    gap: 12,
  },
  avatarPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarPickerTitle: {
    color: "#1A202C",
    fontSize: 16,
    fontWeight: "800",
  },
  avatarPickerClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  avatarGridItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#D6E4FF",
    overflow: "hidden",
    backgroundColor: "#EEF4FF",
  },
  avatarGridItemSelected: {
    borderColor: "#0B5FFF",
  },
  avatarGridImage: {
    width: "100%",
    height: "100%",
  },
  pendingPreviewImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
  },
  pendingActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  pendingBackButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    backgroundColor: "#F4F8FF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  pendingBackText: {
    color: "#35507E",
    fontSize: 13,
    fontWeight: "700",
  },
  pendingUseButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  pendingUseText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
