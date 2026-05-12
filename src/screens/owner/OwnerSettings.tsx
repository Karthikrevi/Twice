import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useSession } from "@/store/session";
import { useStaff } from "@/hooks/useStaff";
import { logout } from "@/hooks/useAuth";

const BG = "#0D0F14";
const SURFACE = "#161920";
const SURFACE_ACTIVE = "#1E2128";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const URGENT = "#EF4444";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface NotificationsState {
  newOrders: boolean;
  lowStock: boolean;
  platformIssues: boolean;
  settlementReceived: boolean;
}

export function OwnerSettings() {
  const restaurantName = useSession((s) => s.restaurantName);
  const user = useSession((s) => s.user);
  const staff = useStaff();

  // TODO: server doesn't yet expose location / table count / kitchen
  // output on /auth/me; these come from local onboarding state when
  // available and otherwise show "—".
  const location = "—";
  const tableCount = 8;
  const [kitchenOutput, setKitchenOutput] = useState<"Screen" | "Printer">("Screen");

  const [notifications, setNotifications] = useState<NotificationsState>({
    newOrders: true,
    lowStock: true,
    platformIssues: true,
    settlementReceived: true,
  });

  const staffCount = staff.data?.length ?? 0;
  const pendingInvites = 0; // TODO: hook into /staff/invites when endpoint exists

  const soon = (label: string) => () => Alert.alert(`${label} coming soon.`);

  const onResetSetup = () =>
    Alert.alert(
      "Reset setup wizard?",
      "This will not delete your data.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => undefined },
      ],
      { cancelable: true }
    );

  const onDeleteAccount = () =>
    Alert.alert(
      "Delete restaurant account?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => undefined },
      ],
      { cancelable: true }
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_700Bold",
            fontSize: 28,
            letterSpacing: -0.5,
          }}
        >
          {restaurantName ?? "Restaurant"}
        </Text>
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            marginTop: 2,
          }}
        >
          {location}
        </Text>
      </View>

      {/* RESTAURANT */}
      <SectionLabel>Restaurant</SectionLabel>
      <Card>
        <Row
          icon="home"
          label={`${restaurantName ?? "Restaurant"} · ${location}`}
          right={<EditPill onPress={soon("Edit restaurant details")} />}
        />
        <Divider />
        <Row icon="grid" label={`Tables: ${tableCount}`} right={<EditPill onPress={soon("Edit table count")} />} />
        <Divider />
        <Row
          icon="monitor"
          label={`Kitchen Output: ${kitchenOutput}`}
          right={
            <Toggle
              on={kitchenOutput === "Screen"}
              onChange={() =>
                setKitchenOutput((v) => (v === "Screen" ? "Printer" : "Screen"))
              }
            />
          }
        />
      </Card>

      {/* OWNER ACCOUNT */}
      <SectionLabel>Owner account</SectionLabel>
      <Card>
        <Row
          icon="mail"
          label={`Owner email: ${user?.email ?? "—"}`}
          right={<GreyPill label="Change" onPress={soon("Change email")} />}
        />
        <Divider />
        <Row
          icon="key"
          label="Change password"
          right={<Feather name="chevron-right" size={18} color={TEXT_SECONDARY} />}
          onPress={soon("Change password")}
        />
        <Divider />
        <Row
          icon="shield"
          label="Owner PIN"
          sub="Set or change your 4 digit PIN"
          right={<GreyPill label="Change" onPress={soon("Change PIN")} />}
        />
      </Card>

      {/* STAFF */}
      <SectionLabel>Staff</SectionLabel>
      <Card>
        <Row
          icon="users"
          label={`Manage staff (${staffCount} members)`}
          right={<Feather name="chevron-right" size={18} color={TEXT_SECONDARY} />}
          onPress={() => router.push("/(owner)/staff" as any)}
        />
        <Divider />
        <Row
          icon="user-plus"
          label={`Pending invitations (${pendingInvites})`}
          right={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {pendingInvites > 0 ? (
                <View
                  style={{
                    backgroundColor: AMBER + "22",
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    height: 22,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: AMBER, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                    {pendingInvites}
                  </Text>
                </View>
              ) : null}
              <Feather name="chevron-right" size={18} color={TEXT_SECONDARY} />
            </View>
          }
          onPress={soon("Pending invitations")}
        />
      </Card>

      {/* NOTIFICATIONS */}
      <SectionLabel>Notifications</SectionLabel>
      <Card>
        <Row
          icon="bell"
          label="New order alerts"
          right={
            <Toggle
              on={notifications.newOrders}
              onChange={() =>
                setNotifications((n) => ({ ...n, newOrders: !n.newOrders }))
              }
            />
          }
        />
        <Divider />
        <Row
          icon="alert-triangle"
          label="Low stock alerts"
          right={
            <Toggle
              on={notifications.lowStock}
              onChange={() =>
                setNotifications((n) => ({ ...n, lowStock: !n.lowStock }))
              }
            />
          }
        />
        <Divider />
        <Row
          icon="alert-octagon"
          label="Platform connection issues"
          right={
            <Toggle
              on={notifications.platformIssues}
              onChange={() =>
                setNotifications((n) => ({ ...n, platformIssues: !n.platformIssues }))
              }
            />
          }
        />
        <Divider />
        <Row
          icon="bell"
          label="Settlement received"
          right={
            <Toggle
              on={notifications.settlementReceived}
              onChange={() =>
                setNotifications((n) => ({ ...n, settlementReceived: !n.settlementReceived }))
              }
            />
          }
        />
      </Card>

      {/* DANGER ZONE */}
      <SectionLabel>Danger zone</SectionLabel>
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: URGENT + "44",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <Row
          icon="rotate-ccw"
          iconColor={URGENT}
          label="Reset setup wizard"
          sub="This will not delete your data"
          right={<DangerPill label="Reset" onPress={onResetSetup} />}
        />
        <View style={{ height: 1, backgroundColor: URGENT + "33" }} />
        <Row
          icon="trash-2"
          iconColor={URGENT}
          label="Delete restaurant account"
          right={<DangerPill label="Delete" onPress={onDeleteAccount} />}
        />
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        onPress={logout}
        activeOpacity={0.85}
        style={{
          marginTop: 24,
          height: 52,
          borderRadius: 12,
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: URGENT + "44",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: URGENT, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
          Sign out
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          color: TEXT_MUTED,
          fontFamily: "Inter_400Regular",
          fontSize: 11,
          textAlign: "center",
          marginTop: 16,
        }}
      >
        Once · v1.0.0
      </Text>
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: TEXT_SECONDARY,
        fontFamily: "Inter_500Medium",
        fontSize: 12,
        letterSpacing: 1.8,
        textTransform: "uppercase",
        marginTop: 24,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: BORDER }} />;
}

function Row({
  icon,
  iconColor = TEXT_SECONDARY,
  label,
  sub,
  right,
  onPress,
}: {
  icon: FeatherName;
  iconColor?: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const Component: any = onPress ? TouchableOpacity : View;
  return (
    <Component
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Feather name={icon} size={18} color={iconColor} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_500Medium", fontSize: 14 }}>
          {label}
        </Text>
        {sub ? (
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {sub}
          </Text>
        ) : null}
      </View>
      {right}
    </Component>
  );
}

function EditPill({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: AMBER + "22",
        borderWidth: 1,
        borderColor: AMBER + "44",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: AMBER, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Edit</Text>
    </TouchableOpacity>
  );
}

function GreyPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: SURFACE_ACTIVE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function DangerPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: URGENT,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <TouchableOpacity
      onPress={onChange}
      activeOpacity={0.85}
      style={{
        width: 52,
        height: 28,
        borderRadius: 999,
        backgroundColor: on ? AMBER : BORDER,
        padding: 2,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: on ? "#000" : "#6B7080",
          alignSelf: on ? "flex-end" : "flex-start",
        }}
      />
    </TouchableOpacity>
  );
}

export default OwnerSettings;
