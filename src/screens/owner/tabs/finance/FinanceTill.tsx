import { useMemo } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useDailyReport } from "@/hooks/useReports";
import { useTables } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { ListSkeleton } from "@/components/ui/States";

const BG = "#0D0F14";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const SUCCESS = "#22C55E";
const URGENT = "#EF4444";
const CASH = "#22C55E";
const CARD = "#3B82F6";
const WALLET = "#7C6AF5";

const safe = (n: number | undefined | null) => (Number.isFinite(n) ? (n as number) : 0);

interface Props {
  selectedDate?: Date;
}

const formatDateLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const formatTime = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};

export function FinanceTill({ selectedDate }: Props) {
  const date = selectedDate ?? new Date();
  const report = useDailyReport();
  const tables = useTables();
  const orders = useOrders();

  const tills = report.data?.tills ?? {};
  const cashCents = safe(tills.cash);
  const cardCents = safe(tills.card);
  const walletCents = safe(tills.wallet);
  const recordedCents = cashCents + cardCents + walletCents;

  // Expected = sum of all order totals for the selected day.
  const expectedCents = useMemo(() => {
    return (orders.data ?? []).reduce((s, o) => {
      try {
        const placed = new Date(o.placedAt);
        if (placed.toDateString() === date.toDateString()) {
          return s + Math.round(o.total * 100);
        }
      } catch {
        /* ignore */
      }
      return s;
    }, 0);
  }, [orders.data, date]);

  const discrepancyCents = recordedCents - expectedCents;
  const matches = Math.abs(discrepancyCents) < 1;

  const takeawayRows = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) => o.platform === "takeaway" && o.status === "done"
      ),
    [orders.data]
  );

  // Currently no closed-sessions endpoint — useTables returns open sessions
  // only. Render empty state for the dine-in breakdown until the API exposes
  // closed sessions for a given day.
  const closedDineinSessions: Array<{
    id: string;
    table: string;
    guests: number;
    total: number;
    method: string;
    time: string;
    closedBy: string;
  }> = [];

  const markDayComplete = () => {
    Alert.alert(
      "Mark this day as complete?",
      "This will lock today's records.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => undefined },
      ],
      { cancelable: true }
    );
  };

  if (report.isLoading || tables.isLoading || orders.isLoading) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16, backgroundColor: BG }}>
        <ListSkeleton count={3} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96 }}
    >
      {/* Header row */}
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
            color: TEXT_SECONDARY,
            fontFamily: "Inter_500Medium",
            fontSize: 12,
            letterSpacing: 1.8,
            textTransform: "uppercase",
          }}
        >
          Till reconciliation
        </Text>
        <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_400Regular", fontSize: 12 }}>
          {formatDateLabel(date)}
        </Text>
      </View>

      {/* Payment method cards */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <PaymentCard
          label="Cash"
          accent={CASH}
          amount={cashCents / 100}
          count={countByMethod(takeawayRows.length, closedDineinSessions.length, "cash")}
        />
        <PaymentCard
          label="Card"
          accent={CARD}
          amount={cardCents / 100}
          count={countByMethod(takeawayRows.length, closedDineinSessions.length, "card")}
        />
        <PaymentCard
          label="Wallet"
          accent={WALLET}
          amount={walletCents / 100}
          count={countByMethod(takeawayRows.length, closedDineinSessions.length, "wallet")}
        />
      </View>

      {/* Dine-in breakdown */}
      <SectionCard title="Dine-in breakdown" marginTop={24}>
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: BORDER,
          }}
        >
          <ColumnHeader label="Table" flex={0.9} />
          <ColumnHeader label="Guests" flex={0.7} />
          <ColumnHeader label="Total" flex={1} />
          <ColumnHeader label="Method" flex={0.9} />
          <ColumnHeader label="Time" flex={0.8} />
          <ColumnHeader label="Closed by" flex={1} />
        </View>
        {closedDineinSessions.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
              No closed sessions today
            </Text>
          </View>
        ) : (
          closedDineinSessions.map((row, i, arr) => (
            <View
              key={row.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: BORDER,
              }}
            >
              <Cell flex={0.9} text={row.table} muted />
              <Cell flex={0.7} text={String(row.guests)} muted />
              <Cell flex={1} text={`AED ${row.total.toFixed(0)}`} amber />
              <Cell flex={0.9} text={row.method} muted capitalize />
              <Cell flex={0.8} text={row.time} muted />
              <Cell flex={1} text={row.closedBy} muted />
            </View>
          ))
        )}
      </SectionCard>

      {/* Takeaway breakdown */}
      <SectionCard title="Takeaway breakdown" marginTop={16}>
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: BORDER,
          }}
        >
          <ColumnHeader label="Order ID" flex={1.1} />
          <ColumnHeader label="Items" flex={0.7} />
          <ColumnHeader label="Total" flex={1} />
          <ColumnHeader label="Method" flex={0.9} />
          <ColumnHeader label="Time" flex={0.8} />
        </View>
        {takeawayRows.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
              No takeaway orders today
            </Text>
          </View>
        ) : (
          takeawayRows.map((o, i, arr) => {
            const itemsCount = o.items.reduce((s, it) => s + it.qty, 0);
            return (
              <View
                key={o.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: BORDER,
                }}
              >
                <Cell flex={1.1} text={o.shortId} muted />
                <Cell flex={0.7} text={String(itemsCount)} muted />
                <Cell flex={1} text={`AED ${o.total.toFixed(0)}`} amber />
                <Cell flex={0.9} text="—" muted />
                <Cell flex={0.8} text={formatTime(o.placedAt)} muted />
              </View>
            );
          })
        )}
      </SectionCard>

      {/* End of day summary */}
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: 16,
          padding: 16,
          marginTop: 24,
        }}
      >
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_500Medium",
            fontSize: 12,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          End of day summary
        </Text>

        <View style={{ flexDirection: "row", gap: 16 }}>
          <SummaryColumn label="Expected total" value={`AED ${(expectedCents / 100).toFixed(0)}`} />
          <SummaryColumn
            label="Recorded total"
            value={`AED ${(recordedCents / 100).toFixed(0)}`}
            color={matches ? SUCCESS : URGENT}
            icon={matches ? "check-circle" : undefined}
          />
          <SummaryColumn
            label="Discrepancy"
            value={`${discrepancyCents >= 0 ? "+" : "−"}${Math.abs(discrepancyCents / 100).toFixed(0)}`}
            color={matches ? SUCCESS : URGENT}
          />
        </View>
      </View>

      {/* Mark day complete */}
      <TouchableOpacity
        onPress={markDayComplete}
        activeOpacity={0.85}
        style={{
          marginTop: 16,
          height: 52,
          borderRadius: 12,
          backgroundColor: AMBER,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
          Mark day complete
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PaymentCard({
  label,
  accent,
  amount,
  count,
}: {
  label: string;
  accent: string;
  amount: number;
  count: number;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderLeftWidth: 3,
        borderLeftColor: accent,
        borderRadius: 16,
        padding: 16,
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
          fontSize: 22,
          letterSpacing: -0.5,
          marginTop: 4,
        }}
      >
        AED {amount.toFixed(0)}
      </Text>
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_400Regular",
          fontSize: 11,
          marginTop: 2,
        }}
      >
        {count} {count === 1 ? "transaction" : "transactions"}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  marginTop,
  children,
}: {
  title: string;
  marginTop: number;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 16,
        marginTop,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        <Text
          style={{
            color: AMBER,
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
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

function Cell({
  flex,
  text,
  muted,
  amber,
  capitalize,
}: {
  flex: number;
  text: string;
  muted?: boolean;
  amber?: boolean;
  capitalize?: boolean;
}) {
  return (
    <Text
      numberOfLines={1}
      style={{
        flex,
        color: amber ? AMBER : muted ? TEXT_SECONDARY : TEXT_PRIMARY,
        fontFamily: amber ? "Inter_600SemiBold" : "Inter_400Regular",
        fontSize: amber ? 13 : 12,
        textTransform: capitalize ? "capitalize" : "none",
      }}
    >
      {text}
    </Text>
  );
}

function SummaryColumn({
  label,
  value,
  color = TEXT_PRIMARY,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: "check-circle";
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
        <Text
          style={{
            color,
            fontFamily: "Inter_700Bold",
            fontSize: 22,
            letterSpacing: -0.5,
          }}
        >
          {value}
        </Text>
        {icon ? (
          <View style={{ marginLeft: 8 }}>
            <Feather name={icon} size={18} color={color} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Approximate transaction counts when the API doesn't yet expose
// per-method counts; we count locally-available rows.
function countByMethod(takeawayCount: number, dineinCount: number, _method: "cash" | "card" | "wallet") {
  // Without payment-method data per order we can't split exactly — render the
  // upper bound (total closed-day transactions). Replace with payment_records
  // aggregation when the endpoint lands.
  return takeawayCount + dineinCount;
}

export default FinanceTill;
