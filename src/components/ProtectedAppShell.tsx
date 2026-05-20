import { usePathname } from "expo-router";
import StudentSessionGuard from "./StudentSessionGuard";

const PUBLIC_ROUTE_PREFIXES = ["/(auth)"];

export const isPublicAppRoute = (pathname: string) => {
  if (!pathname || pathname === "/" || pathname === "/index") {
    return true;
  }

  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

type ProtectedAppShellProps = {
  children: React.ReactNode;
};

/** Keeps one stable wrapper so navigation does not remount the whole app tree. */
export default function ProtectedAppShell({ children }: ProtectedAppShellProps) {
  const pathname = usePathname();
  const isPublicRoute = isPublicAppRoute(pathname);

  return (
    <StudentSessionGuard isPublicRoute={isPublicRoute}>
      {children}
    </StudentSessionGuard>
  );
}
