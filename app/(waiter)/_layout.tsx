import { Redirect } from "expo-router";
import { useSession } from "@/store/session";
import { TabsLayout } from "@/components/nav/TabsLayout";
import { useSocketSync } from "@/hooks/useSocketSync";

export default function WaiterDashboard() {
  const role = useSession((s) => s.user?.role);
  useSocketSync();
  if (!role) return <Redirect href="/login" />;
  if (role !== "waiter") return <Redirect href="/" />;
  return (
    <TabsLayout
      tabs={[
        { name: "tables", title: "Tables", glyph: "▦" },
        { name: "orders", title: "Orders", glyph: "◧" },
      ]}
    />
  );
}
