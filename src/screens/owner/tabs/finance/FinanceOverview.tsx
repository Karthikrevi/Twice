import { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useDailyReport } from "@/hooks/useReports";
import { useOrders } from "@/hooks/useOrders";
import { ListSkeleton } from "@/components/ui/States";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";

const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const URGENT = "#EF4444";
const DONE_GREY = "#6B7080";

const PLATFORM_KEYS: PlatformKey[] = ["talabat", "deliveroo", "instashop", "dinein", "takeaway"];

interface Props {
  selectedDate: Date;
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const safe = (n: number | undefined | null) => (Number.isFinite(n) ? (n as number) : 0);

export function FinanceOverview({ selectedDate }: Props) {
  const report = useDailyReport();
  const orders = useOrders();

  const byPlatform = report.data?.byPlatform ?? [];
  const tills = report.data?.tills ?? {};

  const gross = useMemo(
    () => byPlatform.reduce((s, r) => s + safe(r.gross), 0) / 100,
    [byPlatform]
  );
  const commission = useMemo(
    () => byPlatform.reduce((s, r) => s + safe(r.commission), 0) / 100,
    [byPlatform]
  );
  const net = gross - commission;

  // Per-platform order counts for the selected date (defensive against
  // missing data — never NaN).
  const counts = useMemo(() => {
    const base: Record<PlatformKey, number> = {
      talabat: 0,
      deliveroo: 0,
      instashop: 0,
      dinein: 0,
      takeaway: 0,
    };
    (orders.data ?? []).forEach((o) => {
      try {
        const placed = new Date(o.placedAt);
        if (sameDay(placed, selectedDate)) base[o.platform]++;
      } catch {
        /* ignore malformed date */
      }
    });
    return base;
  }, [orders.data, selectedDate]);

  if (report.isLoading) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <ListSkeleton count={3} />
      </View>
    );
  }

  if (report.isError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingVertical: 64,
        }}
      >
        <Text
          style={{
            color: URGENT,
            fontFamily: "Inter_500Medium",
            fontSize: 13,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          We couldn't load this report.
        </Text>
        <TouchableOpacity
          onPress={() => report.refetch()}
          activeOpacity={0.85}
          style={{
            backgroundColor: AMBER,
            paddingHorizontal: 20,
            height: 40,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}
    >
      {/* Row 1 — three metric cards */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MetricCard label="Gross revenue" value={`AED ${gross.toFixed(0)}`} valueColor={TEXT_PRIMARY} />
        <MetricCard
          label="Commission"
          value={`−${commission.toFixed(0)}`}
          valueColor={URGENT}
        />
        <MetricCard label="Net revenue" value={`${net.toFixed(0)}`} valueColor={AMBER} />
      </View>

      {/* By channel */}
      <SectionLabel>By channel</SectionLabel>
      {byPlatform.length === 0 ? (
        <View
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 24,
            alignItems: "center",
          }}
        >
          <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            No channel revenue for this day.
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {byPlatform.map((row, i) => {
            const key = row.platform as PlatformKey;
            const rate = safe(row.rate);
            const rowGross = safe(row.gross) / 100;
            const rowFee = safe(row.commission) / 100;
            return (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: i < byPlatform.length - 1 ? 1 : 0,
                  borderBottomColor: BORDER,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 28,
                    borderRadius: 2,
                    backgroundColor: colors.platform[key],
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: TEXT_PRIMARY,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    {platformLabel[key]}
                  </Text>
                  <Text
                    style={{
                      color: TEXT_SECONDARY,
                      fontFamily: "Inter_400Regular",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {rate > 0 ? `${Math.round(rate * 100)}% commission` : "Direct"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: TEXT_PRIMARY,
                      fontFamily: "Inter_700Bold",
                      fontSize: 14,
                    }}
                  >
                    AED {rowGross.toFixed(0)}
                  </Text>
                  {rate > 0 ? (
                    <Text
                      style={{
                        color: URGENT,
                        fontFamily: "Inter_500Medium",
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      −{rowFee.toFixed(0)} fee
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: DONE_GREY,
                        fontFamily: "Inter_400Regular",
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      no fee
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Till verification */}
      <SectionLabel>Till verification</SectionLabel>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TillCard label="Cash" value={safe(tills.cash) / 100} />
        <TillCard label="Card" value={safe(tills.card) / 100} />
        <TillCard label="Wallet" value={safe(tills.wallet) / 100} />
      </View>

      {/* Order breakdown */}
      <SectionLabel>Order breakdown</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {PLATFORM_KEYS.map((key) => {
          const c = colors.platform[key];
          const n = counts[key];
          return (
            <View
              key={key}
              style={{
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: c + "22",
                borderWidth: 1,
                borderColor: c + "44",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: c,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                }}
              >
                {platformLabel[key]}
              </Text>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_500Medium",
                  fontSize: 11,
                  marginLeft: 6,
                }}
              >
                {n} {n === 1 ? "order" : "orders"}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
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
          fontSize: 24,
          letterSpacing: -0.5,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function TillCard({ label, value }: { label: string; value: number }) {
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
          color: TEXT_MUTED,
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: TEXT_PRIMARY,
          fontFamily: "Inter_700Bold",
          fontSize: 20,
          letterSpacing: -0.4,
          marginTop: 4,
        }}
      >
        {value.toFixed(0)}
      </Text>
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

export default FinanceOverview;
