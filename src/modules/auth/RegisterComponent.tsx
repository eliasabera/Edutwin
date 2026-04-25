import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TWIN_CARTOON_AVATARS,
} from "../../../shared/constants/avatar-presets";
import {
  registerStudent,
  saveStudentProfile,
  uploadStudentPhoto,
} from "../../../shared/services/auth-service";
import { updateStudentProfile } from "../../../shared/store/user-store";

const AUTH_COLORS = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  text: "#102445",
  textLight: "#6D84AA",
  primary: "#0056D2",
  error: "#DC3545",
};

const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_TWIN_AVATAR_URI = TWIN_CARTOON_AVATARS[0];

type AppLanguage = "en" | "om";

const COPY: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    fullNamePlaceholder: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    selectSchool: string;
    selectSection: string;
    withSchool: string;
    withoutSchool: string;
    schoolInfoHint: string;
    noSchoolInfoHint: string;
    sectionLabel: (section: string) => string;
    gradeLabel: (grade: string) => string;
    english: string;
    afaanOromoo: string;
    profilePhoto: string;
    profilePhotoHint: string;
    chooseProfilePhoto: string;
    changeProfilePhoto: string;
    uploadingPhoto: string;
    requiredFields: string;
    invalidEmail: string;
    passwordTooShort: string;
    passwordMismatch: string;
    invalidGrade: string;
    invalidSchool: string;
    mediaPermission: string;
    couldNotPickImage: string;
    unableToRegister: string;
    registrationFailed: string;
    creating: string;
    alreadyHaveAccount: string;
    logIn: string;
    signUp: string;
    showPassword: string;
    hidePassword: string;
  }
> = {
  en: {
    title: "Create Account",
    subtitle: "Join EduTwin and start learning smarter.",
    fullNamePlaceholder: "Full Name",
    phonePlaceholder: "Phone Number (optional)",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Confirm Password",
    selectSchool: "Select School",
    selectSection: "Select Section",
    withSchool: "I have a school",
    withoutSchool: "I don't have a school",
    schoolInfoHint: "Select this if you are enrolled in a school.",
    noSchoolInfoHint: "Select this if you are studying independently.",
    sectionLabel: (section: string) => `Section ${section}`,
    gradeLabel: (grade: string) => `Grade ${grade}`,
    english: "English",
    afaanOromoo: "Afaan Oromoo",
    profilePhoto: "Profile Photo",
    profilePhotoHint: "Upload your photo from gallery.",
    chooseProfilePhoto: "Choose Photo",
    changeProfilePhoto: "Change Photo",
    uploadingPhoto: "Uploading photo...",
    requiredFields: "Full name, email and password are required.",
    invalidEmail: "Please enter a valid email address.",
    passwordTooShort: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    passwordMismatch: "Password and confirm password must match.",
    invalidGrade: "Please enter a valid grade level.",
    invalidSchool: "Please select your school.",
    mediaPermission: "Media permission is required to set a profile photo.",
    couldNotPickImage: "Could not open image library right now.",
    unableToRegister: "Unable to register right now.",
    registrationFailed: "Registration failed",
    creating: "Creating...",
    alreadyHaveAccount: "Already have an account?",
    logIn: "Log In",
    signUp: "Sign Up",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  om: {
    title: "Akaawuntii Uumi",
    subtitle: "EduTwinitti makamiitii haala salphaan baradhu.",
    fullNamePlaceholder: "Maqaa Guutuu",
    phonePlaceholder: "Lakkoofsa Bilbilaa (filannoo)",
    emailPlaceholder: "Teessoo Imeelii",
    passwordPlaceholder: "Jecha Darbii",
    confirmPasswordPlaceholder: "Jecha Darbii Mirkaneessi",
    selectSchool: "Mana Barumsaa Fili",
    selectSection: "Kutaa Fili",
    withSchool: "Mana barumsaa qaba",
    withoutSchool: "Mana barumsaa hin qabu",
    schoolInfoHint: "Yoo mana barumsaa keessatti barachaa jirta ta'e kana fili.",
    noSchoolInfoHint: "Yoo ofiin barataa jirta ta'e kana fili.",
    sectionLabel: (section: string) => `Kutaa ${section}`,
    gradeLabel: (grade: string) => `Kutaa ${grade}`,
    english: "English",
    afaanOromoo: "Afaan Oromoo",
    profilePhoto: "Suuraa Profaayilii",
    profilePhotoHint: "Suuraa kee galmee irraa olkaa'i.",
    chooseProfilePhoto: "Suuraa Fili",
    changeProfilePhoto: "Suuraa Jijjiiri",
    uploadingPhoto: "Suuraa olkaa'aa jira...",
    requiredFields: "Maqaan guutuun, imeeliin fi jechi darbii dirqama.",
    invalidEmail: "Maaloo teessoo imeelii sirrii galchi.",
    passwordTooShort: `Jechi darbii qubee ${MIN_PASSWORD_LENGTH} ol ta'uu qaba.`,
    passwordMismatch: "Jechi darbii fi mirkaneessi wal hin siman.",
    invalidGrade: "Maaloo kutaa sirrii galchi.",
    invalidSchool: "Maaloo mana barumsaa kee fili.",
    mediaPermission: "Suuraa profaayilii filachuuf hayyama mediaa barbaachisa.",
    couldNotPickImage: "Yeroo amma kana galmee suuraa banuu hin dandeenye.",
    unableToRegister: "Yeroo amma kana galmaa'uu hin dandeenye.",
    registrationFailed: "Galmeen hin milkoofne",
    creating: "Uumaa jira...",
    alreadyHaveAccount: "Dursee akaawuntii qabdaa?",
    logIn: "Seeni",
    signUp: "Galmaa'i",
    showPassword: "Jecha darbii agarsiisi",
    hidePassword: "Jecha darbii dhoksi",
  },
};

export default function RegisterComponent() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [language, setLanguage] = useState<AppLanguage>("en");

  const copy = COPY[language];

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const gradeOptions = ["9", "10", "11", "12"];
  const schoolOptions = [
    { value: "", label: copy.selectSchool },
    { value: "SCH-001", label: "Addis Ababa Secondary School" },
    { value: "SCH-002", label: "Bole Preparatory School" },
    { value: "SCH-003", label: "Kokebe Tsibah School" },
    { value: "SCH-004", label: "Unity High School" },
  ];
  const sectionOptions = [
    { value: "", label: copy.selectSection },
    { value: "A", label: copy.sectionLabel("A") },
    { value: "B", label: copy.sectionLabel("B") },
    { value: "C", label: copy.sectionLabel("C") },
    { value: "D", label: copy.sectionLabel("D") },
  ];

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasSchool, setHasSchool] = useState(true);
  const [schoolId, setSchoolId] = useState("");
  const [section, setSection] = useState("");
  const [gradeLevel, setGradeLevel] = useState("9");
  const [activeDropdown, setActiveDropdown] = useState<
    "grade" | "school" | "section" | null
  >(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [studentPhotoUri, setStudentPhotoUri] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onKeyboardShow = (event: { endCoordinates: { height: number } }) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    };

    const onKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const scrollToBottomFields = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const pickStudentPhoto = async () => {
    try {
      setErrorMessage("");
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage(copy.mediaPermission);
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

      setStudentPhotoUri(uri);
    } catch {
      setErrorMessage(copy.couldNotPickImage);
    }
  };

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedPhone = phoneNumber.trim();
    const normalizedSchoolId = schoolId.trim();
    const normalizedSection = section.trim();
    const resolvedSchoolId = hasSchool ? normalizedSchoolId : "";
    const resolvedSection = hasSchool ? normalizedSection : "";
    const parsedGrade = Number(gradeLevel);

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setErrorMessage(copy.requiredFields);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage(copy.invalidEmail);
      return;
    }

    if (password.trim().length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(copy.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(copy.passwordMismatch);
      return;
    }

    if (!Number.isFinite(parsedGrade) || parsedGrade < 1) {
      setErrorMessage(copy.invalidGrade);
      return;
    }

    if (hasSchool && !resolvedSchoolId) {
      setErrorMessage(copy.invalidSchool);
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
        school_id: resolvedSchoolId || undefined,
        section: resolvedSection || undefined,
      });

      let remoteStudentPhotoUri = "";
      if (studentPhotoUri.trim()) {
        try {
          const uploaded = await uploadStudentPhoto(studentPhotoUri.trim());
          remoteStudentPhotoUri = uploaded.student_photo_url;
        } catch (photoUploadError) {
          throw new Error(
            photoUploadError instanceof Error
              ? photoUploadError.message
              : copy.uploadingPhoto,
          );
        }
      }

      const profile = response.profile;
      const resolvedGrade = String(profile?.grade_level ?? parsedGrade);
      const resolvedLanguage = (profile?.language === "om" ? "om" : "en") as
        | "en"
        | "om";

      updateStudentProfile({
        fullName: profile?.full_name || normalizedName,
        grade: resolvedGrade,
        preferredLanguage: resolvedLanguage,
        twinName: `EduTwin Grade ${resolvedGrade}`,
        studentPhotoUri: remoteStudentPhotoUri,
        twinPhotoUri: DEFAULT_TWIN_AVATAR_URI,
      });

      await saveStudentProfile({
        fullName: profile?.full_name || normalizedName,
        grade: resolvedGrade,
        preferredLanguage: resolvedLanguage,
        twinName: `EduTwin Grade ${resolvedGrade}`,
        studentPhotoUri: remoteStudentPhotoUri,
        twinPhotoUri: DEFAULT_TWIN_AVATAR_URI,
      });

      router.replace("/(auth)/setup" as never);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.unableToRegister;
      setErrorMessage(message);
      Alert.alert(copy.registrationFailed, message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentInset={{ bottom: keyboardHeight }}
            scrollIndicatorInsets={{ bottom: keyboardHeight }}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
            </View>

            <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color={AUTH_COLORS.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.fullNamePlaceholder}
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
                color={AUTH_COLORS.textLight}
                style={styles.icon}
              />
              <Text style={styles.dropdownTriggerText}>
                {copy.gradeLabel(gradeLevel)}
              </Text>
              <Ionicons
                name={
                  activeDropdown === "grade" ? "chevron-up" : "chevron-down"
                }
                size={18}
                color={AUTH_COLORS.textLight}
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
                      {copy.gradeLabel(grade)}
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
              color={AUTH_COLORS.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.phonePlaceholder}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View>
            <View style={styles.schoolTypeRow}>
              <TouchableOpacity
                style={[
                  styles.schoolTypeChip,
                  hasSchool && styles.schoolTypeChipActive,
                ]}
                onPress={() => setHasSchool(true)}
              >
                <Text
                  style={[
                    styles.schoolTypeChipText,
                    hasSchool && styles.schoolTypeChipTextActive,
                  ]}
                >
                  {copy.withSchool}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.schoolTypeChip,
                  !hasSchool && styles.schoolTypeChipActive,
                ]}
                onPress={() => {
                  setHasSchool(false);
                  setSchoolId("");
                  setSection("");
                  setActiveDropdown((prev) =>
                    prev === "school" || prev === "section" ? null : prev,
                  );
                }}
              >
                <Text
                  style={[
                    styles.schoolTypeChipText,
                    !hasSchool && styles.schoolTypeChipTextActive,
                  ]}
                >
                  {copy.withoutSchool}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.schoolTypeHint}>
              {hasSchool ? copy.schoolInfoHint : copy.noSchoolInfoHint}
            </Text>
          </View>

          {hasSchool && (
            <View>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() =>
                  setActiveDropdown((prev) =>
                    prev === "school" ? null : "school",
                  )
                }
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={AUTH_COLORS.textLight}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.dropdownTriggerText,
                    !schoolId && styles.dropdownPlaceholderText,
                  ]}
                >
                  {schoolOptions.find((item) => item.value === schoolId)
                    ?.label || copy.selectSchool}
                </Text>
                <Ionicons
                  name={
                    activeDropdown === "school" ? "chevron-up" : "chevron-down"
                  }
                  size={18}
                  color={AUTH_COLORS.textLight}
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
                          schoolId === school.value &&
                            styles.dropdownItemTextActive,
                        ]}
                      >
                        {school.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {hasSchool && (
            <View>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() =>
                  setActiveDropdown((prev) =>
                    prev === "section" ? null : "section",
                  )
                }
              >
                <Ionicons
                  name="layers-outline"
                  size={20}
                  color={AUTH_COLORS.textLight}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.dropdownTriggerText,
                    !section && styles.dropdownPlaceholderText,
                  ]}
                >
                  {section ? copy.sectionLabel(section) : copy.selectSection}
                </Text>
                <Ionicons
                  name={
                    activeDropdown === "section" ? "chevron-up" : "chevron-down"
                  }
                  size={18}
                  color={AUTH_COLORS.textLight}
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
          )}

          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[
                styles.languageChip,
                language === "en" && styles.languageChipActive,
              ]}
              onPress={() => setLanguage("en")}
            >
              <Text
                style={[
                  styles.languageChipText,
                  language === "en" && styles.languageChipTextActive,
                ]}
              >
                {copy.english}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageChip,
                language === "om" && styles.languageChipActive,
              ]}
              onPress={() => setLanguage("om")}
            >
              <Text
                style={[
                  styles.languageChipText,
                  language === "om" && styles.languageChipTextActive,
                ]}
              >
                {copy.afaanOromoo}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarSection}>
            <Text style={styles.avatarSectionTitle}>{copy.profilePhoto}</Text>
            <Text style={styles.avatarSectionHint}>{copy.profilePhotoHint}</Text>
            <View style={styles.photoPickerRow}>
              <View style={styles.photoPreview}>
                {studentPhotoUri ? (
                  <Image
                    source={{ uri: studentPhotoUri }}
                    style={styles.photoPreviewImage}
                  />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={48}
                    color={AUTH_COLORS.textLight}
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.photoPickerButton}
                onPress={pickStudentPhoto}
              >
                <Text style={styles.photoPickerButtonText}>
                  {studentPhotoUri
                    ? copy.changeProfilePhoto
                    : copy.chooseProfilePhoto}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={AUTH_COLORS.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.emailPlaceholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={scrollToBottomFields}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={AUTH_COLORS.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={scrollToBottomFields}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.visibilityToggle}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? copy.hidePassword : copy.showPassword
              }
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={AUTH_COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={AUTH_COLORS.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              onFocus={scrollToBottomFields}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              style={styles.visibilityToggle}
              accessibilityRole="button"
              accessibilityLabel={
                showConfirmPassword ? copy.hidePassword : copy.showPassword
              }
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={AUTH_COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {!!errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <TouchableOpacity
            style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.btnText}>
              {isLoading ? copy.creating : copy.signUp}
            </Text>
          </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{copy.alreadyHaveAccount}</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>{copy.logIn}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.surface,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: AUTH_COLORS.surface,
    padding: 24,
    paddingBottom: 40,
  },
  header: { marginBottom: 30 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: AUTH_COLORS.primary,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: AUTH_COLORS.textLight },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_COLORS.background,
    borderWidth: 1,
    borderColor: "#D6DDEA",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_COLORS.background,
    borderWidth: 1,
    borderColor: "#D6DDEA",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 16,
    color: AUTH_COLORS.text,
  },
  dropdownPlaceholderText: {
    color: AUTH_COLORS.textLight,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9E0ED",
    backgroundColor: AUTH_COLORS.surface,
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
    color: AUTH_COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: AUTH_COLORS.primary,
    fontWeight: "700",
  },
  languageRow: {
    flexDirection: "row",
    gap: 10,
  },
  schoolTypeRow: {
    flexDirection: "row",
    gap: 10,
  },
  schoolTypeChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6DDEA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_COLORS.surface,
    paddingHorizontal: 12,
  },
  schoolTypeChipActive: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: "#EAF2FF",
  },
  schoolTypeChipText: {
    color: AUTH_COLORS.textLight,
    fontWeight: "600",
    textAlign: "center",
  },
  schoolTypeChipTextActive: {
    color: AUTH_COLORS.primary,
  },
  schoolTypeHint: {
    color: AUTH_COLORS.textLight,
    fontSize: 12,
    marginTop: 6,
  },
  languageChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6DDEA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AUTH_COLORS.surface,
  },
  languageChipActive: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: "#EAF2FF",
  },
  languageChipText: {
    color: AUTH_COLORS.textLight,
    fontWeight: "600",
  },
  languageChipTextActive: {
    color: AUTH_COLORS.primary,
  },
  avatarSection: {
    marginTop: -2,
  },
  avatarSectionTitle: {
    color: AUTH_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  avatarSectionHint: {
    color: AUTH_COLORS.textLight,
    fontSize: 13,
    marginBottom: 8,
  },
  photoPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#D6DDEA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F8FC",
    overflow: "hidden",
  },
  photoPreviewImage: {
    width: "100%",
    height: "100%",
  },
  photoPickerButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AUTH_COLORS.primary,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
  },
  photoPickerButtonText: {
    color: AUTH_COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: AUTH_COLORS.text },
  visibilityToggle: {
    marginLeft: 10,
    padding: 2,
  },
  errorText: {
    color: AUTH_COLORS.error,
    fontSize: 13,
  },
  btnPrimary: {
    backgroundColor: AUTH_COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: AUTH_COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "white", fontSize: 18, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { color: AUTH_COLORS.textLight, fontSize: 16 },
  link: { color: AUTH_COLORS.primary, fontSize: 16, fontWeight: "bold" },
});
