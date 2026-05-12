import { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Svg, { Rect } from "react-native-svg";
import { useOrders } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";

const BG = "#0D0F14";
const SURFACE = "#161920";
const SURFACE_ACTIVE = "#1E2128";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const SUCCESS = "#22C55E";
const URGENT = "#EF4444";
const BRONZE = "#CD7F32";

const TARGET_COVER = 65;
const ITEMS_HIGH = 3.5;
const ITEMS_LOW = 2.5;

type Shift = "all" | "lunch" | "dinner";

interface TableServed {
  table: string;
  guests: number;
  items: number;
  total: number;
  duration: string;
  avgPerCover: number;
}

interface Waiter {
  id: string;
  name: string;
  initials: string;
  tables: number;
  covers: number;
  total: number;
  itemsPerCover: number;
  sparkline: number[];
  breakdown: TableServed[];
}

// TODO: backend doesn't yet expose per-waiter performance. Replace this
// placeholder list with a real /reports/servers endpoint when available.
const PLACEHOLDER_WAITERS: Waiter[] = [
  {
    id: "w1",
    name: "Layla Hassan",
    initials: "LH",
    tables: 12,
    covers: 36,
    total: 2412,
    itemsPerCover: 4.2,
    sparkline: [180, 220, 140, 260, 200, 240],
    breakdown: [
      { table: "T3", guests: 4, items: 18, total: 312, duration: "1h 04m", avgPerCover: 78 },
      { table: "T7", guests: 2, items: 9, total: 186, duration: "0h 42m", avgPerCover: 93 },
      { table: "T9", guests: 3, items: 13, total: 244, duration: "0h 58m", avgPerCover: 81 },
      { table: "T11", guests: 5, items: 22, total: 412, duration: "1h 22m", avgPerCover: 82 },
    ],
  },
  {
    id: "w2",
    name: "Omar Karim",
    initials: "OK",
    tables: 10,
    covers: 28,
    total: 1820,
    itemsPerCover: 3.6,
    sparkline: [120, 160, 180, 110, 200, 140],
    breakdown: [
      { table: "T2", guests: 2, items: 7, total: 142, duration: "0h 38m", avgPerCover: 71 },
      { table: "T5", guests: 4, items: 14, total: 268, duration: "1h 05m", avgPerCover: 67 },
      { table: "T8", guests: 3, items: 10, total: 198, duration: "0h 49m", avgPerCover: 66 },
    ],
  },
  {
    id: "w3",
    name: "Yasmin Ali",
    initials: "YA",
    tables: 9,
    covers: 25,
    total: 1380,
    itemsPerCover: 2.9,
    sparkline: [110, 140, 90, 120, 150, 100],
    breakdown: [
      { table: "T1", guests: 2, items: 5, total: 112, duration: "0h 33m", avgPerCover: 56 },
      { table: "T6", guests: 3, items: 8, total: 168, duration: "0h 47m", avgPerCover: 56 },
      { table: "T10", guests: 4, items: 11, total: 224, duration: "1h 11m", avgPerCover: 56 },
    ],
  },
  {
    id: "w4",
    name: "Faisal Reza",
    initials: "FR",
    tables: 7,
    covers: 18,
    total: 820,
    itemsPerCover: 2.1,
    sparkline: [80, 100, 70, 90, 110, 60],
    breakdown: [
      { table: "T4", guests: 2, items: 3, total: 78, duration: "0h 26m", avgPerCover: 39 },
      { table: "T12", guests: 3, items: 6, total: 144, duration: "0h 41m", avgPerCover: 48 },
    ],
  },
];

const safe = (n: number | undefined | null) => (Number.isFinite(n) ? (n as number) : 0);

const performanceColor = (itemsPerCover: number) => {
  if (itemsPerCover > ITEMS_HIGH) return SUCCESS;
  if (itemsPerCover >= ITEMS_LOW) return AMBER;
  return URGENT;
};

const RANK_STYLES = (rank: number) => {
  if (rank === 1) return { bg: AMBER, color: "#000" };
  if (rank === 2) return { bg: "#8B90A0", color: "#FFF" };
  if (rank === 3) return { bg: BRONZE, color: "#FFF" };
  return { bg: BORDER, color: TEXT_SECONDARY };
};

export function FinanceServers() {
  const orders = useOrders();
  const tables = useTables();
  const [shift, setShift] = useState<Shift>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Real dine-in totals if backend has data; otherwise fall back to mock
  // sum for the summary card.
  const dineinFromApi = useMemo(() => {
    const list = (orders.data ?? []).filter((o) => o.platform === "dinein");
    return list.reduce((s, o) => s + safe(o.total), 0);
  }, [orders.data]);

  // Apply shift filter — placeholder: lunch keeps top 2, dinner keeps
  // bottom 2 for visual differentiation until shift data exists.
  const waiters = useMemo(() => {
    const ranked = [...PLACEHOLDER_WAITERS].sort((a, b) => b.total - a.total);
    if (shift === "lunch") return ranked.slice(0, 2);
    if (shift === "dinner") return ranked.slice(2);
    return ranked;
  }, [shift]);

  const totalRevenue = waiters.reduce((s, w) => s + w.total, 0) || dineinFromApi;
  const totalCovers = waiters.reduce((s, w) => s + w.covers, 0);
  const avgPerCover = totalCovers ? totalRevenue / totalCovers : 0;
  const belowTarget = avgPerCover > 0 && avgPerCover < TARGET_COVER;
  const top = waiters[0];

  // Touch tables hook so the summary stays accurate when backend wires up.
  void tables;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
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
          Server performance
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["all", "lunch", "dinner"] as Shift[]).map((s) => {
            const active = shift === s;
            const label = s === "all" ? "All Shifts" : s === "lunch" ? "Lunch" : "Dinner";
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setShift(s)}
                activeOpacity={0.85}
                style={{
                  height: 32,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: active ? AMBER : SURFACE,
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
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Summary cards */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <SummaryCard
          label="Total dine-in revenue"
          value={`AED ${totalRevenue.toLocaleString()}`}
          valueColor={AMBER}
          caption={`across ${waiters.length} active servers`}
        />
        <SummaryCard
          label="Average per cover"
          value={`AED ${avgPerCover.toFixed(0)}`}
          valueColor={belowTarget ? URGENT : TEXT_PRIMARY}
          caption={`target AED ${TARGET_COVER}`}
        />
        <SummaryCard
          label="Best performer"
          value={top?.name ?? "—"}
          valueColor={AMBER}
          valueSize={18}
          caption={top ? `AED ${(top.total / top.tables).toFixed(0)} avg per table` : ""}
        />
      </View>

      {/* Leaderboard */}
      <SectionLabel>Leaderboard</SectionLabel>
      <View style={{ gap: 12 }}>
        {waiters.map((w, i) => {
          const rank = i + 1;
          const rankStyle = RANK_STYLES(rank);
          const color = performanceColor(w.itemsPerCover);
          const avgPerTable = w.total / w.tables;
          const isTop = rank === 1;
          const isBottomUnder =
            i === waiters.length - 1 && w.itemsPerCover < ITEMS_LOW;
          const leftBorder = isTop ? AMBER : isBottomUnder ? URGENT : undefined;

          return (
            <View
              key={w.id}
              style={{
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderLeftWidth: leftBorder ? 3 : 1,
                borderLeftColor: leftBorder ?? BORDER,
              }}
            >
              {/* Rank badge */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: rankStyle.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: rankStyle.color,
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                  }}
                >
                  {rank}
                </Text>
              </View>

              {/* Initials */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: SURFACE_ACTIVE,
                  borderWidth: 1,
                  borderColor: BORDER,
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 12,
                }}
              >
                <Text
                  style={{
                    color: AMBER,
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                  }}
                >
                  {w.initials}
                </Text>
              </View>

              {/* Stats column */}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    color: TEXT_PRIMARY,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                  }}
                >
                  {w.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 4,
                  }}
                >
                  <Stat text={`${w.tables} tables`} color={TEXT_SECONDARY} />
                  <Stat
                    text={`AED ${w.total.toLocaleString()} total`}
                    color={AMBER}
                    bold
                  />
                  <Stat text={`AED ${avgPerTable.toFixed(0)} avg per table`} color={TEXT_PRIMARY} />
                  <Stat text={`${w.itemsPerCover.toFixed(1)} items per cover`} color={color} bold />
                </View>
              </View>

              {/* Sparkline */}
              <View style={{ marginLeft: 12 }}>
                <Sparkline data={w.sparkline} color={color} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Table by table breakdown */}
      <SectionLabel>Table by table breakdown</SectionLabel>
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {waiters.map((w, i) => {
          const open = expanded === w.id;
          return (
            <View key={w.id}>
              <TouchableOpacity
                onPress={() => setExpanded(open ? null : w.id)}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: i < waiters.length - 1 && !open ? 1 : 0,
                  borderBottomColor: BORDER,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Feather
                    name={open ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={TEXT_SECONDARY}
                  />
                  <Text
                    style={{
                      color: TEXT_PRIMARY,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                      marginLeft: 8,
                    }}
                  >
                    {w.name}
                  </Text>
                </View>
                <Text style={{ color: AMBER, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  AED {w.total.toLocaleString()}
                </Text>
              </TouchableOpacity>

              {open ? (
                <View style={{ backgroundColor: SURFACE_ACTIVE }}>
                  <View
                    style={{
                      flexDirection: "row",
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: BORDER,
                    }}
                  >
                    <ColumnHeader label="Table" flex={0.7} />
                    <ColumnHeader label="Guests" flex={0.7} />
                    <ColumnHeader label="Items" flex={0.7} />
                    <ColumnHeader label="Total" flex={1} />
                    <ColumnHeader label="Duration" flex={0.9} />
                    <ColumnHeader label="Avg / cover" flex={1} />
                  </View>
                  {w.breakdown.map((row, j) => (
                    <View
                      key={`${w.id}-${j}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderBottomWidth:
                          j < w.breakdown.length - 1 || i < waiters.length - 1 ? 1 : 0,
                        borderBottomColor: BORDER,
                      }}
                    >
                      <SubCell flex={0.7} text={row.table} />
                      <SubCell flex={0.7} text={String(row.guests)} />
                      <SubCell flex={0.7} text={String(row.items)} />
                      <SubCell flex={1} text={`AED ${row.total}`} amber />
                      <SubCell flex={0.9} text={row.duration} />
                      <SubCell flex={1} text={`AED ${row.avgPerCover}`} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Info card */}
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <Feather name="info" size={16} color={TEXT_SECONDARY} />
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            marginLeft: 8,
          }}
        >
          Items per cover target: {ITEMS_HIGH}+
        </Text>
        <View style={{ flex: 1 }} />
        <Text
          style={{
            color: AMBER,
            fontFamily: "Inter_500Medium",
            fontSize: 12,
          }}
        >
          Set in Settings
        </Text>
      </View>
    </ScrollView>
  );
}

function SummaryCard({
  label,
  value,
  caption,
  valueColor,
  valueSize = 24,
}: {
  label: string;
  value: string;
  caption?: string;
  valueColor: string;
  valueSize?: number;
}) {
  return (
    <View
      style={{
        flex: 1,
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
        {label}
      </Text>
      <Text
        style={{
          color: valueColor,
          fontFamily: "Inter_700Bold",
          fontSize: valueSize,
          letterSpacing: -0.5,
          marginTop: 4,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      {caption ? (
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {caption}
        </Text>
      ) : null}
    </View>
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

function Stat({ text, color, bold }: { text: string; color: string; bold?: boolean }) {
  return (
    <Text
      style={{
        color,
        fontFamily: bold ? "Inter_600SemiBold" : "Inter_400Regular",
        fontSize: 12,
        marginRight: 12,
      }}
    >
      {text}
    </Text>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 60;
  const H = 32;
  const max = Math.max(1, ...data);
  const slot = W / data.length;
  const barW = Math.max(2, slot * 0.6);
  return (
    <Svg width={W} height={H}>
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * (H - 4));
        const x = i * slot + (slot - barW) / 2;
        const y = H - h;
        return <Rect key={i} x={x} y={y} width={barW} height={h} rx={1} fill={color} />;
      })}
    </Svg>
  );
}

function ColumnHeader({ label, flex }: { label: string; flex: number }) {
  return (
    <Text
      style={{
        flex,
        color: TEXT_SECONDARY,
        fontFamily: "Inter_500Medium",
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: "uppercase",
      }}
    >
      {label}
    </Text>
  );
}

function SubCell({ flex, text, amber }: { flex: number; text: string; amber?: boolean }) {
  return (
    <Text
      style={{
        flex,
        color: amber ? AMBER : TEXT_PRIMARY,
        fontFamily: amber ? "Inter_600SemiBold" : "Inter_400Regular",
        fontSize: 13,
      }}
      numberOfLines={1}
    >
      {text}
    </Text>
  );
}

export default FinanceServers;
