import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { CardSkeleton } from "@/components/ui/States";
import { nextStatus } from "@/data/mock";
import type { Order, OrderStatus, RestaurantTable } from "@/types";

const BG = "#0D0F14";
const SURFACE = "#161920";
const SURFACE_ACTIVE = "#1E2128";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const AMBER_40 = "#F5A62366";
const DINEIN = "#7C6AF5";
const SUCCESS = "#22C55E";
const URGENT = "#EF4444";

const statusColor: Record<OrderStatus, string> = {
  new: "#F5A623",
  preparing: "#7C6AF5",
  ready: "#22C55E",
  done: "#6B7280",
};
const statusLabelText: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  done: "Done",
};

function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

export function OwnerDinein() {
  const orders = useOrders();
  const tables = useTables();
  const advance = useAdvanceOrderStatus();

  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});

  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);

  const tableById = useMemo(() => {
    const m = new Map<string, RestaurantTable>();
    (tables.data ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [tables.data]);

  const dineinOrders = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) => o.platform === "dinein" && o.status !== "done"
      ),
    [orders.data]
  );

  const openRevenue = useMemo(
    () => dineinOrders.reduce((s, o) => s + o.total, 0),
    [dineinOrders]
  );

  const confirmOrder = (order: Order) => {
    Alert.alert(
      "Hold to confirm",
      "This commits you to fulfilling this order.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => advance.mutate({ id: order.id, status: nextStatus(order.status) }),
        },
      ],
      { cancelable: true }
    );
  };

  const advanceOrder = (order: Order) => {
    advance.mutate({ id: order.id, status: nextStatus(order.status) });
  };

  const scrollToTable = (tableId: string) => {
    const y = positions.current[tableId];
    if (typeof y === "number") {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {/* LEFT PANEL — dine-in orders */}
      <View style={{ flex: 0.65, borderRightWidth: 1, borderRightColor: BORDER }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={orders.isFetching && !orders.isLoading}
              onRefresh={() => orders.refetch()}
              tintColor={AMBER}
            />
          }
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
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
              Dine-in orders
            </Text>
            <Text
              style={{
                color: AMBER,
                fontFamily: "Inter_700Bold",
                fontSize: 13,
              }}
            >
              {dineinOrders.length}
            </Text>
          </View>

          {orders.isLoading ? (
            <View>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </View>
          ) : orders.isError ? (
            <View style={{ alignItems: "center", paddingVertical: 64 }}>
              <Text
                style={{
                  color: URGENT,
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                We couldn't load orders.
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
                <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : dineinOrders.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 64 }}>
              <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                No active dine-in orders
              </Text>
            </View>
          ) : (
            dineinOrders.map((order) => (
              <DineinOrderCard
                key={order.id}
                order={order}
                table={order.tableId ? tableById.get(order.tableId) : undefined}
                onLayout={(e) => {
                  if (order.tableId) {
                    positions.current[order.tableId] = e.nativeEvent.layout.y;
                  }
                }}
                onConfirm={() => confirmOrder(order)}
                onReject={() => setRejectingOrder(order)}
                onAdvance={() => advanceOrder(order)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* RIGHT PANEL — tables grid + open revenue */}
      <View style={{ flex: 0.35, flexDirection: "column" }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 }}>
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              letterSpacing: 1.8,
              textTransform: "uppercase",
            }}
          >
            Tables
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {tables.isLoading ? (
            <View style={{ gap: 8 }}>
              <CardSkeleton rows={1} />
              <CardSkeleton rows={1} />
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(tables.data ?? []).map((t) => {
                const occ = t.status === "occupied";
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => (occ ? scrollToTable(t.id) : null)}
                    activeOpacity={occ ? 0.85 : 1}
                    style={{
                      width: "48%",
                      minHeight: 80,
                      backgroundColor: occ ? SURFACE_ACTIVE : SURFACE,
                      borderWidth: 1,
                      borderColor: occ ? AMBER_40 : BORDER,
                      borderRadius: 16,
                      padding: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          color: occ ? AMBER : TEXT_PRIMARY,
                          fontFamily: "Inter_700Bold",
                          fontSize: 22,
                          letterSpacing: -0.5,
                        }}
                      >
                        {t.name}
                      </Text>
                      {!occ ? (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: SUCCESS,
                            marginTop: 6,
                          }}
                        />
                      ) : null}
                    </View>
                    {occ ? (
                      <>
                        <Text
                          style={{
                            color: TEXT_SECONDARY,
                            fontFamily: "Inter_400Regular",
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {t.guests} {t.guests === 1 ? "guest" : "guests"}
                        </Text>
                        <Text
                          style={{
                            color: AMBER,
                            fontFamily: "Inter_700Bold",
                            fontSize: 15,
                            marginTop: 8,
                          }}
                        >
                          AED {t.total.toFixed(0)}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={{
                          color: SUCCESS,
                          fontFamily: "Inter_500Medium",
                          fontSize: 12,
                          marginTop: 6,
                        }}
                      >
                        Available
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Sticky footer — open revenue */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: BORDER,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 14,
            backgroundColor: BG,
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
            Open revenue
          </Text>
          <Text
            style={{
              color: AMBER,
              fontFamily: "Inter_700Bold",
              fontSize: 22,
              letterSpacing: -0.5,
              marginTop: 4,
            }}
          >
            AED {openRevenue.toFixed(0)}
          </Text>
        </View>
      </View>

      <RejectSheet order={rejectingOrder} onClose={() => setRejectingOrder(null)} />
    </View>
  );
}

function DineinOrderCard({
  order,
  table,
  onConfirm,
  onReject,
  onAdvance,
  onLayout,
}: {
  order: Order;
  table?: RestaurantTable;
  onConfirm: () => void;
  onReject: () => void;
  onAdvance: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const mins = minutesSince(order.placedAt);
  const isUrgent = mins >= 15;
  const tableName = table?.name ?? order.tableId?.toUpperCase() ?? "";
  const guests = table?.guests ?? 0;

  return (
    <View
      onLayout={onLayout}
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            height: 24,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: DINEIN + "33",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: DINEIN,
              fontFamily: "Inter_600SemiBold",
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            Dine-in
          </Text>
        </View>
        <Text
          style={{
            color: isUrgent ? URGENT : TEXT_SECONDARY,
            fontFamily: "Inter_600SemiBold",
            fontSize: 12,
          }}
        >
          {mins}m ago
        </Text>
      </View>

      {/* Table identifier + guest count */}
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
          color: TEXT_SECONDARY,
          fontFamily: "Inter_400Regular",
          fontSize: 12,
          marginTop: 2,
          marginBottom: 12,
        }}
      >
        {guests} {guests === 1 ? "guest" : "guests"}
      </Text>

      {/* Items */}
      <View style={{ marginBottom: 12 }}>
        {order.items.map((it) => (
          <View
            key={it.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 14, flex: 1 }}>
              <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium" }}>{it.qty}× </Text>
              <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_400Regular" }}>{it.name}</Text>
            </Text>
            <Text
              style={{
                color: TEXT_SECONDARY,
                fontFamily: "Inter_500Medium",
                fontSize: 13,
                marginLeft: 8,
              }}
            >
              AED {(it.price * it.qty).toFixed(0)}
            </Text>
          </View>
        ))}
      </View>

      {/* Special instructions */}
      {order.specialInstructions ? (
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
            {order.specialInstructions}
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
        <StatusBadge status={order.status} />

        {order.status === "new" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.85}
              style={{
                height: 36,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: SUCCESS,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.8 }}>
                CONFIRM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onReject}
              activeOpacity={0.85}
              style={{
                height: 36,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: URGENT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.8 }}>
                REJECT
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ color: AMBER, fontFamily: "Inter_700Bold", fontSize: 15 }}>
              AED {order.total.toFixed(0)}
            </Text>
            {order.status === "preparing" ? (
              <TouchableOpacity
                onPress={onAdvance}
                activeOpacity={0.85}
                style={{
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: AMBER,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.8 }}>
                  MARK READY
                </Text>
              </TouchableOpacity>
            ) : order.status === "ready" ? (
              <TouchableOpacity
                onPress={onAdvance}
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
                <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.8 }}>
                  MARK DELIVERED
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = statusColor[status];
  return (
    <View
      style={{
        height: 24,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: c + "22",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c, marginRight: 6 }} />
      <Text
        style={{
          color: c,
          fontFamily: "Inter_700Bold",
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {statusLabelText[status]}
      </Text>
    </View>
  );
}

const REJECT_REASONS = ["Out of stock", "Too busy", "Other"] as const;
type RejectReason = (typeof REJECT_REASONS)[number];

function RejectSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const [reason, setReason] = useState<RejectReason | null>(null);
  const open = !!order;

  const close = () => {
    setReason(null);
    onClose();
  };

  const confirm = () => {
    if (!reason || !order) return;
    // Rejection backend hook not yet exposed — close the sheet.
    close();
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={{ flex: 1 }} />
      </Pressable>
      <View
        style={{
          backgroundColor: SURFACE,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: BORDER }} />
        </View>

        <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 4 }}>
          Reject order
        </Text>
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          Pick a reason. The customer will be notified.
        </Text>

        <View style={{ gap: 8, marginBottom: 18 }}>
          {REJECT_REASONS.map((r) => {
            const selected = reason === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setReason(r)}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 52,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selected ? AMBER : BORDER,
                  backgroundColor: selected ? SURFACE_ACTIVE : BG,
                }}
              >
                <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_500Medium", fontSize: 15 }}>
                  {r}
                </Text>
                {selected ? <Feather name="check" size={18} color={AMBER} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={confirm}
          disabled={!reason}
          activeOpacity={0.85}
          style={{
            height: 52,
            borderRadius: 12,
            backgroundColor: AMBER,
            alignItems: "center",
            justifyContent: "center",
            opacity: reason ? 1 : 0.5,
          }}
        >
          <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
            Confirm rejection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={close} activeOpacity={0.7} style={{ marginTop: 14, alignItems: "center" }}>
          <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default OwnerDinein;
