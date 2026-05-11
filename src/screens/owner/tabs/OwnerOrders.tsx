import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { ListSkeleton } from "@/components/ui/States";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";
import { nextStatus } from "@/data/mock";
import type { Order, OrderStatus } from "@/types";

const SURFACE = "#161920";
const SURFACE_ACTIVE = "#1E2128";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const SUCCESS = "#22C55E";
const URGENT = "#EF4444";

const statusColor: Record<OrderStatus, string> = {
  new: "#F5A623",
  preparing: "#7C6AF5",
  ready: "#22C55E",
  done: "#6B7280",
};

const statusLabel: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  done: "Done",
};

function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

export function OwnerOrders() {
  const orders = useOrders();
  const advance = useAdvanceOrderStatus();
  const { width, height } = useWindowDimensions();
  const isTabletLandscape = width >= 900 && width > height;
  const numColumns = isTabletLandscape ? 3 : 1;

  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);

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

  if (orders.isLoading) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <ListSkeleton count={6} />
      </View>
    );
  }

  if (orders.isError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 32 }}>
        <Text style={{ color: URGENT, fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
          We couldn't load orders. Check your connection.
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
    <>
      <FlatList
        key={`cols-${numColumns}`}
        data={orders.data ?? []}
        keyExtractor={(o) => o.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshing={orders.isFetching && !orders.isLoading}
        onRefresh={() => orders.refetch()}
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? { flex: 1 / numColumns } : undefined}>
            <OrderCard
              order={item}
              onConfirm={() => confirmOrder(item)}
              onReject={() => setRejectingOrder(item)}
              onAdvance={() => advanceOrder(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
              No orders yet
            </Text>
          </View>
        }
      />

      <RejectSheet
        order={rejectingOrder}
        onClose={() => setRejectingOrder(null)}
      />
    </>
  );
}

function OrderCard({
  order,
  onConfirm,
  onReject,
  onAdvance,
}: {
  order: Order;
  onConfirm: () => void;
  onReject: () => void;
  onAdvance: () => void;
}) {
  const mins = minutesSince(order.placedAt);
  const isUrgent = mins >= 15;
  const isDinein = order.platform === "dinein";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Top row: platform badge + time elapsed */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <PlatformPill platform={order.platform} />
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

      {/* Customer or table */}
      {(order.tableId || order.customerName) && (
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          {order.tableId ? `Table ${order.tableId.toUpperCase()}` : order.customerName}
        </Text>
      )}

      {/* Items list */}
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

      {/* Bottom row: status + total + action */}
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
            <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_700Bold", fontSize: 15 }}>
              AED {order.total.toFixed(0)}
            </Text>
            {order.status === "preparing" ? (
              <ActionButton label="MARK READY" color={AMBER} textColor="#000" onPress={onAdvance} />
            ) : order.status === "ready" ? (
              isDinein ? (
                <ActionButton label="MARK DELIVERED" color={SUCCESS} textColor="#000" onPress={onAdvance} />
              ) : (
                <ActionButton label="PACK" color={AMBER} textColor="#000" onPress={onAdvance} />
              )
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function PlatformPill({ platform }: { platform: PlatformKey }) {
  const c = colors.platform[platform];
  return (
    <View
      style={{
        height: 24,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: c + "33",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: c,
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {platformLabel[platform]}
      </Text>
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
        {statusLabel[status]}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  color,
  textColor,
  onPress,
}: {
  label: string;
  color: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: textColor, fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.8 }}>
        {label}
      </Text>
    </TouchableOpacity>
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
    // Rejection backend hook not yet available — close the sheet.
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

        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_700Bold",
            fontSize: 20,
            marginBottom: 4,
          }}
        >
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
                  backgroundColor: selected ? SURFACE_ACTIVE : "#0D0F14",
                }}
              >
                <Text
                  style={{
                    color: TEXT_PRIMARY,
                    fontFamily: "Inter_500Medium",
                    fontSize: 15,
                  }}
                >
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

export default OwnerOrders;
