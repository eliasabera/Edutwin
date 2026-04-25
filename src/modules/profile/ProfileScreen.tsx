import {
  STUDENT_CARTOON_AVATARS,
  TWIN_CARTOON_AVATARS,
} from "@/shared/constants/avatar-presets";
import { clearChatSessionId } from "@/shared/services/ai-service";
import {
  clearAuthToken,
  fetchStudentProfile,
  mapBackendProfileToStudentProfile,
  redeemLabBonusUnlock,
  saveStudentProfile,
  setCachedStudentProfile,
  uploadStudentPhotoFromProfile,
} from "@/shared/services/auth-service";
import { resetGamificationState } from "@/shared/services/gamification";
import { setPreferredLanguage } from "@/shared/store/language-store";
import {
  getEffectiveThemeMode,
  useAppSettings,
} from "@/shared/store/settings-store";
import { useTranslation } from "@/shared/i18n";
import {
  getStudentProfile,
  resetStudentProfile,
  updateStudentProfile,
  useStudentProfile,
} from "@/shared/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const studentProfile = useStudentProfile();
  const appSettings = useAppSettings();
  const { language } = useTranslation();
  const deviceTheme = useColorScheme();
  const isDark =
    appSettings.themeMode === "system"
      ? (deviceTheme ?? getEffectiveThemeMode()) === "dark"
      : appSettings.themeMode === "dark";
  const isOm = language === "om";
  const copy = {
    syncingProfile: isOm
      ? "Piroofaayilii wajjiin wal-simsiisaa jira..."
      : "Syncing profile...",
    profileCenter: isOm ? "Wiirtuu Piroofaayilii" : "Profile Center",
    student: isOm ? "Barataa" : "Student",
    eduTwin: "EduTwin",
    studentProfile: isOm ? "Piroofaayilii Barataa" : "Student Profile",
    fullName: isOm ? "Maqaa guutuu" : "Full Name",
    notSet: isOm ? "Hin guutamne" : "Not set",
    grade: isOm ? "Kutaa" : "Grade",
    language: isOm ? "Afaan" : "Language",
    learningLevel: isOm ? "Sadarkaa barnootaa" : "Learning Level",
    needsSupport: isOm
      ? "Deeggarsa qajeelfamaa barbaada"
      : "Needs guided support",
    advanced: isOm ? "Barataa sadarkaa ol'aanaa" : "Advanced performer",
    onTrack: isOm ? "Barataa adeemsa gaarii irratti" : "On-track learner",
    twinName: isOm ? "Maqaa Twin" : "Twin Name",
    supportSubjects: isOm ? "Matadureewwan deeggarsa" : "Support Subjects",
    strongSubjects: isOm ? "Matadureewwan cimoo" : "Strong Subjects",
    xp: isOm ? "XP" : "XP",
    mastery: isOm ? "Sadarkaa Mastery" : "Mastery",
    bonusUnlock: isOm ? "XP 2000 ol jechuun Canvas fi AR dabalataa ni banii" : "XP above 2000 unlocks extra Canvas and AR access",
    redeemBonus: isOm ? "XP seerii keessaa banuu" : "Redeem lab bonus",
    bonusUnlocked: isOm ? "Lab bonus bantee jira" : "Lab bonus unlocked",
    logout: isOm ? "Ba'i" : "Logout",
    failedFetchProfile: isOm
      ? "Piroofaayilii fiduun hin milkoofne"
      : "Failed to fetch profile",
    failedUpdateProfile: isOm
      ? "Piroofaayilii haaromsuun hin milkoofne."
      : "Failed to update profile.",
    mediaPermission: isOm
      ? "Hayyama suuraa barbaachisaadha piroofaayilii jijjiiruuf."
      : "Media permission is required to set a profile photo.",
    couldNotPickImage: isOm
      ? "Suuraa filachuun hin danda'amne. Irra deebi'ii yaali."
      : "Could not pick image. Please try again.",
    none: isOm ? "Hin jiru" : "None",
    chooseStudentAvatar: isOm
      ? "Suuraa Barataa Filadhu"
      : "Choose Student Avatar",
    chooseTwinAvatar: isOm ? "Suuraa EduTwin Filadhu" : "Choose EduTwin Avatar",
    useThisPhoto: isOm ? "Suuraa kana fayyadamaa?" : "Use this photo?",
    back: isOm ? "Duubatti" : "Back",
    usePhoto: isOm ? "Suuraa Fayyadami" : "Use Photo",
    applyingPhoto: isOm ? "Suuraa olkaa'aa jira..." : "Saving photo...",
    photo: isOm ? "suuraa" : "photo",
    chooseOption: isOm ? "Filannoo tokko filadhu" : "Choose an option",
    changePhoto: isOm ? "Suuraa jijjiiri" : "Change photo",
    addPhoto: isOm ? "Suuraa dabali" : "Add photo",
    chooseCartoon: isOm ? "Suuraa kaartoona filadhu" : "Choose cartoon avatar",
    deletePhoto: isOm ? "Suuraa haqi" : "Delete photo",
    cancel: isOm ? "Dhiisi" : "Cancel",
    editProfile: isOm ? "Piroofaayilii Sirreessi" : "Edit Profile",
    editProfileTitle: isOm ? "Piroofaayilii Sirreessi" : "Edit Profile",
    fullNamePlaceholder: isOm ? "Maqaa guutuu galchi" : "Enter full name",
    twinNamePlaceholder: isOm ? "Maqaa Twin galchi" : "Enter twin name",
    gradePlaceholder: isOm ? "Kutaa (fkn 9)" : "Grade (e.g. 9)",
    save: isOm ? "Olkaa'i" : "Save",
    profileSetting: isOm ? "Piroofaayilii" : "Profile",
    general: isOm ? "Waliigala" : "General",
    preferences: isOm ? "Filannoo" : "Preferences",
    editProfileSubtitle: isOm
      ? "Maqaa fi suuraa piroofaayilii jijjiiri"
      : "Change profile details and image",
    changePassword: isOm ? "Jecha Darbii Jijjiiri" : "Change Password",
    changePasswordSubtitle: isOm
      ? "Nageenya akaawuntii cimsii"
      : "Update and strengthen account security",
    twinProfile: isOm ? "Piroofaayilii Twin" : "Twin Profile",
    twinProfileSubtitle: isOm
      ? "Maqaa fi suuraa twin jijjiiri"
      : "Change twin name and image",
    subscriptionStatus: isOm ? "Haala Maallaqa Galmee" : "Subscription Status",
    subscriptionActive: isOm ? "Hojii irra jira" : "Active",
    subscriptionExpired: isOm ? "Yeroon isaa darbe" : "Expired",
    noSubscription: isOm ? "Galmeen hin jiru" : "No active subscription",
    expiresOn: isOm ? "Itti fufa hanga" : "Expires on",
    expiredOn: isOm ? "Darbee jira irraa" : "Expired on",
    faq: isOm ? "Gaaffii Irra Deddeebii" : "FAQ",
    faqSubtitle: isOm
      ? "Gaaffilee yeroo baayyee gaafataman"
      : "Find answers to common questions",
    accountSnapshot: isOm ? "Haala Akaawuntii" : "Account Snapshot",
    comingSoon: isOm ? "Dhiheenyatti ni dabalama" : "Coming soon",
    changeDetails: isOm ? "Odeeffannoo Jijjiiri" : "Change details",
    changeStudentImage: isOm
      ? "Suuraa Barataa Jijjiiri"
      : "Change student image",
    changeTwinName: isOm ? "Maqaa Twin Jijjiiri" : "Change twin name",
    changeTwinImage: isOm ? "Suuraa Twin Jijjiiri" : "Change twin image",
  };
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [activeCard, setActiveCard] = useState<"student" | "twin">("student");
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [avatarPickerTarget, setAvatarPickerTarget] = useState<
    "student" | "twin"
  >("student");
  const [sliderWidth, setSliderWidth] = useState(0);
  const [pendingPhotoUri, setPendingPhotoUri] = useState("");
  const [pendingPhotoTarget, setPendingPhotoTarget] = useState<
    "student" | "twin" | null
  >(null);
  const [isApplyingPhoto, setIsApplyingPhoto] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editModalMode, setEditModalMode] = useState<"student" | "twin">(
    "student",
  );
  const [isSnapshotExpanded, setIsSnapshotExpanded] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editTwinName, setEditTwinName] = useState("");
  const [editLanguage, setEditLanguage] = useState<"en" | "om">("en");
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

          applyBackendProfile(profile);
        } catch (error) {
          console.warn("Profile fetch failed:", error);
          if (isMounted) {
            const message =
              error instanceof Error ? error.message : copy.failedFetchProfile;
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

  const supportSubjects =
    studentProfile.supportSubjects.join(", ") || copy.none;
  const strongSubjects = studentProfile.strongSubjects.join(", ") || copy.none;
  const profileXp = studentProfile.xp ?? 0;
  const masteryPercent = Math.max(0, Math.min(100, Math.round(studentProfile.masteryScore ?? 0)));
  const bonusUnlockAvailable = profileXp > 2000;
  const rawSubscriptionExpiry =
    studentProfile.subscriptionPeriodEnd ||
    (studentProfile as unknown as {
      subscriptionExpiresAt?: string | null;
      subscription_expires_at?: string | null;
    }).subscriptionExpiresAt ||
    (studentProfile as unknown as {
      subscriptionExpiresAt?: string | null;
      subscription_expires_at?: string | null;
    }).subscription_expires_at ||
    null;
  const subscriptionStatusValue = (studentProfile.subscriptionStatus || "").toLowerCase();
  const isBackendSubscribed =
    studentProfile.isSubscribed === true ||
    subscriptionStatusValue === "active" ||
    subscriptionStatusValue === "paid";

  const subscriptionMeta = useMemo(() => {
    if (isBackendSubscribed) {
      if (!rawSubscriptionExpiry) {
        return {
          label: copy.subscriptionActive,
          detail: copy.subscriptionActive,
          isExpired: false,
        };
      }

      const parsedDate = new Date(rawSubscriptionExpiry);
      if (Number.isNaN(parsedDate.getTime())) {
        return {
          label: copy.subscriptionActive,
          detail: copy.subscriptionActive,
          isExpired: false,
        };
      }

      return {
        label: copy.subscriptionActive,
        detail: `${copy.expiresOn} ${parsedDate.toLocaleDateString()}`,
        isExpired: false,
      };
    }

    if (!rawSubscriptionExpiry) {
      return {
        label: copy.noSubscription,
        detail: copy.noSubscription,
        isExpired: true,
      };
    }

    const parsedDate = new Date(rawSubscriptionExpiry);
    if (Number.isNaN(parsedDate.getTime())) {
      return {
        label: copy.noSubscription,
        detail: copy.noSubscription,
        isExpired: true,
      };
    }

    const isExpired = parsedDate.getTime() < Date.now();
    const formatted = parsedDate.toLocaleDateString();

    return {
      label: isExpired ? copy.subscriptionExpired : copy.subscriptionActive,
      detail: `${isExpired ? copy.expiredOn : copy.expiresOn} ${formatted}`,
      isExpired,
    };
  }, [
    copy.expiredOn,
    copy.expiresOn,
    copy.noSubscription,
    copy.subscriptionActive,
    copy.subscriptionExpired,
    isBackendSubscribed,
    rawSubscriptionExpiry,
  ]);
  const studentInitials = (studentProfile.fullName || copy.student)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const studentPhotoUri = studentProfile.studentPhotoUri?.trim() || "";
  const twinPhotoUri = studentProfile.twinPhotoUri?.trim() || "";

  const applyBackendProfile = (
    profile: Awaited<ReturnType<typeof fetchStudentProfile>>,
  ) => {
    setCachedStudentProfile(profile);

    const currentProfile = getStudentProfile();
    const mappedProfile = mapBackendProfileToStudentProfile(profile);

    updateStudentProfile({
      ...mappedProfile,
      supportSubjects:
        Array.isArray(mappedProfile.supportSubjects) &&
        mappedProfile.supportSubjects.length > 0
          ? mappedProfile.supportSubjects
          : currentProfile.supportSubjects,
      strongSubjects:
        Array.isArray(mappedProfile.strongSubjects) &&
        mappedProfile.strongSubjects.length > 0
          ? mappedProfile.strongSubjects
          : currentProfile.strongSubjects,
      studentPhotoUri:
        mappedProfile.studentPhotoUri !== undefined
          ? mappedProfile.studentPhotoUri
          : currentProfile.studentPhotoUri,
      twinPhotoUri:
        mappedProfile.twinPhotoUri !== undefined
          ? mappedProfile.twinPhotoUri
          : currentProfile.twinPhotoUri,
    });
    void setPreferredLanguage(
      mappedProfile.preferredLanguage ||
        currentProfile.preferredLanguage ||
        "en",
    );
  };

  const persistProfileChanges = async (
    updates: Parameters<typeof updateStudentProfile>[0],
  ) => {
    setIsSyncing(true);
    setSyncError("");

    try {
      const savedProfile = await saveStudentProfile(updates);
      applyBackendProfile(savedProfile);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.failedUpdateProfile;
      setSyncError(message);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const pickPhotoFor = async (target: "student" | "twin") => {
    try {
      if (isPickingPhoto) return;
      setIsPickingPhoto(true);
      setSyncError("");

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setSyncError(copy.mediaPermission);
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
      setSyncError(copy.couldNotPickImage);
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const applyPendingPhoto = async () => {
    if (!pendingPhotoTarget || !pendingPhotoUri.trim()) {
      return;
    }

    try {
      setIsApplyingPhoto(true);
      if (pendingPhotoTarget === "student") {
        const uploaded = await uploadStudentPhotoFromProfile(
          pendingPhotoUri.trim(),
        );
        await persistProfileChanges({
          studentPhotoUri: uploaded.student_photo_url,
        });
      } else {
        await persistProfileChanges({ twinPhotoUri: pendingPhotoUri.trim() });
      }

      setPendingPhotoUri("");
      setPendingPhotoTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.failedUpdateProfile;
      setSyncError(message);
      Alert.alert(copy.failedUpdateProfile, message);
    } finally {
      setIsApplyingPhoto(false);
    }
  };

  const cancelPendingPhoto = () => {
    setPendingPhotoUri("");
    setPendingPhotoTarget(null);
  };

  const openPhotoOptions = (target: "student" | "twin") => {
    const hasPhoto =
      target === "student" ? Boolean(studentPhotoUri) : Boolean(twinPhotoUri);
    const targetLabel = target === "student" ? copy.student : copy.eduTwin;

    Alert.alert(`${targetLabel} ${copy.photo}`, copy.chooseOption, [
      {
        text: hasPhoto ? copy.changePhoto : copy.addPhoto,
        onPress: () => {
          void pickPhotoFor(target);
        },
      },
      ...(target === "twin"
        ? [
            {
              text: copy.chooseCartoon,
              onPress: () => {
                setAvatarPickerTarget(target);
                setAvatarPickerVisible(true);
              },
            },
          ]
        : []),
      ...(hasPhoto
        ? [
            {
              text: copy.deletePhoto,
              style: "destructive" as const,
              onPress: () => clearPhotoFor(target),
            },
          ]
        : []),
      {
        text: copy.cancel,
        style: "cancel",
      },
    ]);
  };

  const clearPhotoFor = async (target: "student" | "twin") => {
    if (target === "student") {
      await persistProfileChanges({ studentPhotoUri: undefined });
      return;
    }
    await persistProfileChanges({ twinPhotoUri: undefined });
  };

  const choosePresetAvatar = async (
    target: "student" | "twin",
    uri: string,
  ) => {
    try {
      if (target === "student") {
        if (/^https?:\/\//i.test(uri)) {
          await persistProfileChanges({ studentPhotoUri: uri });
        } else {
          const uploaded = await uploadStudentPhotoFromProfile(uri);
          await persistProfileChanges({
            studentPhotoUri: uploaded.student_photo_url,
          });
        }
      } else {
        await persistProfileChanges({ twinPhotoUri: uri });
      }

      setAvatarPickerVisible(false);
    } catch {
      // Error is already shown in syncError.
    }
  };

  const presetAvatarList =
    avatarPickerTarget === "student"
      ? STUDENT_CARTOON_AVATARS
      : TWIN_CARTOON_AVATARS;

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

  const openEditProfile = () => {
    setEditFullName(studentProfile.fullName || "");
    setEditLanguage(studentProfile.preferredLanguage || "en");
    setEditModalMode("student");
    setIsEditModalVisible(true);
  };

  const openEditProfileRowOptions = () => {
    setEditFullName(studentProfile.fullName || "");
    setEditLanguage(studentProfile.preferredLanguage || "en");
    setEditModalMode("student");
    setIsEditModalVisible(true);
  };

  const openTwinProfileRowOptions = () => {
    setEditTwinName(studentProfile.twinName || "");
    setEditModalMode("twin");
    setIsEditModalVisible(true);
  };

  const handleSaveProfileEdit = async () => {
    const updates: Parameters<typeof updateStudentProfile>[0] =
      editModalMode === "student"
        ? {
            fullName: editFullName.trim() || studentProfile.fullName,
            preferredLanguage: editLanguage,
          }
        : {
            twinName: editTwinName.trim() || studentProfile.twinName,
          };

    try {
      await persistProfileChanges(updates);
      setIsEditModalVisible(false);
    } catch {
      // Error already shown via syncError.
    }
  };

  const handleRedeemLabBonus = async () => {
    try {
      setIsSyncing(true);
      setSyncError("");
      const profile = await redeemLabBonusUnlock();
      applyBackendProfile(profile);
      Alert.alert(copy.bonusUnlocked, copy.bonusUnlock);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.failedUpdateProfile;
      setSyncError(message);
      Alert.alert(copy.failedUpdateProfile, message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
      ]}
    >
      <View pointerEvents="none" style={styles.bgGlowBlue} />
      <View pointerEvents="none" style={styles.bgGlowGold} />
      <View pointerEvents="none" style={styles.bgGlowSky} />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 14,
            paddingBottom: Math.max(insets.bottom + tabBarHeight + 8, 16),
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
        <View
          style={[
            styles.profileBadgeCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "rgba(255, 255, 255, 0.94)",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.16)",
            },
          ]}
        >
          <View style={styles.profileBadgeRow}>
            <Ionicons name="person-circle-outline" size={15} color="#0B5FFF" />
            <Text
              style={[
                styles.profileBadgeText,
                { color: isDark ? "#F4F7FB" : "#1A202C" },
              ]}
            >
              {copy.profileSetting}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.12)",
            },
          ]}
        >
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
                    <Image
                      source={{ uri: studentPhotoUri }}
                      style={styles.studentAvatarImage}
                    />
                  ) : (
                    <Text style={styles.studentAvatarText}>
                      {studentInitials}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.heroTextBlock}>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? "#F4F7FB" : "#1A202C" },
                ]}
              >
                {studentProfile.fullName || copy.student}
              </Text>

              <Text style={[styles.heroTopMeta, { color: isDark ? "#AAB7CF" : "#60779E" }]}>
                {copy.grade} {studentProfile.grade} • {studentProfile.preferredLanguage.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "#E6EEFF",
            },
          ]}
        >
          <Text
            style={[styles.groupTitle, { color: isDark ? "#C5D6F2" : "#7A879D" }]}
          >
            {copy.general}
          </Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={openEditProfileRowOptions}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.settingIconWrap,
                { backgroundColor: isDark ? "#12213A" : "#EEF4FF" },
              ]}
            >
              <Ionicons name="person-outline" size={16} color="#5A8DFF" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#F4F7FB" : "#1A202C" },
                ]}
              >
                {copy.editProfile}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: isDark ? "#9EB2D4" : "#8A97AC" },
                ]}
              >
                {copy.editProfileSubtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#7D9AC6" : "#A4B1C4"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert(copy.changePassword, copy.comingSoon)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.settingIconWrap,
                { backgroundColor: isDark ? "#12213A" : "#EEF4FF" },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color="#5A8DFF"
              />
            </View>
            <View style={styles.settingTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#F4F7FB" : "#1A202C" },
                ]}
              >
                {copy.changePassword}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: isDark ? "#9EB2D4" : "#8A97AC" },
                ]}
              >
                {copy.changePasswordSubtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#7D9AC6" : "#A4B1C4"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={openTwinProfileRowOptions}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.settingIconWrap,
                { backgroundColor: isDark ? "#12213A" : "#EEF4FF" },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color="#5A8DFF"
              />
            </View>
            <View style={styles.settingTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#F4F7FB" : "#1A202C" },
                ]}
              >
                {copy.twinProfile}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: isDark ? "#9EB2D4" : "#8A97AC" },
                ]}
              >
                {copy.twinProfileSubtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#7D9AC6" : "#A4B1C4"}
            />
          </TouchableOpacity>

          <View style={styles.settingRowLast}>
            <View
              style={[
                styles.settingIconWrap,
                { backgroundColor: isDark ? "#12213A" : "#EEF4FF" },
              ]}
            >
              <Ionicons name="card-outline" size={16} color="#5A8DFF" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#F4F7FB" : "#1A202C" },
                ]}
              >
                {copy.subscriptionStatus}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  {
                    color: subscriptionMeta.isExpired
                      ? isDark
                        ? "#FFB4BA"
                        : "#B4232D"
                      : isDark
                        ? "#9EB2D4"
                        : "#8A97AC",
                  },
                ]}
              >
                {subscriptionMeta.detail}
              </Text>
            </View>
            <View
              style={[
                styles.subscriptionPill,
                {
                  backgroundColor: subscriptionMeta.isExpired
                    ? isDark
                      ? "rgba(180,35,45,0.2)"
                      : "#FFF1F2"
                    : isDark
                      ? "rgba(11,95,255,0.24)"
                      : "#ECF3FF",
                  borderColor: subscriptionMeta.isExpired
                    ? isDark
                      ? "rgba(254,202,202,0.34)"
                      : "#FECACA"
                    : isDark
                      ? "#2E4368"
                      : "#D4E3FA",
                },
              ]}
            >
              <Text
                style={[
                  styles.subscriptionPillText,
                  {
                    color: subscriptionMeta.isExpired
                      ? isDark
                        ? "#FFB4BA"
                        : "#B4232D"
                      : isDark
                        ? "#BFD6FF"
                        : "#1F4E9D",
                  },
                ]}
              >
                {subscriptionMeta.label}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "#E6EEFF",
            },
          ]}
        >
          <Text
            style={[styles.groupTitle, { color: isDark ? "#C5D6F2" : "#7A879D" }]}
          >
            {copy.preferences}
          </Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert(copy.faq, copy.comingSoon)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.settingIconWrap,
                { backgroundColor: isDark ? "#12213A" : "#EEF4FF" },
              ]}
            >
              <Ionicons
                name="help-circle-outline"
                size={16}
                color="#5A8DFF"
              />
            </View>
            <View style={styles.settingTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#F4F7FB" : "#1A202C" },
                ]}
              >
                {copy.faq}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: isDark ? "#9EB2D4" : "#8A97AC" },
                ]}
              >
                {copy.faqSubtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#7D9AC6" : "#A4B1C4"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRowLast}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.settingIconWrap,
                {
                  backgroundColor: isDark
                    ? "rgba(180,35,45,0.2)"
                    : "#FFF1F2",
                },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={isDark ? "#FFB4BA" : "#B4232D"}
              />
            </View>
            <View style={styles.settingTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#FFB4BA" : "#B4232D" },
                ]}
              >
                {copy.logout}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#7D9AC6" : "#A4B1C4"}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "#E6EEFF",
            },
          ]}
        >
          <TouchableOpacity
            style={styles.snapshotHeaderRow}
            onPress={() => setIsSnapshotExpanded((prev) => !prev)}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.groupTitle, { color: isDark ? "#C5D6F2" : "#7A879D" }]}
            >
              {copy.accountSnapshot}
            </Text>
            <Ionicons
              name={isSnapshotExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={isDark ? "#9EB2D4" : "#8A97AC"}
            />
          </TouchableOpacity>

          {isSnapshotExpanded ? (
            <>
              <View style={styles.snapshotMetricsRow}>
                <View
                  style={[
                    styles.snapshotMetricCard,
                    { backgroundColor: isDark ? "#12213A" : "#F5F8FF", borderColor: isDark ? "#22324E" : "#D6E4FF" },
                  ]}
                >
                  <Text style={[styles.snapshotMetricLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>{copy.xp}</Text>
                  <Text style={[styles.snapshotMetricValue, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>{profileXp.toLocaleString()}</Text>
                </View>
                <View
                  style={[
                    styles.snapshotMetricCard,
                    { backgroundColor: isDark ? "#12213A" : "#F5F8FF", borderColor: isDark ? "#22324E" : "#D6E4FF" },
                  ]}
                >
                  <Text style={[styles.snapshotMetricLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>{copy.mastery}</Text>
                  <Text style={[styles.snapshotMetricValue, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>{masteryPercent}%</Text>
                </View>
              </View>
              <View
                style={[
                  styles.snapshotHintPill,
                  { backgroundColor: bonusUnlockAvailable ? (isDark ? "rgba(11,95,255,0.18)" : "#ECF3FF") : (isDark ? "rgba(170,183,207,0.12)" : "#F2F5FA") },
                ]}
              >
                <Ionicons name={bonusUnlockAvailable ? "sparkles-outline" : "lock-closed-outline"} size={14} color={bonusUnlockAvailable ? "#0B5FFF" : (isDark ? "#9EB2D4" : "#7A879D")} />
                <Text style={[styles.snapshotHintText, { color: bonusUnlockAvailable ? (isDark ? "#BFD6FF" : "#1F4E9D") : (isDark ? "#9EB2D4" : "#7A879D") }]}>
                  {bonusUnlockAvailable ? copy.bonusUnlock : (isOm ? "XP 2000 ol gochu" : "Earn 2000 XP to unlock extra Canvas and AR")}
                </Text>
              </View>
              {bonusUnlockAvailable && !studentProfile.labBonusUnlock ? (
                <TouchableOpacity
                  style={[
                    styles.redeemButton,
                    { backgroundColor: isDark ? "#0B5FFF" : "#0B5FFF" },
                  ]}
                  onPress={() => void handleRedeemLabBonus()}
                  disabled={isSyncing}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.redeemButtonText}>{copy.redeemBonus}</Text>
                </TouchableOpacity>
              ) : studentProfile.labBonusUnlock ? (
                <View style={styles.redeemSuccessPill}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#0B5FFF" />
                  <Text style={styles.redeemSuccessText}>{copy.bonusUnlocked}</Text>
                </View>
              ) : null}
              <View style={styles.snapshotRow}>
            <Text style={[styles.snapshotLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>{copy.fullName}</Text>
            <Text style={[styles.snapshotValue, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>{studentProfile.fullName || copy.notSet}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={[styles.snapshotLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>{copy.grade}</Text>
            <Text style={[styles.snapshotValue, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>{studentProfile.grade}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={[styles.snapshotLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>{copy.language}</Text>
            <Text style={[styles.snapshotValue, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>{studentProfile.preferredLanguage.toUpperCase()}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={[styles.snapshotLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>{copy.twinName}</Text>
            <Text style={[styles.snapshotValue, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>{studentProfile.twinName}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={[styles.snapshotLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>{copy.supportSubjects}</Text>
            <Text style={[styles.snapshotValue, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>{supportSubjects}</Text>
          </View>
          <View style={styles.snapshotRowLast}>
            <Text style={[styles.snapshotLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>{copy.strongSubjects}</Text>
            <Text style={[styles.snapshotValue, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>{strongSubjects}</Text>
          </View>
            </>
          ) : null}
        </View>

        <View
          style={[
            styles.sectionCard,
            styles.hiddenLegacy,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.12)",
            },
          ]}
        >
          <View
            style={[
              styles.profileSwitchRow,
              { borderBottomColor: isDark ? "#22324E" : "#E6EEFF" },
            ]}
          >
            <TouchableOpacity
              style={styles.profileSwitchItem}
              onPress={() => scrollToCard("student")}
            >
              <Text
                style={[
                  styles.profileSwitchText,
                  { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  activeCard === "student" && styles.profileSwitchTextActive,
                ]}
              >
                {copy.student}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileSwitchItem}
              onPress={() => scrollToCard("twin")}
            >
              <Text
                style={[
                  styles.profileSwitchText,
                  { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  activeCard === "twin" && styles.profileSwitchTextActive,
                ]}
              >
                {copy.eduTwin}
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
              const width =
                sliderWidth || event.nativeEvent.layoutMeasurement.width;
              if (!width) return;
              const nextIndex = Math.round(
                event.nativeEvent.contentOffset.x / width,
              );
              setActiveCard(nextIndex <= 0 ? "student" : "twin");
            }}
          >
            <View
              style={[
                styles.sliderPage,
                sliderWidth ? { width: sliderWidth } : null,
              ]}
            >
              <View style={styles.pageAvatarRow}>
                <View
                  style={[
                    styles.profileSwitchCircle,
                    {
                      backgroundColor: isDark ? "#121C2E" : "#EEF4FF",
                      borderColor: isDark ? "#2E4368" : "#D6E4FF",
                    },
                  ]}
                >
                  {studentPhotoUri ? (
                    <Image
                      source={{ uri: studentPhotoUri }}
                      style={styles.profileSwitchImage}
                    />
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
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? "#F4F7FB" : "#1A202C" },
                  ]}
                >
                  {copy.studentProfile}
                </Text>
              </View>

              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: isDark ? "#22324E" : "#E6EEFF" },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  {copy.fullName}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? "#F4F7FB" : "#1A202C" },
                  ]}
                >
                  {studentProfile.fullName || copy.notSet}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: isDark ? "#22324E" : "#E6EEFF" },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  {copy.grade}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? "#F4F7FB" : "#1A202C" },
                  ]}
                >
                  {copy.grade} {studentProfile.grade}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: isDark ? "#22324E" : "#E6EEFF" },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  {copy.language}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? "#F4F7FB" : "#1A202C" },
                  ]}
                >
                  {studentProfile.preferredLanguage.toUpperCase()}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: isDark ? "#22324E" : "#E6EEFF" },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  {copy.learningLevel}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? "#F4F7FB" : "#1A202C" },
                  ]}
                >
                  {studentProfile.performanceBand === "support"
                    ? copy.needsSupport
                    : studentProfile.performanceBand === "top"
                      ? copy.advanced
                      : copy.onTrack}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.sliderPage,
                sliderWidth ? { width: sliderWidth } : null,
              ]}
            >
              <View style={styles.pageAvatarRow}>
                <View
                  style={[
                    styles.profileSwitchCircle,
                    {
                      backgroundColor: isDark ? "#121C2E" : "#EEF4FF",
                      borderColor: isDark ? "#2E4368" : "#D6E4FF",
                    },
                  ]}
                >
                  {twinPhotoUri ? (
                    <Image
                      source={{ uri: twinPhotoUri }}
                      style={styles.profileSwitchImage}
                    />
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

              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: isDark ? "#22324E" : "#E6EEFF" },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  {copy.twinName}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? "#F4F7FB" : "#1A202C" },
                  ]}
                >
                  {studentProfile.twinName}
                </Text>
              </View>
              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: isDark ? "#22324E" : "#E6EEFF" },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  {copy.supportSubjects}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? "#F4F7FB" : "#1A202C" },
                  ]}
                >
                  {supportSubjects}
                </Text>
              </View>
              <View style={styles.infoRowLast}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  {copy.strongSubjects}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isDark ? "#F4F7FB" : "#1A202C" },
                  ]}
                >
                  {strongSubjects}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.sliderDotsRow}>
            <View
              style={[
                styles.sliderDot,
                { backgroundColor: isDark ? "#345078" : "#C8D8F5" },
                activeCard === "student" && styles.sliderDotActive,
              ]}
            />
            <View
              style={[
                styles.sliderDot,
                { backgroundColor: isDark ? "#345078" : "#C8D8F5" },
                activeCard === "twin" && styles.sliderDotActive,
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            styles.hiddenLegacy,
            {
              backgroundColor: isDark ? "rgba(180,35,45,0.14)" : "#FFF1F2",
              borderColor: isDark ? "rgba(254,202,202,0.34)" : "#FECACA",
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={isDark ? "#FFB4BA" : "#B4232D"}
          />
          <Text
            style={[
              styles.logoutButtonText,
              { color: isDark ? "#FFB4BA" : "#B4232D" },
            ]}
          >
            {copy.logout}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <Pressable
          style={styles.avatarPickerBackdrop}
          onPress={() => setIsEditModalVisible(false)}
        >
          <Pressable
            style={[
              styles.avatarPickerCard,
              {
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#E1E9F8",
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.avatarPickerHeader}>
              <Text
                style={[
                  styles.avatarPickerTitle,
                  { color: isDark ? "#F4F7FB" : "#1A202C" },
                ]}
              >
                {editModalMode === "student"
                  ? copy.editProfileTitle
                  : copy.twinProfile}
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={[
                  styles.avatarPickerClose,
                  { backgroundColor: isDark ? "#121C2E" : "#EEF4FF" },
                ]}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={isDark ? "#F4F7FB" : "#1A202C"}
                />
              </TouchableOpacity>
            </View>

            {editModalMode === "student" ? (
              <>
                <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>
                {copy.fullName}
              </Text>
              <TextInput
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder={copy.fullNamePlaceholder}
                placeholderTextColor={isDark ? "#6F86AC" : "#8FA3C0"}
                style={[
                  styles.formInput,
                  {
                    color: isDark ? "#F4F7FB" : "#1A202C",
                    backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                    borderColor: isDark ? "#2E4368" : "#D6E4FF",
                  },
                ]}
              />
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[
                      styles.formLabel,
                      { color: isDark ? "#AAB7CF" : "#5A6C87" },
                    ]}
                  >
                    {copy.language}
                  </Text>
                  <View style={styles.languageRow}>
                    <TouchableOpacity
                      style={[
                        styles.languageChip,
                        editLanguage === "en" && styles.languageChipActive,
                      ]}
                      onPress={() => setEditLanguage("en")}
                    >
                      <Text
                        style={[
                          styles.languageChipText,
                          editLanguage === "en" && styles.languageChipTextActive,
                        ]}
                      >
                        EN
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.languageChip,
                        editLanguage === "om" && styles.languageChipActive,
                      ]}
                      onPress={() => setEditLanguage("om")}
                    >
                      <Text
                        style={[
                          styles.languageChipText,
                          editLanguage === "om" && styles.languageChipTextActive,
                        ]}
                      >
                        OM
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.imageActionButton}
                  onPress={() => {
                    setIsEditModalVisible(false);
                    void pickPhotoFor("student");
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="image-outline" size={16} color="#0B5FFF" />
                  <Text style={styles.imageActionButtonText}>
                    {copy.changeStudentImage}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text
                    style={[
                      styles.formLabel,
                      { color: isDark ? "#AAB7CF" : "#5A6C87" },
                    ]}
                  >
                    {copy.twinName}
                  </Text>
                  <TextInput
                    value={editTwinName}
                    onChangeText={setEditTwinName}
                    placeholder={copy.twinNamePlaceholder}
                    placeholderTextColor={isDark ? "#6F86AC" : "#8FA3C0"}
                    style={[
                      styles.formInput,
                      {
                        color: isDark ? "#F4F7FB" : "#1A202C",
                        backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                        borderColor: isDark ? "#2E4368" : "#D6E4FF",
                      },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={styles.imageActionButton}
                  onPress={() => {
                    setIsEditModalVisible(false);
                    void pickPhotoFor("twin");
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="image-outline" size={16} color="#0B5FFF" />
                  <Text style={styles.imageActionButtonText}>
                    {copy.changeTwinImage}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.pendingActionRow}>
              <TouchableOpacity
                style={[
                  styles.pendingBackButton,
                  {
                    borderColor: isDark ? "#2E4368" : "#D6E4FF",
                    backgroundColor: isDark ? "#121C2E" : "#F4F8FF",
                  },
                ]}
                onPress={() => setIsEditModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.pendingBackText,
                    { color: isDark ? "#BFD6FF" : "#35507E" },
                  ]}
                >
                  {copy.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pendingUseButton}
                onPress={() => {
                  void handleSaveProfileEdit();
                }}
                activeOpacity={0.85}
                disabled={isSyncing}
              >
                <Text style={styles.pendingUseText}>{copy.save}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
          <Pressable
            style={[
              styles.avatarPickerCard,
              {
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#E1E9F8",
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.avatarPickerHeader}>
              <Text
                style={[
                  styles.avatarPickerTitle,
                  { color: isDark ? "#F4F7FB" : "#1A202C" },
                ]}
              >
                {avatarPickerTarget === "student"
                  ? copy.chooseStudentAvatar
                  : copy.chooseTwinAvatar}
              </Text>
              <TouchableOpacity
                onPress={() => setAvatarPickerVisible(false)}
                style={[
                  styles.avatarPickerClose,
                  { backgroundColor: isDark ? "#121C2E" : "#EEF4FF" },
                ]}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={isDark ? "#F4F7FB" : "#1A202C"}
                />
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
                    style={[
                      styles.avatarGridItem,
                      selected && styles.avatarGridItemSelected,
                    ]}
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
        <Pressable
          style={styles.avatarPickerBackdrop}
          onPress={cancelPendingPhoto}
        >
          <Pressable
            style={[
              styles.avatarPickerCard,
              {
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#E1E9F8",
              },
            ]}
            onPress={() => {}}
          >
            <Text
              style={[
                styles.avatarPickerTitle,
                { color: isDark ? "#F4F7FB" : "#1A202C" },
              ]}
            >
              {copy.useThisPhoto}
            </Text>
            {pendingPhotoUri ? (
              <Image
                source={{ uri: pendingPhotoUri }}
                style={styles.pendingPreviewImage}
              />
            ) : null}
            <View style={styles.pendingActionRow}>
              <TouchableOpacity
                style={[
                  styles.pendingBackButton,
                  {
                    borderColor: isDark ? "#2E4368" : "#D6E4FF",
                    backgroundColor: isDark ? "#121C2E" : "#F4F8FF",
                  },
                ]}
                onPress={cancelPendingPhoto}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.pendingBackText,
                    { color: isDark ? "#BFD6FF" : "#35507E" },
                  ]}
                >
                  {copy.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pendingUseButton,
                  isApplyingPhoto && styles.pendingUseButtonDisabled,
                ]}
                onPress={() => {
                  void applyPendingPhoto();
                }}
                disabled={isApplyingPhoto}
                activeOpacity={0.85}
              >
                <Text style={styles.pendingUseText}>
                  {isApplyingPhoto ? copy.applyingPhoto : copy.usePhoto}
                </Text>
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
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  bgGlowBlue: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -50,
    left: -70,
    backgroundColor: "transparent",
  },
  bgGlowGold: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 999,
    bottom: 120,
    right: -90,
    backgroundColor: "transparent",
  },
  bgGlowSky: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: "42%",
    left: "34%",
    backgroundColor: "transparent",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 12,
    gap: 10,
  },
  profileBadgeCard: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: "#0E234E",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  profileBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileBadgeText: {
    fontSize: 18,
    fontWeight: "800",
  },
  profileHeading: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  identityCard: {
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  identityAvatarTap: {
    alignItems: "center",
    justifyContent: "center",
  },
  identityAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  identityAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
  },
  identityAvatarText: {
    color: "#0B5FFF",
    fontSize: 20,
    fontWeight: "800",
  },
  identityTextWrap: {
    flex: 1,
  },
  identityName: {
    fontSize: 24,
    fontWeight: "800",
  },
  identitySubline: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600",
  },
  inlineEditButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineEditButtonText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  heroTopMeta: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  groupCard: {
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120,140,170,0.22)",
  },
  settingRowLast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  settingIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTextWrap: {
    flex: 1,
    gap: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  subscriptionPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  subscriptionPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  snapshotHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  snapshotMetricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  snapshotMetricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  snapshotMetricLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  snapshotMetricValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  snapshotHintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 2,
  },
  snapshotHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  redeemButton: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#0B5FFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  redeemButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  redeemSuccessPill: {
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(11,95,255,0.08)",
  },
  redeemSuccessText: {
    color: "#1F4E9D",
    fontSize: 12,
    fontWeight: "700",
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120,140,170,0.22)",
  },
  snapshotRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 9,
    paddingBottom: 2,
  },
  snapshotLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  snapshotValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  hiddenLegacy: {
    display: "none",
  },
  heroCard: {
    alignSelf: "stretch",
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 28,
    padding: 16,
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
  editProfileButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editProfileButtonText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "800",
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
    alignSelf: "stretch",
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    padding: 12,
    shadowColor: "#0E234E",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 6,
  },
  logoutButton: {
    alignSelf: "stretch",
    width: "100%",
    marginTop: 0,
    marginBottom: 0,
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
  pendingUseButtonDisabled: {
    opacity: 0.7,
  },
  pendingUseText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  formGroup: {
    gap: 6,
  },
  languageRow: {
    flexDirection: "row",
    gap: 8,
  },
  languageChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F7FAFF",
  },
  languageChipActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  languageChipText: {
    color: "#35507E",
    fontSize: 12,
    fontWeight: "800",
  },
  languageChipTextActive: {
    color: "#FFFFFF",
  },
  imageActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    backgroundColor: "#ECF3FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageActionButtonText: {
    color: "#0B5FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  formLabel: {
    color: "#5A6C87",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
  },
});
