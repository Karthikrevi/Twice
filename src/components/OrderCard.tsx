import { Text, TouchableOpacity, View } from "react-native";
import { PlatformBadge } from "@/components/ui/Badge";
import { colors } from "@/theme/colors";
import { minutesSince } from "@/data/mock";
import type { Order, OrderStatus } from "@/types";

const statusLabel: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  done: "Done",
};
const statusColor: Record<OrderStatus, string> = {
  new: colors.amber,
  preparing: colors.platform.dinein,
  ready: colors.status.available,
  done: colors.text.muted,
};

interface Props {
  order: Order;
  onAdvance?: () => void;
  hideTotals?: boolean;
}

export function OrderCard({ order, onAdvance, hideTotals }: Props) {
  const mins = minutesSince(order.placedAt);
  const urgent = mins >= 15;
  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <PlatformBadge platform={order.platform} />
          <Text className="text-text-secondary ml-2 text-[12px] font-medium">{order.shortId}</Text>
        </View>
        <Text
          style={{ color: urgent ? colors.status.urgent : colors.text.secondary }}
          className="text-[12px] font-semibold"
        >
          {mins}m ago
        </Text>
      </View>

      {order.customerName || order.tableId ? (
        <Text className="text-text-primary text-[14px] font-semibold mb-2">
          {order.tableId ? `Table ${order.tableId.toUpperCase()}` : order.customerName}
        </Text>
      ) : null}

      <View className="mb-3">
        {order.items.map((it) => (
          <View key={it.id} className="flex-row justify-between mb-1">
            <Text className="text-text-primary text-[14px] flex-1">
              <Text className="text-text-secondary">{it.qty}× </Text>
              {it.name}
            </Text>
            {!hideTotals ? (
              <Text className="text-text-secondary text-[13px] ml-3">AED {it.price * it.qty}</Text>
            ) : null}
          </View>
        ))}
      </View>

      {order.specialInstructions ? (
        <View className="bg-surfaceActive rounded-lg px-3 py-2 mb-3 border-l-2 border-amber">
          <Text className="text-text-secondary text-[12px] uppercase tracking-wider mb-0.5">Note</Text>
          <Text className="text-text-primary text-[13px]">{order.specialInstructions}</Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between pt-3 border-t border-border">
        <View className="flex-row items-center">
          <View
            className="px-2.5 rounded-full flex-row items-center"
            style={{ backgroundColor: statusColor[order.status] + "22", height: 26 }}
          >
            <View
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor[order.status] }}
            />
            <Text style={{ color: statusColor[order.status] }} className="ml-1.5 text-[11px] font-bold uppercase">
              {statusLabel[order.status]}
            </Text>
          </View>
          {!hideTotals ? (
            <Text className="text-text-primary ml-3 font-bold text-[15px]">AED {order.total}</Text>
          ) : null}
        </View>
        {onAdvance && order.status !== "done" ? (
          <TouchableOpacity
            onPress={onAdvance}
            activeOpacity={0.8}
            className="bg-amber px-4 rounded-lg flex-row items-center"
            style={{ minHeight: 36 }}
          >
            <Text className="text-black font-semibold text-[12px]">Mark {nextLabel(order.status)}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function nextLabel(s: OrderStatus): string {
  return s === "new" ? "Preparing" : s === "preparing" ? "Ready" : "Done";
}
