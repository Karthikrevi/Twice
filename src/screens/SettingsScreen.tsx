import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { ListSkeleton, ErrorState } from "@/components/ui/States";
import { useSession } from "@/store/session";
import { logout } from "@/hooks/useAuth";
import { usePlatforms } from "@/hooks/usePlatforms";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";

export function SettingsScreen() {
  const user = useSession((s) => s.user);
  const { data: platforms, isLoading, isError, refetch } = usePlatforms();

  return (
    <Screen title="Settings" subtitle={user?.email ?? ""}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Card>
          <Text className="text-text-secondary text-[11px] uppercase tracking-wider font-semibold">Account</Text>
          <Text className="text-text-primary text-[18px] font-bold mt-1.5">{user?.name}</Text>
          <Text className="text-text-secondary text-[13px] mt-0.5 capitalize">{user?.role}</Text>
        </Card>

        <Section title="Platform connections" />
        {isLoading ? (
          <ListSkeleton count={2} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <Card padded={false}>
            {(platforms ?? []).map((p, i, arr) => {
              const ok = p.status === "connected";
              const key = p.platform as PlatformKey;
              return (
                <View
                  key={p.platform}
                  className={`flex-row items-center px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-border" : ""}`}
                >
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: colors.platform[key] + "33" }}
                  >
                    <Text style={{ color: colors.platform[key] }} className="font-bold">
                      {platformLabel[key][0]}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-semibold text-[14px]">{platformLabel[key]}</Text>
                    <Text
                      style={{ color: ok ? colors.status.available : colors.status.urgent }}
                      className="text-[11px] mt-0.5 capitalize"
                    >
                      {p.status}
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
            {platforms && platforms.length === 0 ? (
              <View className="px-4 py-5">
                <Text className="text-text-muted text-[13px]">No platforms connected yet.</Text>
              </View>
            ) : null}
          </Card>
        )}

        <Section title="Staff" />
        <Card padded={false}>
          <Row label="Manage staff accounts" hint="Add, edit, change roles, reset passwords" />
          <Row label="Invitations" hint="Pending invites" divider={false} />
        </Card>

        <Section title="Operations" />
        <Card padded={false}>
          <Row label="Kitchen output mode" hint="Screen or printer" />
          <Row label="Table count" hint="Adjust table layout" />
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
