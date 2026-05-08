import type { ReactNode } from "react";
import { useSession } from "@/store/session";
import type { Role } from "@/types";

interface Props {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: Props) {
  const has = useSession((s) => s.hasRole(...roles));
  if (!has) return <>{fallback}</>;
  return <>{children}</>;
}
