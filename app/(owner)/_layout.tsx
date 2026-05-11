import { Redirect } from "expo-router";
import { useSession } from "@/store/session";
import { TabsLayout } from "@/components/nav/TabsLayout";
import { useSocketSync } from "@/hooks/useSocketSync";

export default function OwnerDashboard() {
  const role = useSession((s) => s.user?.role);
  useSocketSync();
  if (!role) return <Redirect href="/login" />;
  if (role !== "owner") return <Redirect href="/" />;
  return (
    <TabsLayout
      tabs={[
        { name: "orders", title: "Orders", glyph: "◧" },
        { name: "tables", title: "Tables", glyph: "▦" },
        { name: "inventory", title: "Stock", glyph: "▤" },
        { name: "menu", title: "Menu", glyph: "≡" },
        { name: "reports", title: "Reports", glyph: "◔" },
        { name: "settings", title: "Settings", glyph: "⚙" },
      ]}
    />
  );
}
