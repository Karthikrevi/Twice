import { useMemo } from "react";
import { Text, TouchableOpacity, View, FlatList } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { OrderCard } from "@/components/OrderCard";
import { ListSkeleton, ErrorState, EmptyState } from "@/components/ui/States";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { logout } from "@/hooks/useAuth";
import { nextStatus } from "@/data/mock";

export function KitchenScreen() {
  const { data: all, isLoading, isError, refetch, isFetching } = useOrders();
  const advance = useAdvanceOrderStatus();

  const orders = useMemo(() => (all ?? []).filter((o) => o.status !== "done"), [all]);
  const counts = useMemo(
    () => ({
      n: orders.filter((o) => o.status === "new").length,
      p: orders.filter((o) => o.status === "preparing").length,
      r: orders.filter((o) => o.status === "ready").length,
    }),
    [orders]
  );

  return (
    <Screen
      title="Kitchen"
      subtitle={`${counts.n} new · ${counts.p} preparing · ${counts.r} ready`}
      right={
        <TouchableOpacity
          onPress={logout}
          className="bg-surface border border-border rounded-lg px-3"
          style={{ height: 32, justifyContent: "center" }}
        >
          <Text className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">Sign out</Text>
        </TouchableOpacity>
      }
    >
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={isFetching && !isLoading}
          onRefresh={() => refetch()}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <OrderCard
                order={item}
                hideTotals
                onAdvance={() => advance.mutate({ id: item.id, status: nextStatus(item.status) })}
              />
            </View>
          )}
          ListEmptyComponent={<EmptyState title="All caught up" hint="New tickets will appear here." glyph="◧" />}
        />
      )}
    </Screen>
  );
}
