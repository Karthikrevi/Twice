import { Redirect } from "expo-router";
import { useSession } from "@/store/session";

export default function Index() {
  const restaurant = useSession((s) => s.restaurant);
  const user = useSession((s) => s.user);

  if (!restaurant?.setupComplete) return <Redirect href="/onboarding" />;
  if (!user) return <Redirect href="/login" />;
  if (user.role === "kitchen") return <Redirect href="/kitchen" />;
  return <Redirect href="/(tabs)/orders" />;
}
