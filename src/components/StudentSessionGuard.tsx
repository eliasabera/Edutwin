import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  getCurrentUser,
  hasStudentSessionEstablished,
  isStudentRole,
  markStudentSessionEstablished,
  resolveCurrentUser,
} from "@/shared/services/auth-service";
import { supabase } from "@/shared/services/supabase-client";

type StudentSessionGuardProps = {
  children: React.ReactNode;
  isPublicRoute?: boolean;
};

const canAccessStudentShell = () => {
  if (hasStudentSessionEstablished()) {
    return true;
  }

  const cached = getCurrentUser();
  return Boolean(cached && isStudentRole(cached.role));
};

const hasSupabaseSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return !error && Boolean(data.session?.user);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function StudentSessionGuard({
  children,
  isPublicRoute = false,
}: StudentSessionGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(
    () => isPublicRoute || canAccessStudentShell(),
  );

  useEffect(() => {
    if (isPublicRoute) {
      setAllowed(true);
      return;
    }

    if (hasStudentSessionEstablished()) {
      setAllowed(true);
      return;
    }

    const cached = getCurrentUser();
    if (cached && isStudentRole(cached.role)) {
      markStudentSessionEstablished();
      setAllowed(true);
      return;
    }

    let mounted = true;

    const verify = async () => {
      if (await hasSupabaseSession()) {
        const user = await resolveCurrentUser();
        if (!mounted) {
          return;
        }
        if (user && isStudentRole(user.role)) {
          markStudentSessionEstablished();
          setAllowed(true);
          return;
        }
      }

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const user = await resolveCurrentUser();
        if (!mounted) {
          return;
        }

        if (user && isStudentRole(user.role)) {
          markStudentSessionEstablished();
          setAllowed(true);
          return;
        }

        if (attempt < 2) {
          await wait(250 * (attempt + 1));
        }
      }

      const cachedAfter = getCurrentUser();
      if (cachedAfter && isStudentRole(cachedAfter.role)) {
        markStudentSessionEstablished();
        if (mounted) {
          setAllowed(true);
        }
        return;
      }

      if (await hasSupabaseSession()) {
        markStudentSessionEstablished();
        if (mounted) {
          setAllowed(true);
        }
        void resolveCurrentUser();
        return;
      }

      if (mounted) {
        setAllowed(false);
        router.replace("/(auth)/login");
      }
    };

    void verify();

    return () => {
      mounted = false;
    };
  }, [isPublicRoute]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!allowed) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0B5FFF" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
