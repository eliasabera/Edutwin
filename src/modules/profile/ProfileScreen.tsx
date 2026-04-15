import {
  fetchStudentProfile,
  mapBackendProfileToStudentProfile,
  setCachedStudentProfile,
} from "@/shared/services/auth-service";
import {
  getStudentProfile,
  updateStudentProfile,
  useStudentProfile,
} from "@/shared/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const studentProfile = useStudentProfile();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [activeCard, setActiveCard] = useState<"student" | "twin">("student");

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
            <View style={styles.studentAvatarWrap}>
              <View style={styles.studentAvatarOuter}>
                <View style={styles.studentAvatarInner}>
                  <Text style={styles.studentAvatarText}>
                    {studentInitials}
                  </Text>
                </View>
              </View>
            </View>

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
            <TouchableOpacity
              style={styles.profileSwitchItem}
              onPress={() => setActiveCard("student")}
            >
              <View
                style={[
                  styles.profileSwitchCircle,
                  activeCard === "student" && styles.profileSwitchCircleActive,
                ]}
              >
                <Image
                  source={require("../../../assets/images/icon.png")}
                  style={styles.profileSwitchImage}
                />
              </View>
              <Text
                style={[
                  styles.profileSwitchText,
                  activeCard === "student" && styles.profileSwitchTextActive,
                ]}
              >
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileSwitchItem}
              onPress={() => setActiveCard("twin")}
            >
              <View
                style={[
                  styles.profileSwitchCircle,
                  activeCard === "twin" && styles.profileSwitchCircleActive,
                ]}
              >
                <Image
                  source={require("../../../assets/images/android-icon-foreground.png")}
                  style={styles.profileSwitchImage}
                />
              </View>
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

          {activeCard === "student" ? (
            <>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="school-outline" size={18} color="#0B5FFF" />
                <Text style={styles.sectionTitle}>Student Profile</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>
                  {studentProfile.fullName || "Not set"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Grade</Text>
                <Text style={styles.infoValue}>Grade {studentProfile.grade}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Language</Text>
                <Text style={styles.infoValue}>
                  {studentProfile.preferredLanguage.toUpperCase()}
                </Text>
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
            </>
          ) : (
            <>
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
            </>
          )}
        </View>
      </ScrollView>
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
    gap: 8,
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
  profileSwitchCircleActive: {
    borderColor: "#0B5FFF",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
});
