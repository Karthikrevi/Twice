import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";
import { nextStatus } from "@/data/mock";
import type { Order, OrderStatus } from "@/types";

const BG = "#0D0F14";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const URGENT = "#EF4444";
const SUCCESS = "#22C55E";
const BLUE = "#3B82F6";

const DONE_FADE_MS = 30_000;

// TODO: read kitchen_output from /auth/me once the server returns it.
// Default to "screen" until then.
const KITCHEN_OUTPUT: "screen" | "printer" = "screen";

const formatClock = (d: Date) => {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
};

function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

export default function KitchenScreen() {
  const orders = useOrders();
  const tables = useTables();
  const advance = useAdvanceOrderStatus();

  // Clock — ticks every second; also drives time-elapsed + done-fade re-renders.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Track when each order first appeared as done; fade it after 30s.
  const doneAtRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const t = Date.now();
    const map = doneAtRef.current;
    (orders.data ?? []).forEach((o) => {
      if (o.status === "done" && !map.has(o.id)) {
        map.set(o.id, t);
      }
      if (o.status !== "done" && map.has(o.id)) {
        // status reverted somehow — clear the timer
        map.delete(o.id);
      }
    });
  }, [orders.data]);

  const guestsByTable = useMemo(() => {
    const m = new Map<string, number>();
    (tables.data ?? []).forEach((t) => m.set(t.id, t.guests ?? 0));
    return m;
  }, [tables.data]);

  const visible = useMemo(() => {
    const list = orders.data ?? [];
    const t = now.getTime();
    return list.filter((o) => {
      if (o.status !== "done") return true;
      const doneAt = doneAtRef.current.get(o.id) ?? t;
      return t - doneAt < DONE_FADE_MS;
    });
  }, [orders.data, now]);

  if (KITCHEN_OUTPUT === "printer") {
    return <PrinterMode />;
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: BG }}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        <Text
          style={{ color: AMBER, fontFamily: "Inter_600SemiBold", fontSize: 14, letterSpacing: 1.2 }}
        >
          Once — Kitchen
        </Text>
        <Text
          style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium", fontSize: 14 }}
        >
          {formatClock(now)}
        </Text>
      </View>

      {/* Tickets */}
      {orders.isLoading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            Loading tickets…
          </Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_500Medium", fontSize: 16 }}>
            All caught up
          </Text>
          <Text
            style={{
              color: TEXT_MUTED,
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              marginTop: 6,
            }}
          >
            New tickets will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 16,
            alignItems: "stretch",
          }}
        >
          {visible.map((o) => (
            <Ticket
              key={o.id}
              order={o}
              guests={o.tableId ? guestsByTable.get(o.tableId) ?? 0 : 0}
              onAdvance={() =>
                advance.mutate({ id: o.id, status: nextStatus(o.status) })
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PrinterMode() {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: BG }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <Feather name="printer" size={64} color={TEXT_SECONDARY} />
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_700Bold",
            fontSize: 24,
            marginTop: 16,
            letterSpacing: -0.3,
          }}
        >
          Printer Mode
        </Text>
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Orders are printing automatically
        </Text>
        <Text
          style={{
            color: TEXT_MUTED,
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            marginTop: 4,
            textAlign: "center",
          }}
        >
          Check your thermal printer for tickets
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Ticket({
  order,
  guests,
  onAdvance,
}: {
  order: Order;
  guests: number;
  onAdvance: () => void;
}) {
  const mins = minutesSince(order.placedAt);
  const elapsedColor = mins >= 15 ? URGENT : mins >= 10 ? AMBER : TEXT_PRIMARY;
  const isDinein = order.platform === "dinein";
  const isDone = order.status === "done";
  const platformColor = colors.platform[order.platform];

  return (
    <View
      style={{
        width: 260,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: isDone ? SUCCESS + "33" : BORDER,
        borderRadius: 16,
        padding: 16,
        overflow: "hidden",
      }}
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          opacity: isDone ? 0.4 : 1,
        }}
      >
        <View
          style={{
            height: 28,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: platformColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Inter_700Bold",
              fontSize: 12,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {platformLabel[order.platform as PlatformKey]}
          </Text>
        </View>
        <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium", fontSize: 12 }}>
          {order.shortId}
        </Text>
      </View>

      {/* Guests for dine-in */}
      {isDinein ? (
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_500Medium",
            fontSize: 13,
            marginBottom: 8,
            opacity: isDone ? 0.4 : 1,
          }}
        >
          {guests} {guests === 1 ? "Guest" : "Guests"}
        </Text>
      ) : null}

      {/* Items list */}
      <View style={{ marginBottom: 12, opacity: isDone ? 0.4 : 1 }}>
        {order.items.map((it) => (
          <View
            key={it.id}
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                color: platformColor,
                fontFamily: "Inter_700Bold",
                fontSize: 18,
                marginRight: 8,
              }}
            >
              {it.qty}
            </Text>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontFamily: "Inter_600SemiBold",
                fontSize: 18,
                flex: 1,
                letterSpacing: -0.2,
              }}
            >
              {it.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Special instructions */}
      {order.specialInstructions ? (
        <Text
          style={{
            color: platformColor,
            fontFamily: "Inter_500Medium",
            fontSize: 15,
            fontStyle: "italic",
            marginBottom: 12,
            opacity: isDone ? 0.4 : 1,
          }}
        >
          {order.specialInstructions}
        </Text>
      ) : null}

      {/* Time elapsed */}
      <Text
        style={{
          color: elapsedColor,
          fontFamily: "Inter_600SemiBold",
          fontSize: 14,
          marginBottom: 12,
          opacity: isDone ? 0.4 : 1,
        }}
      >
        {mins} {mins === 1 ? "min" : "mins"} ago
      </Text>

      {/* Action buttons */}
      <View style={{ gap: 8, opacity: isDone ? 0.4 : 1 }}>
        <ActionButtons status={order.status} onAdvance={onAdvance} />
      </View>

      {/* DONE stamp overlay */}
      {isDone ? (
        <View
          pointerEvents="none"
          style={{
            ...StyleSheetAbsoluteFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: SUCCESS,
              fontFamily: "Inter_700Bold",
              fontSize: 48,
              letterSpacing: 6,
              transform: [{ rotate: "-15deg" }],
            }}
          >
            DONE
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

function ActionButtons({
  status,
  onAdvance,
}: {
  status: OrderStatus;
  onAdvance: () => void;
}) {
  if (status === "new") {
    return (
      <KitchenButton
        label="PREPARING"
        bg={BLUE}
        onPress={onAdvance}
        textColor="#FFF"
      />
    );
  }
  if (status === "preparing") {
    return (
      <>
        <KitchenButton label="PREPARING ✓" bg={BLUE} textColor="#FFF" disabled withGlow />
        <KitchenButton label="READY" bg={SUCCESS} onPress={onAdvance} textColor="#FFF" />
      </>
    );
  }
  if (status === "ready") {
    return (
      <>
        <KitchenButton label="PREPARING ✓" bg={BORDER} textColor={TEXT_MUTED} disabled />
        <KitchenButton label="READY ✓" bg={SUCCESS} textColor="#FFF" disabled withGlow />
      </>
    );
  }
  // done — render nothing (DONE stamp overlays)
  return null;
}

function KitchenButton({
  label,
  bg,
  textColor,
  onPress,
  disabled,
  withGlow,
}: {
  label: string;
  bg: string;
  textColor: string;
  onPress?: () => void;
  disabled?: boolean;
  withGlow?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.85}
      disabled={disabled || !onPress}
      style={{
        height: 44,
        borderRadius: 12,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        ...(withGlow
          ? {
              shadowColor: bg,
              shadowOpacity: 0.55,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
              elevation: 4,
            }
          : {}),
      }}
    >
      <Text
        style={{
          color: textColor,
          fontFamily: "Inter_700Bold",
          fontSize: 14,
          letterSpacing: 1.2,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
