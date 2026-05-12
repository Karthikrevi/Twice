import { useMemo } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { ListSkeleton } from "@/components/ui/States";
import { RoleGate } from "@/components/RoleGate";
import { nextStatus } from "@/data/mock";
import type { OrderStatus, RestaurantTable } from "@/types";

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
const DINEIN = "#7C6AF5";

const STATUS_COLOR: Record<OrderStatus, string> = {
  new: "#F5A623",
  preparing: "#7C6AF5",
  ready: "#22C55E",
  done: "#6B7080",
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  done: "Done",
};

function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

export function WaiterOrders() {
  const orders = useOrders();
  const tables = useTables();
  const advance = useAdvanceOrderStatus();

  const tableById = useMemo(() => {
    const m = new Map<string, RestaurantTable>();
    (tables.data ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [tables.data]);

  // Only dine-in orders for currently-occupied tables.
  const visible = useMemo(() => {
    const occupiedIds = new Set(
      (tables.data ?? []).filter((t) => t.status === "occupied").map((t) => t.id)
    );
    return (orders.data ?? []).filter(
      (o) => o.platform === "dinein" && o.tableId && occupiedIds.has(o.tableId) && o.status !== "done"
    );
  }, [orders.data, tables.data]);

  if (orders.isLoading || tables.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, paddingHorizontal: 20, paddingTop: 16 }}>
        <ListSkeleton count={4} />
      </View>
    );
  }

  if (orders.isError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <Text style={{ color: URGENT, fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 16 }}>
          We couldn't load your tables' orders.
        </Text>
        <TouchableOpacity
          onPress={() => orders.refetch()}
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
    <FlatList
      data={visible}
      keyExtractor={(o) => o.id}
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={orders.isFetching && !orders.isLoading}
          onRefresh={() => orders.refetch()}
          tintColor={AMBER}
        />
      }
      ListEmptyComponent={
        <View style={{ alignItems: "center", paddingVertical: 64 }}>
          <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            No active orders on your tables.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const table = item.tableId ? tableById.get(item.tableId) : undefined;
        const tableName = table?.name ?? item.tableId?.toUpperCase() ?? "";
        const mins = minutesSince(item.placedAt);
        const urgent = mins >= 15;
        return (
          <View
            style={{
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: DINEIN,
                  fontFamily: "Inter_700Bold",
                  fontSize: 18,
                  letterSpacing: -0.3,
                }}
              >
                Table {tableName}
              </Text>
              <Text
                style={{
                  color: urgent ? URGENT : TEXT_SECONDARY,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                }}
              >
                {mins}m ago
              </Text>
            </View>

            {/* Items */}
            <View style={{ marginBottom: 12 }}>
              {item.items.map((it) => (
                <View
                  key={it.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>
                    <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium" }}>
                      {it.qty}×{" "}
                    </Text>
                    <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_400Regular" }}>
                      {it.name}
                    </Text>
                  </Text>
                </View>
              ))}
            </View>

            {item.specialInstructions ? (
              <View
                style={{
                  backgroundColor: SURFACE_ACTIVE,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 12,
                  borderLeftWidth: 2,
                  borderLeftColor: AMBER,
                }}
              >
                <Text
                  style={{
                    color: TEXT_SECONDARY,
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  Note
                </Text>
                <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                  {item.specialInstructions}
                </Text>
              </View>
            ) : null}

            {/* Bottom row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: BORDER,
              }}
            >
              <View
                style={{
                  height: 24,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: STATUS_COLOR[item.status] + "22",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: STATUS_COLOR[item.status],
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    color: STATUS_COLOR[item.status],
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>

              {/* Order total hidden for waiter — RoleGate keeps it off */}
              <RoleGate roles={["owner", "manager", "kitchen"]}>
                <Text
                  style={{
                    color: TEXT_PRIMARY,
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                  }}
                >
                  AED {item.total.toFixed(0)}
                </Text>
              </RoleGate>

              {item.status === "ready" ? (
                <TouchableOpacity
                  onPress={() =>
                    advance.mutate({ id: item.id, status: nextStatus(item.status) })
                  }
                  activeOpacity={0.85}
                  style={{
                    height: 36,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: SUCCESS,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#000",
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 12,
                      letterSpacing: 0.8,
                    }}
                  >
                    MARK DELIVERED
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      }}
    />
  );
}

export default WaiterOrders;
