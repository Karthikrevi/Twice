import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { useSession } from "@/store/session";
import { colors, platformLabel } from "@/theme/colors";

const platformsConnected = [
  { key: "talabat" as const, status: "connected" as const, last: "synced 2m ago" },
  { key: "deliveroo" as const, status: "connected" as const, last: "synced 5m ago" },
  { key: "instashop" as const, status: "issue" as const, last: "auth expired" },
];

export default function Settings() {
  const restaurant = useSession((s) => s.restaurant);
  const signOut = useSession((s) => s.signOut);

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <Screen title="Settings" subtitle={restaurant?.name ?? "Restaurant settings"}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Card>
          <Text className="text-text-secondary text-[11px] uppercase tracking-wider font-semibold">Restaurant</Text>
          <Text className="text-text-primary text-[18px] font-bold mt-1.5">{restaurant?.name}</Text>
          <Text className="text-text-secondary text-[13px] mt-0.5">{restaurant?.location}</Text>
          <View className="flex-row mt-4 gap-2">
            <Stat label="Tables" value={String(restaurant?.tableCount ?? 0)} />
            <Stat label="Kitchen" value={restaurant?.kitchenOutput ?? "screen"} />
          </View>
        </Card>

        <Section title="Platform connections" />
        <Card padded={false}>
          {platformsConnected.map((p, i) => {
            const ok = p.status === "connected";
            return (
              <View
                key={p.key}
                className={`flex-row items-center px-4 py-3.5 ${i < platformsConnected.length - 1 ? "border-b border-border" : ""}`}
              >
                <View
                  className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: colors.platform[p.key] + "33" }}
                >
                  <Text style={{ color: colors.platform[p.key] }} className="font-bold">
                    {platformLabel[p.key][0]}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold text-[14px]">{platformLabel[p.key]}</Text>
                  <Text style={{ color: ok ? colors.status.available : colors.status.urgent }} className="text-[11px] mt-0.5">
                    {p.last}
                  </Text>
                </View>
                <TouchableOpacity
                  className={`px-3 rounded-lg ${ok ? "bg-surfaceActive border border-border" : "bg-amber"}`}
                  style={{ height: 36, justifyContent: "center" }}
                >
                  <Text className={`font-semibold text-[12px] ${ok ? "text-text-primary" : "text-black"}`}>
                    {ok ? "Manage" : "Reconnect"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </Card>

        <Section title="Staff" />
        <Card padded={false}>
          <Row label="Manage staff accounts" hint="Add, edit, change roles, reset passwords" />
          <Row label="Invitations" hint="3 pending invites" divider={false} />
        </Card>

        <Section title="Operations" />
        <Card padded={false}>
          <Row label="Kitchen output mode" hint={restaurant?.kitchenOutput === "printer" ? "Thermal printer" : "Kitchen screen"} />
          <Row label="Table count" hint={`${restaurant?.tableCount ?? 0} tables`} />
          <Row label="Commission rates" hint="Per platform" divider={false} />
        </Card>

        <Section title="Security" />
        <Card padded={false}>
          <Row label="Audit log" hint="View sensitive actions" />
          <Row label="Re-run setup wizard" hint="Owner only" divider={false} />
        </Card>

        <View className="mt-6">
          <TouchableOpacity
            onPress={logout}
            className="bg-surface border border-status-urgent/40 rounded-xl items-center justify-center"
            style={{ height: 52 }}
          >
            <Text className="text-status-urgent font-semibold">Sign out</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-text-muted text-[11px] text-center mt-4">Once · v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

function Section({ title }: { title: string }) {
  return (
    <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mt-6 mb-3">
      {title}
    </Text>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-surfaceActive rounded-xl px-3 py-2.5">
      <Text className="text-text-muted text-[10px] uppercase tracking-wider">{label}</Text>
      <Text className="text-text-primary text-[15px] font-bold mt-0.5 capitalize">{value}</Text>
    </View>
  );
}

function Row({ label, hint, divider = true }: { label: string; hint?: string; divider?: boolean }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`px-4 py-3.5 flex-row items-center ${divider ? "border-b border-border" : ""}`}
    >
      <View className="flex-1">
        <Text className="text-text-primary font-semibold text-[14px]">{label}</Text>
        {hint ? <Text className="text-text-muted text-[12px] mt-0.5">{hint}</Text> : null}
      </View>
      <Text className="text-text-muted text-[18px]">›</Text>
    </TouchableOpacity>
  );
}
