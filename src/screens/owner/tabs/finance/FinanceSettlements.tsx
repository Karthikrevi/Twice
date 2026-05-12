import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";

const BG = "#0D0F14";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const SUCCESS = "#22C55E";
const URGENT = "#EF4444";

type Filter = "all" | "talabat" | "deliveroo" | "instashop";
type Status = "Paid" | "Pending" | "Overdue";

interface SettlementRow {
  id: string;
  platform: "talabat" | "deliveroo" | "instashop";
  period: string;
  gross: number;
  commission: number;
  net: number;
  expected: string;
  received: string | null;
  status: Status;
  pendingDays?: number;
}

// Placeholder data — backend settlements endpoint not yet built.
// TODO: wire to GET /reports/settlements once exposed.
const PLACEHOLDER: SettlementRow[] = [
  {
    id: "s1",
    platform: "talabat",
    period: "Apr 22–28",
    gross: 8420,
    commission: 2105,
    net: 6315,
    expected: "May 5",
    received: "May 5",
    status: "Paid",
  },
  {
    id: "s2",
    platform: "deliveroo",
    period: "Apr 22–28",
    gross: 5912,
    commission: 1656,
    net: 4256,
    expected: "May 5",
    received: "May 6",
    status: "Paid",
  },
  {
    id: "s3",
    platform: "instashop",
    period: "Apr 22–28",
    gross: 2104,
    commission: 463,
    net: 1641,
    expected: "May 5",
    received: "May 5",
    status: "Paid",
  },
  {
    id: "s4",
    platform: "talabat",
    period: "Apr 29 – May 5",
    gross: 9120,
    commission: 2280,
    net: 6840,
    expected: "May 12",
    received: null,
    status: "Pending",
    pendingDays: 3,
  },
  {
    id: "s5",
    platform: "deliveroo",
    period: "Apr 29 – May 5",
    gross: 6440,
    commission: 1803,
    net: 4637,
    expected: "May 12",
    received: null,
    status: "Pending",
    pendingDays: 3,
  },
  {
    id: "s6",
    platform: "instashop",
    period: "Apr 15–21",
    gross: 1820,
    commission: 400,
    net: 1420,
    expected: "Apr 28",
    received: null,
    status: "Overdue",
    pendingDays: 8,
  },
];

const STATUS_COLOR: Record<Status, string> = {
  Paid: SUCCESS,
  Pending: AMBER,
  Overdue: URGENT,
};

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: "all", label: "All Platforms", color: AMBER },
  { key: "talabat", label: "Talabat", color: colors.platform.talabat },
  { key: "deliveroo", label: "Deliveroo", color: colors.platform.deliveroo },
  { key: "instashop", label: "InstaShop", color: colors.platform.instashop },
];

export function FinanceSettlements() {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () => (filter === "all" ? PLACEHOLDER : PLACEHOLDER.filter((r) => r.platform === filter)),
    [filter]
  );

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.gross += r.gross;
        acc.commission += r.commission;
        acc.net += r.net;
        return acc;
      },
      { gross: 0, commission: 0, net: 0 }
    );
  }, [rows]);

  const outstanding = useMemo(() => {
    const pending = PLACEHOLDER.filter((r) => r.status !== "Paid");
    const total = pending.reduce((s, r) => s + r.net, 0);
    const oldest = pending.reduce((d, r) => Math.max(d, r.pendingDays ?? 0), 0);
    const platforms = new Set(pending.map((p) => p.platform));
    const byPlatform = Array.from(platforms).map((p) => ({
      platform: p as SettlementRow["platform"],
      total: pending.filter((r) => r.platform === p).reduce((s, r) => s + r.net, 0),
    }));
    return { total, oldest, platformCount: platforms.size, byPlatform };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_700Bold",
            fontSize: 20,
            letterSpacing: -0.3,
          }}
        >
          Settlement history
        </Text>

        <TouchableOpacity
          onPress={() => Alert.alert("Date range picker coming soon.")}
          activeOpacity={0.85}
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 10,
            paddingHorizontal: 12,
            height: 36,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            Apr 2026 — May 2026
          </Text>
          <Feather name="calendar" size={16} color={TEXT_SECONDARY} />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.85}
              style={{
                height: 36,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: active ? f.color : SURFACE,
                borderWidth: active ? 0 : 1,
                borderColor: BORDER,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: active ? "#000" : TEXT_SECONDARY,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Two-panel layout */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* LEFT: table */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 16,
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            {/* Column header row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: BORDER,
              }}
            >
              <ColumnHeader label="Platform" flex={1.1} />
              <ColumnHeader label="Period" flex={1.1} />
              <ColumnHeader label="Gross" flex={0.9} />
              <ColumnHeader label="Commission" flex={1} />
              <ColumnHeader label="Net" flex={0.9} />
              <ColumnHeader label="Expected" flex={0.9} />
              <ColumnHeader label="Received" flex={0.9} />
              <ColumnHeader label="Status" flex={0.9} />
              <ColumnHeader label="Action" flex={0.9} align="right" />
            </View>

            {/* Data rows */}
            {rows.map((row, i) => (
              <SettlementRowView key={row.id} row={row} isLast={i === rows.length - 1} />
            ))}

            {/* Summary footer */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: BORDER,
                backgroundColor: BG,
              }}
            >
              <View style={{ flex: 2.2 }} />
              <FooterCell label="Total Gross" value={`AED ${totals.gross.toLocaleString()}`} color={TEXT_PRIMARY} flex={0.9} />
              <FooterCell label="Total Commission" value={`−${totals.commission.toLocaleString()}`} color={URGENT} flex={1} />
              <FooterCell label="Total Net" value={`AED ${totals.net.toLocaleString()}`} color={AMBER} flex={0.9} bold />
              <View style={{ flex: 2.7 }} />
            </View>
          </View>
        </ScrollView>

        {/* RIGHT: outstanding card */}
        <View style={{ width: 220, paddingHorizontal: 16, paddingTop: 8 }}>
          <View
            style={{
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{
                color: TEXT_SECONDARY,
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                letterSpacing: 1.6,
                textTransform: "uppercase",
              }}
            >
              Outstanding settlements
            </Text>
            <Text
              style={{
                color: AMBER,
                fontFamily: "Inter_700Bold",
                fontSize: 22,
                letterSpacing: -0.5,
                marginTop: 8,
              }}
            >
              AED {outstanding.total.toLocaleString()}
            </Text>
            <Text
              style={{
                color: TEXT_SECONDARY,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              across {outstanding.platformCount}{" "}
              {outstanding.platformCount === 1 ? "platform" : "platforms"}
            </Text>

            <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 14 }} />

            <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_400Regular", fontSize: 12 }}>
              Oldest pending
            </Text>
            <Text
              style={{
                color: outstanding.oldest >= 7 ? URGENT : AMBER,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                marginTop: 4,
              }}
            >
              {outstanding.oldest} {outstanding.oldest === 1 ? "day" : "days"}
            </Text>

            <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 14 }} />

            {outstanding.byPlatform.map((p, i) => {
              const c = colors.platform[p.platform as PlatformKey];
              return (
                <View
                  key={p.platform}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: i === 0 ? 0 : 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View
                      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c, marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: TEXT_SECONDARY,
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                      }}
                    >
                      {platformLabel[p.platform as PlatformKey]}
                    </Text>
                  </View>
                  <Text style={{ color: AMBER, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                    AED {p.total.toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

function SettlementRowView({ row, isLast }: { row: SettlementRow; isLast: boolean }) {
  const overdue = row.status === "Overdue";
  const platformColor = colors.platform[row.platform as PlatformKey];
  const statusColor = STATUS_COLOR[row.status];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: BORDER,
        borderLeftWidth: overdue ? 3 : 0,
        borderLeftColor: overdue ? URGENT : "transparent",
        backgroundColor: overdue ? URGENT + "0F" : "transparent",
      }}
    >
      <View style={{ flex: 1.1 }}>
        <View
          style={{
            alignSelf: "flex-start",
            height: 22,
            paddingHorizontal: 8,
            borderRadius: 999,
            backgroundColor: platformColor + "33",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: platformColor,
              fontFamily: "Inter_600SemiBold",
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {platformLabel[row.platform as PlatformKey]}
          </Text>
        </View>
      </View>

      <Cell flex={1.1} text={row.period} muted />
      <Cell flex={0.9} text={`AED ${row.gross.toLocaleString()}`} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: URGENT, fontFamily: "Inter_500Medium", fontSize: 13 }}>
          −AED {row.commission.toLocaleString()}
        </Text>
      </View>
      <View style={{ flex: 0.9 }}>
        <Text style={{ color: AMBER, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
          AED {row.net.toLocaleString()}
        </Text>
      </View>
      <Cell flex={0.9} text={row.expected} muted />
      <Cell flex={0.9} text={row.received ?? "—"} muted />

      {/* Status */}
      <View style={{ flex: 0.9 }}>
        <View
          style={{
            alignSelf: "flex-start",
            height: 24,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: statusColor + "22",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: statusColor,
              fontFamily: "Inter_600SemiBold",
              fontSize: 11,
              letterSpacing: 0.4,
            }}
          >
            {row.status}
          </Text>
        </View>
      </View>

      {/* Action */}
      <View style={{ flex: 0.9, alignItems: "flex-end" }}>
        <TouchableOpacity
          onPress={() => Alert.alert("Settlement detail coming soon.")}
          hitSlop={8}
        >
          <Text style={{ color: AMBER, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
            View details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ColumnHeader({
  label,
  flex,
  align = "left",
}: {
  label: string;
  flex: number;
  align?: "left" | "right";
}) {
  return (
    <Text
      style={{
        flex,
        color: TEXT_SECONDARY,
        fontFamily: "Inter_500Medium",
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        textAlign: align,
      }}
    >
      {label}
    </Text>
  );
}

function Cell({
  flex,
  text,
  muted,
}: {
  flex: number;
  text: string;
  muted?: boolean;
}) {
  return (
    <Text
      style={{
        flex,
        color: muted ? TEXT_SECONDARY : TEXT_PRIMARY,
        fontFamily: muted ? "Inter_400Regular" : "Inter_500Medium",
        fontSize: muted ? 12 : 13,
      }}
      numberOfLines={1}
    >
      {text}
    </Text>
  );
}

function FooterCell({
  label,
  value,
  color,
  flex,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  flex: number;
  bold?: boolean;
}) {
  return (
    <View style={{ flex }}>
      <Text
        style={{
          color: TEXT_MUTED,
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color,
          fontFamily: bold ? "Inter_700Bold" : "Inter_600SemiBold",
          fontSize: bold ? 14 : 13,
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default FinanceSettlements;
