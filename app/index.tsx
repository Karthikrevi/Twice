import { Redirect } from "expo-router";
import { useSession } from "@/store/session";

export default function Index() {
  const user = useSession((s) => s.user);
  const setupDone = useSession((s) => s.setupDone);

  if (!setupDone) return <Redirect href="/onboarding" />;
  if (!user) return <Redirect href="/login" />;

  switch (user.role) {
    case "owner":
      return <Redirect href={"/(owner)/" as any} />;
    case "manager":
      return <Redirect href={"/(manager)/" as any} />;
    case "waiter":
      return <Redirect href={"/(waiter)/" as any} />;
    case "kitchen":
      return <Redirect href={"/(kitchen)" as any} />;
  }
}
