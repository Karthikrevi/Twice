import { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path, Line, Circle } from "react-native-svg";
import { useDailyReport } from "@/hooks/useReports";
import { usePlatforms } from "@/hooks/usePlatforms";
import { ListSkeleton } from "@/components/ui/States";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";

const BG = "#0D0F14";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const URGENT = "#EF4444";
const SUCCESS = "#22C55E";

type Filter = "all" | PlatformKey;
const PLATFORM_KEYS: PlatformKey[] = ["talabat", "deliveroo", "instashop", "dinein", "takeaway"];

const safe = (n: number | undefined | null) => (Number.isFinite(n) ? (n as number) : 0);

// Mock 7-day daily revenue per platform (AED). Backend doesn't return
// historical data yet — flag for follow-up.
function mockWeek(key: PlatformKey): number[] {
  const base: Record<PlatformKey, number[]> = {
    talabat: [820, 940, 760, 1240, 1180, 1430, 1520],
    deliveroo: [610, 690, 720, 580, 740, 880, 950],
    instashop: [240, 310, 260, 290, 340, 410, 380],
    dinein: [1240, 1340, 1180, 1490, 2010, 2380, 2510],
    takeaway: [410, 460, 380, 520, 590, 640, 680],
  };
  return base[key];
}

// Mock 24-hour order distribution per platform.
function mockDay(key: PlatformKey): number[] {
  const peak = key === "dinein" ? [12, 13, 18, 19, 20] : [12, 13, 18, 19, 20, 21];
  return Array.from({ length: 24 }, (_, h) =>
    peak.includes(h) ? 4 + (h % 3) : h >= 9 && h <= 23 ? 1 + (h % 2) : 0
  );
}

// Mock commission history.
function mockHistory() {
  return [
    {
      period: "This week",
      gross: 8420,
      rate: 0.25,
      commission: 2105,
      net: 6315,
      status: "Pending" as const,
    },
    {
      period: "Last week",
      gross: 7980,
      rate: 0.25,
      commission: 1995,
      net: 5985,
      status: "Paid" as const,
    },
    {
      period: "Two weeks ago",
      gross: 6650,
      rate: 0.25,
      commission: 1663,
      net: 4988,
      status: "Paid" as const,
    },
  ];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function FinancePlatforms() {
  const report = useDailyReport();
  const platformsConn = usePlatforms();
  const [filter, setFilter] = useState<Filter>("all");

  const byPlatform = report.data?.byPlatform ?? [];

  // Map platform key → daily report row.
  const rowByPlatform = useMemo(() => {
    const m = new Map<PlatformKey, (typeof byPlatform)[number]>();
    byPlatform.forEach((r) => m.set(r.platform as PlatformKey, r));
    return m;
  }, [byPlatform]);

  // Connection status for delivery platforms.
  const connectedSet = useMemo(() => {
    const set = new Set<string>();
    (platformsConn.data ?? []).forEach((p) => {
      if (p.status === "connected") set.add(p.platform);
    });
    return set;
  }, [platformsConn.data]);

  if (report.isLoading) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16, backgroundColor: BG }}>
        <ListSkeleton count={3} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Platform selector pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          gap: 8,
        }}
      >
        <FilterPill
          label="All"
          color={AMBER}
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        {PLATFORM_KEYS.map((key) => (
          <FilterPill
            key={key}
            label={platformLabel[key]}
            color={colors.platform[key]}
            active={filter === key}
            onPress={() => setFilter(key)}
          />
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96 }}
      >
        {filter === "all" ? (
          <AllPlatformsView
            rowByPlatform={rowByPlatform}
            connectedSet={connectedSet}
            onSelect={setFilter}
          />
        ) : (
          <DeepDiveView platform={filter} row={rowByPlatform.get(filter)} />
        )}
      </ScrollView>
    </View>
  );
}

function FilterPill({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: active ? color : SURFACE,
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
}

function AllPlatformsView({
  rowByPlatform,
  connectedSet,
  onSelect,
}: {
  rowByPlatform: Map<PlatformKey, any>;
  connectedSet: Set<string>;
  onSelect: (p: PlatformKey) => void;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      {PLATFORM_KEYS.map((key) => {
        const c = colors.platform[key];
        const row = rowByPlatform.get(key);
        const gross = safe(row?.gross) / 100;
        const commission = safe(row?.commission) / 100;
        const net = gross - commission;
        const isDelivery = key === "talabat" || key === "deliveroo" || key === "instashop";
        const connected = isDelivery ? connectedSet.has(key) : true;
        const statusLabel = isDelivery ? (connected ? "Connected" : "Disconnected") : "Direct";

        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelect(key)}
            activeOpacity={0.85}
            style={{
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
            }}
          >
            {/* Top row */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>
                  {platformLabel[key][0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
                  {platformLabel[key]}
                </Text>
              </View>
              <View
                style={{
                  height: 24,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: c + "22",
                  borderWidth: 1,
                  borderColor: c + "44",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: c,
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 11,
                    letterSpacing: 0.6,
                  }}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Stats row */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
              <SummaryStat label="Gross" value={`AED ${gross.toFixed(0)}`} color={TEXT_PRIMARY} />
              <SummaryStat
                label="Commission"
                value={`−${commission.toFixed(0)}`}
                color={URGENT}
              />
              <SummaryStat label="Net" value={`${net.toFixed(0)}`} color={AMBER} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color,
          fontFamily: "Inter_600SemiBold",
          fontSize: 14,
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function DeepDiveView({ platform, row }: { platform: PlatformKey; row: any | undefined }) {
  const c = colors.platform[platform];
  const gross = safe(row?.gross) / 100;
  const commission = safe(row?.commission) / 100;
  const net = gross - commission;
  const rate = safe(row?.rate);

  const week = mockWeek(platform);
  const hours = mockDay(platform);
  const history = mockHistory();

  return (
    <View style={{ marginTop: 16 }}>
      {/* Three metric cards */}
      <View style={{ flexDirection: "row", gap: 12 }}>
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
            Gross revenue
          </Text>
          <Text
            style={{
              color: TEXT_PRIMARY,
              fontFamily: "Inter_700Bold",
              fontSize: 24,
              letterSpacing: -0.5,
              marginTop: 4,
            }}
          >
            AED {gross.toFixed(0)}
          </Text>
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Commission rate: {Math.round(rate * 100)}%
          </Text>
        </View>
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
            Commission
          </Text>
          <Text
            style={{
              color: URGENT,
              fontFamily: "Inter_700Bold",
              fontSize: 24,
              letterSpacing: -0.5,
              marginTop: 4,
            }}
          >
            −{commission.toFixed(0)}
          </Text>
        </View>
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
            Net revenue
          </Text>
          <Text
            style={{
              color: AMBER,
              fontFamily: "Inter_700Bold",
              fontSize: 24,
              letterSpacing: -0.5,
              marginTop: 4,
            }}
          >
            {net.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Revenue line chart */}
      <ChartCard title="Revenue — last 7 days">
        <LineChart data={week} color={c} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          {DAY_LABELS.map((d) => (
            <Text
              key={d}
              style={{
                color: TEXT_MUTED,
                fontFamily: "Inter_500Medium",
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {d}
            </Text>
          ))}
        </View>
      </ChartCard>

      {/* Settlement status */}
      <ChartCard title="Settlement status">
        <View
          style={{
            backgroundColor: SUCCESS + "22",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 8,
          }}
        >
          <Text style={{ color: SUCCESS, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            Last settlement: AED 5,820 · Received May 8
          </Text>
        </View>
        <View
          style={{
            backgroundColor: AMBER + "22",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: AMBER, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            Pending settlement: AED 2,105 · Expected May 15
          </Text>
        </View>
      </ChartCard>

      {/* Order breakdown bar chart */}
      <ChartCard title="Order breakdown">
        <BarChart data={hours} color={c} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          {[0, 6, 12, 18, 23].map((h) => (
            <Text
              key={h}
              style={{
                color: TEXT_MUTED,
                fontFamily: "Inter_500Medium",
                fontSize: 10,
              }}
            >
              {h.toString().padStart(2, "0")}
            </Text>
          ))}
        </View>
      </ChartCard>

      {/* Commission history table */}
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: 16,
          marginTop: 16,
          overflow: "hidden",
        }}
      >
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_500Medium",
            fontSize: 12,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          Commission history
        </Text>
        {history.map((r, i) => (
          <View
            key={r.period}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: i < history.length - 1 ? 1 : 0,
              borderBottomColor: BORDER,
            }}
          >
            <View style={{ flex: 1.4 }}>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                }}
              >
                {r.period}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                AED {r.gross.toLocaleString()}
              </Text>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {Math.round(r.rate * 100)}%
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: URGENT, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                −{r.commission.toLocaleString()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: AMBER, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                {r.net.toLocaleString()}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: (r.status === "Paid" ? SUCCESS : AMBER) + "22",
              }}
            >
              <Text
                style={{
                  color: r.status === "Paid" ? SUCCESS : AMBER,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                }}
              >
                {r.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
      }}
    >
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          letterSpacing: 1.8,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function LineChart({ data, color }: { data: number[]; color: string }) {
  const W = 700;
  const H = 120;
  const PAD_X = 12;
  const PAD_Y = 10;
  const max = Math.max(1, ...data);
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((v, i) => ({
    x: PAD_X + i * step,
    y: PAD_Y + innerH - (v / max) * innerH,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `${linePath} L ${(PAD_X + innerW).toFixed(1)} ${(H - PAD_Y).toFixed(1)} ` +
    `L ${PAD_X.toFixed(1)} ${(H - PAD_Y).toFixed(1)} Z`;

  // Y gridlines
  const gridY = [0.25, 0.5, 0.75].map((p) => PAD_Y + innerH * p);

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {gridY.map((y, i) => (
        <Line
          key={`g${i}`}
          x1={PAD_X}
          y1={y}
          x2={W - PAD_X}
          y2={y}
          stroke={BORDER}
          strokeWidth={1}
        />
      ))}
      <Path d={areaPath} fill={color} fillOpacity={0.15} />
      <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {points.map((p, i) => (
        <Circle key={`d${i}`} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}
    </Svg>
  );
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const W = 700;
  const H = 80;
  const PAD_X = 8;
  const PAD_Y = 4;
  const max = Math.max(1, ...data);
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y;
  const slot = innerW / data.length;
  const barW = Math.max(2, slot * 0.7);

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * (innerH - PAD_Y));
        const x = PAD_X + i * slot + (slot - barW) / 2;
        const y = H - h;
        return (
          <Path
            key={`b${i}`}
            d={`M ${x} ${y + 2} A 2 2 0 0 1 ${x + 2} ${y} L ${x + barW - 2} ${y} A 2 2 0 0 1 ${x + barW} ${y + 2} L ${x + barW} ${H} L ${x} ${H} Z`}
            fill={v > 0 ? color : BORDER}
            opacity={v > 0 ? 1 : 0.4}
          />
        );
      })}
    </Svg>
  );
}

export default FinancePlatforms;
