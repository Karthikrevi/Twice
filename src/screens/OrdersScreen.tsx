import { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { OrderCard } from "@/components/OrderCard";
import { ListSkeleton, ErrorState, EmptyState } from "@/components/ui/States";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { useSession } from "@/store/session";
import { nextStatus } from "@/data/mock";
import type { OrderStatus } from "@/types";

const filters: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
];

export function OrdersScreen({ hideTotals = false }: { hideTotals?: boolean } = {}) {
  const role = useSession((s) => s.user?.role);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const { data: orders, isLoading, isError, refetch, isFetching } = useOrders();
  const advance = useAdvanceOrderStatus();

  const visible = useMemo(() => {
    if (!orders) return [];
    let arr = orders;
    if (role === "waiter") arr = arr.filter((o) => o.platform === "dinein");
    if (filter !== "all") arr = arr.filter((o) => o.status === filter);
    return arr;
  }, [orders, role, filter]);

  const counts = useMemo(() => {
    const base = { all: orders?.length ?? 0, new: 0, preparing: 0, ready: 0 };
    (orders ?? []).forEach((o) => {
      if (o.status in base) (base as any)[o.status]++;
    });
    return base;
  }, [orders]);

  const canAdvance = role === "owner" || role === "manager";

  return (
    <Screen
      title="Orders"
      subtitle={`${counts.new} new · ${counts.preparing} preparing · ${counts.ready} ready`}
      right={
        <View className="bg-surface border border-border rounded-lg flex-row items-center px-2.5" style={{ height: 32 }}>
          <View className="w-1.5 h-1.5 rounded-full bg-status-available mr-1.5" />
          <Text className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">
            {isFetching ? "Syncing" : "Live"}
          </Text>
        </View>
      }
    >
      <View className="flex-row gap-2 mb-4">
        {filters.map((f) => {
          const active = filter === f.key;
          const count = (counts as any)[f.key] ?? 0;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.85}
              className={`px-3 rounded-full flex-row items-center border ${
                active ? "bg-amber border-amber" : "bg-surface border-border"
              }`}
              style={{ height: 36 }}
            >
              <Text className={`font-semibold text-[12px] ${active ? "text-black" : "text-text-primary"}`}>
                {f.label}
              </Text>
              <Text className={`ml-1.5 text-[12px] ${active ? "text-black/70" : "text-text-muted"}`}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <ListSkeleton count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              hideTotals={hideTotals}
              onAdvance={
                canAdvance && item.status !== "done"
                  ? () => advance.mutate({ id: item.id, status: nextStatus(item.status) })
                  : undefined
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={isFetching && !isLoading}
          onRefresh={() => refetch()}
          ListEmptyComponent={
            <EmptyState
              title="No orders right now"
              hint={filter === "all" ? "New orders will appear here in real time." : "Try a different filter."}
              glyph="◧"
            />
          }
        />
      )}
    </Screen>
  );
}
