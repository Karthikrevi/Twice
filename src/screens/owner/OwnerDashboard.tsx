import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrders } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { useDailyReport } from "@/hooks/useReports";
import { OwnerOrders } from "@/screens/owner/tabs/OwnerOrders";
import { OwnerDinein } from "@/screens/owner/tabs/OwnerDinein";
import { OwnerFinance } from "@/screens/owner/tabs/OwnerFinance";
import { OwnerPlatforms } from "@/screens/owner/OwnerPlatforms";
// TODO: dedicated owner Settings screen not built yet — reuse the shared
// SettingsScreen for the Settings tab until then.
import { SettingsScreen } from "@/screens/SettingsScreen";
import { RoleGate } from "@/components/RoleGate";

const BG = "#0D0F14";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const AMBER = "#F5A623";
const SUCCESS = "#22C55E";
const URGENT = "#EF4444";

type TabKey = "orders" | "dinein" | "finance" | "platforms" | "settings";

const tabs: { key: TabKey; label: string }[] = [
  { key: "orders", label: "Orders" },
  { key: "dinein", label: "Dine-in" },
  { key: "finance", label: "Finance" },
  { key: "platforms", label: "Platforms" },
  { key: "settings", label: "Settings" },
];

export function OwnerDashboard() {
  const orders = useOrders();
  const tables = useTables();
  const report = useDailyReport();
  const [activeTab, setActiveTab] = useState<TabKey>("orders");

  const ordersToday = orders.data?.length ?? 0;

  const occupied = (tables.data ?? []).filter((t) => t.status === "occupied").length;
  const totalTables = tables.data?.length ?? 0;

  const netRevenue = useMemo(() => {
    const rows = report.data?.byPlatform ?? [];
    const gross = rows.reduce((s, r) => s + (r.gross ?? 0), 0);
    const commission = rows.reduce((s, r) => s + (r.commission ?? 0), 0);
    return (gross - commission) / 100;
  }, [report.data]);

  const awaiting = (orders.data ?? []).filter((o) => o.status === "new").length;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: BG }}>
      {/* Stat cards row */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <StatCard
          label="Orders today"
          accessory={
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: SUCCESS,
                  marginRight: 6,
                }}
              />
              <Text style={{ color: SUCCESS, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                Live
              </Text>
            </View>
          }
          value={String(ordersToday)}
          loading={orders.isLoading}
        />
        <StatCard
          label="Open tables"
          value={`${occupied}/${totalTables}`}
          loading={tables.isLoading}
        />
        {/* Revenue is sensitive — hide for waiter role even if the screen
            is ever reached outside the owner shell. */}
        <RoleGate roles={["owner", "manager"]}>
          <StatCard
            label="Revenue today"
            value={`AED ${netRevenue.toFixed(0)}`}
            valueColor={AMBER}
            accessory={
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 10,
                  marginTop: 4,
                }}
              >
                after commission
              </Text>
            }
            loading={report.isLoading}
          />
        </RoleGate>
        <StatCard
          label="Awaiting"
          value={String(awaiting)}
          valueColor={awaiting > 0 ? URGENT : TEXT_PRIMARY}
          accessory={
            awaiting > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                <PulsingDot color={URGENT} />
                <Text
                  style={{
                    color: URGENT,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 11,
                    marginLeft: 6,
                  }}
                >
                  needs confirmation
                </Text>
              </View>
            ) : null
          }
          loading={orders.isLoading}
        />
      </View>

      {/* Horizontal tab bar */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor: active ? AMBER : "transparent",
                marginBottom: -1,
              }}
            >
              <Text
                style={{
                  color: active ? AMBER : TEXT_SECONDARY,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "orders" ? (
          <OwnerOrders />
        ) : activeTab === "dinein" ? (
          <OwnerDinein />
        ) : activeTab === "finance" ? (
          <OwnerFinance />
        ) : activeTab === "platforms" ? (
          <OwnerPlatforms />
        ) : (
          // TODO: replace with dedicated owner Settings screen when built.
          <SettingsScreen />
        )}
      </View>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  accessory,
  valueColor = TEXT_PRIMARY,
  loading,
}: {
  label: string;
  value: string;
  accessory?: React.ReactNode;
  valueColor?: string;
  loading?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 16,
        padding: 12,
      }}
    >
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: valueColor,
          fontFamily: "Inter_700Bold",
          fontSize: 28,
          letterSpacing: -0.5,
          opacity: loading ? 0.4 : 1,
        }}
      >
        {loading ? "—" : value}
      </Text>
      {accessory}
    </View>
  );
}

function PulsingDot({ color, size = 6 }: { color: string; size?: number }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

export default OwnerDashboard;
