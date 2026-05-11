import { Text, TouchableOpacity, View, FlatList } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { ListSkeleton, ErrorState, EmptyState } from "@/components/ui/States";
import { useMenu, useAdjustStock } from "@/hooks/useMenu";
import { colors } from "@/theme/colors";

export function InventoryScreen() {
  const { data: items, isLoading, isError, refetch, isFetching } = useMenu();
  const adjust = useAdjustStock();

  const lowCount = (items ?? []).filter((i) => i.stock <= i.lowStockThreshold).length;
  const outCount = (items ?? []).filter((i) => i.stock === 0).length;

  const change = (id: string, current: number, delta: number) =>
    adjust.mutate({ id, quantity: Math.max(0, current + delta) });

  return (
    <Screen
      title="Stock"
      subtitle={`${items?.length ?? 0} items · ${lowCount} low · ${outCount} out`}
      right={
        outCount > 0 ? (
          <View
            className="bg-status-urgent/20 border border-status-urgent/40 rounded-lg px-2.5"
            style={{ height: 32, justifyContent: "center" }}
          >
            <Text
              style={{ color: colors.status.urgent }}
              className="font-bold text-[11px] uppercase tracking-wider"
            >
              {outCount} paused
            </Text>
          </View>
        ) : null
      }
    >
      {isLoading ? (
        <ListSkeleton count={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={isFetching && !isLoading}
          onRefresh={() => refetch()}
          ListEmptyComponent={<EmptyState title="No menu items" hint="Add dishes in Menu to track stock." glyph="▤" />}
          renderItem={({ item }) => {
            const out = item.stock === 0;
            const low = !out && item.stock <= item.lowStockThreshold;
            const dotColor = out ? colors.status.urgent : low ? colors.status.occupied : colors.status.available;
            return (
              <View className="bg-surface border border-border rounded-2xl p-4 mb-3 flex-row items-center">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1.5">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
                    <Text className="text-text-primary font-semibold text-[15px] ml-2">{item.name}</Text>
                  </View>
                  <Text className="text-text-secondary text-[12px]">
                    AED {item.price} · {item.category} · alert ≤ {item.lowStockThreshold}
                  </Text>
                  {out ? (
                    <Text className="text-status-urgent text-[11px] mt-1.5 font-semibold uppercase tracking-wider">
                      Auto-paused on platforms
                    </Text>
                  ) : null}
                </View>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => change(item.id, item.stock, -1)}
                    className="bg-surfaceActive border border-border items-center justify-center rounded-lg"
                    style={{ width: 40, height: 40 }}
                  >
                    <Text className="text-amber text-[20px] font-bold">−</Text>
                  </TouchableOpacity>
                  <View style={{ minWidth: 44 }} className="items-center">
                    <Text className="text-text-primary text-[22px] font-bold">{item.stock}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => change(item.id, item.stock, 1)}
                    className="bg-surfaceActive border border-border items-center justify-center rounded-lg"
                    style={{ width: 40, height: 40 }}
                  >
                    <Text className="text-amber text-[20px] font-bold">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
