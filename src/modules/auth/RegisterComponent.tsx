import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  STUDENT_CARTOON_AVATARS,
  TWIN_CARTOON_AVATARS,
} from "../../../shared/constants/avatar-presets";
import { COLORS } from "../../../shared/constants/colors";
import { registerStudent } from "../../../shared/services/auth-service";
import { updateStudentProfile } from "../../../shared/store/user-store";

export default function RegisterComponent() {
  const router = useRouter();

  const isMongoObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value.trim());

  const gradeOptions = ["9", "10", "11", "12"];
  const schoolOptions = [
    { value: "", label: "Select School" },
    { value: "SCH-001", label: "Addis Ababa Secondary School" },
    { value: "SCH-002", label: "Bole Preparatory School" },
    { value: "SCH-003", label: "Kokebe Tsibah School" },
    { value: "SCH-004", label: "Unity High School" },
  ];
  const sectionOptions = [
    { value: "", label: "Select Section" },
    { value: "A", label: "Section A" },
    { value: "B", label: "Section B" },
    { value: "C", label: "Section C" },
    { value: "D", label: "Section D" },
  ];

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [section, setSection] = useState("");
  const [gradeLevel, setGradeLevel] = useState("9");
  const [activeDropdown, setActiveDropdown] = useState<
    "grade" | "school" | "section" | null
  >(null);
  const [language, setLanguage] = useState<"en" | "om">("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentAvatarUri, setStudentAvatarUri] = useState(STUDENT_CARTOON_AVATARS[0]);
  const [twinAvatarUri, setTwinAvatarUri] = useState(TWIN_CARTOON_AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedPhone = phoneNumber.trim();
    const normalizedSchoolId = schoolId.trim();
    const normalizedSection = section.trim();
    const parsedGrade = Number(gradeLevel);

    if (!normalizedName || !normalizedEmail || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage("Full name, email and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Password and confirm password must match.");
      return;
    }

    if (!Number.isFinite(parsedGrade) || parsedGrade < 1) {
      setErrorMessage("Please enter a valid grade level.");
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);
      const response = await registerStudent({
        full_name: normalizedName,
        email: normalizedEmail,
        password,
        language,
        grade_level: parsedGrade,
        phone_number: normalizedPhone || undefined,
        school_id: isMongoObjectId(normalizedSchoolId)
          ? normalizedSchoolId
          : undefined,
        section: normalizedSection || undefined,
      });

      const profile = response.profile;
      updateStudentProfile({
        fullName: profile?.full_name || normalizedName,
        grade: String(profile?.grade_level ?? parsedGrade),
        preferredLanguage: (profile?.language === "om" ? "om" : "en") as
          | "en"
          | "om",
        twinName: `EduTwin Grade ${String(profile?.grade_level ?? parsedGrade)}`,
        studentPhotoUri: studentAvatarUri,
        twinPhotoUri: twinAvatarUri,
      });

      router.replace("/(auth)/setup" as never);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to register right now.";
      setErrorMessage(message);
      Alert.alert("Registration failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join EduTwin and start learning smarter.</Text>
      </View>

      <View style={styles.form}>
        {/* Full Name */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={20}
            color={COLORS.textLight}
            style={styles.icon}
          />
          <TextInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
        </View>

        <View>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() =>
              setActiveDropdown((prev) => (prev === "grade" ? null : "grade"))
            }
          >
            <Ionicons
              name="school-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.icon}
            />
            <Text style={styles.dropdownTriggerText}>Grade {gradeLevel}</Text>
            <Ionicons
              name={activeDropdown === "grade" ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          {activeDropdown === "grade" && (
            <View style={styles.dropdownList}>
              {gradeOptions.map((grade) => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.dropdownItem,
                    gradeLevel === grade && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setGradeLevel(grade);
                    setActiveDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      gradeLevel === grade && styles.dropdownItemTextActive,
                    ]}
                  >
                    Grade {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="call-outline"
            size={20}
            color={COLORS.textLight}
            style={styles.icon}
          />
          <TextInput
            placeholder="Phone Number (optional)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <View>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() =>
              setActiveDropdown((prev) => (prev === "school" ? null : "school"))
            }
          >
            <Ionicons
              name="business-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.icon}
            />
            <Text
              style={[
                styles.dropdownTriggerText,
                !schoolId && styles.dropdownPlaceholderText,
              ]}
            >
              {schoolOptions.find((item) => item.value === schoolId)?.label ||
                "Select School"}
            </Text>
            <Ionicons
              name={activeDropdown === "school" ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          {activeDropdown === "school" && (
            <View style={styles.dropdownList}>
              {schoolOptions.map((school) => (
                <TouchableOpacity
                  key={school.label}
                  style={[
                    styles.dropdownItem,
                    schoolId === school.value && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSchoolId(school.value);
                    setActiveDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      schoolId === school.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {school.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() =>
              setActiveDropdown((prev) => (prev === "section" ? null : "section"))
            }
          >
            <Ionicons
              name="layers-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.icon}
            />
            <Text
              style={[
                styles.dropdownTriggerText,
                !section && styles.dropdownPlaceholderText,
              ]}
            >
              {section ? `Section ${section}` : "Select Section"}
            </Text>
            <Ionicons
              name={activeDropdown === "section" ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          {activeDropdown === "section" && (
            <View style={styles.dropdownList}>
              {sectionOptions.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.dropdownItem,
                    section === item.value && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSection(item.value);
                    setActiveDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      section === item.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[styles.languageChip, language === "en" && styles.languageChipActive]}
            onPress={() => setLanguage("en")}
          >
            <Text
              style={[
                styles.languageChipText,
                language === "en" && styles.languageChipTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageChip, language === "om" && styles.languageChipActive]}
            onPress={() => setLanguage("om")}
          >
            <Text
              style={[
                styles.languageChipText,
                language === "om" && styles.languageChipTextActive,
              ]}
            >
              Afaan Oromoo
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <Text style={styles.avatarSectionTitle}>Student Avatar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarRow}
          >
            {STUDENT_CARTOON_AVATARS.map((uri) => {
              const selected = studentAvatarUri === uri;
              return (
                <TouchableOpacity
                  key={uri}
                  onPress={() => setStudentAvatarUri(uri)}
                  style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
                >
                  <Image source={{ uri }} style={styles.avatarOptionImage} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.avatarSection}>
          <Text style={styles.avatarSectionTitle}>EduTwin Avatar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarRow}
          >
            {TWIN_CARTOON_AVATARS.map((uri) => {
              const selected = twinAvatarUri === uri;
              return (
                <TouchableOpacity
                  key={uri}
                  onPress={() => setTwinAvatarUri(uri)}
                  style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
                >
                  <Image source={{ uri }} style={styles.avatarOptionImage} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={COLORS.textLight}
            style={styles.icon}
          />
          <TextInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={COLORS.textLight}
            style={styles.icon}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={COLORS.textLight}
            style={styles.icon}
          />
          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <TouchableOpacity
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>{isLoading ? "Creating..." : "Sign Up"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Log In</Text>
          </TouchableOpacity>
        </Link>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    justifyContent: "center",
  },
  header: { marginBottom: 30 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: COLORS.textLight },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  dropdownPlaceholderText: {
    color: COLORS.textLight,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9E0ED",
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
  },
  dropdownItemActive: {
    backgroundColor: "#EAF2FF",
  },
  dropdownItemText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  languageRow: {
    flexDirection: "row",
    gap: 10,
  },
  languageChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6DDEA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  languageChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#EAF2FF",
  },
  languageChipText: {
    color: COLORS.textLight,
    fontWeight: "600",
  },
  languageChipTextActive: {
    color: COLORS.primary,
  },
  avatarSection: {
    marginTop: -2,
  },
  avatarSectionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  avatarRow: {
    gap: 10,
    paddingVertical: 2,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#D6E4FF",
    backgroundColor: "#EEF4FF",
    overflow: "hidden",
  },
  avatarOptionSelected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "white", fontSize: 18, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { color: COLORS.textLight, fontSize: 16 },
  link: { color: COLORS.primary, fontSize: 16, fontWeight: "bold" },
});
