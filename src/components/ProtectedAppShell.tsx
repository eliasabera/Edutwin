import { usePathname } from "expo-router";
import StudentSessionGuard from "./StudentSessionGuard";

const AUTH_ROUTE_PREFIXES = [
  "/(auth)",
  "/login",
  "/register",
  "/setup",
];

/** Routes that must not run StudentSessionGuard (auth + app entry redirect). */
export const isPublicAppRoute = (pathname: string) => {
  const path = pathname || "";

  if (path === "/" || path === "/index") {
    return true;
  }

  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
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
