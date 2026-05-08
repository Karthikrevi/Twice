import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View, FlatList } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { OrderCard } from "@/components/OrderCard";
import { mockOrders, nextStatus } from "@/data/mock";
import { useSession } from "@/store/session";
import type { Order } from "@/types";

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>(mockOrders.filter((o) => o.status !== "done"));
  const signOut = useSession((s) => s.signOut);

  const counts = useMemo(
    () => ({
      n: orders.filter((o) => o.status === "new").length,
      p: orders.filter((o) => o.status === "preparing").length,
      r: orders.filter((o) => o.status === "ready").length,
    }),
    [orders]
  );

  const advance = (id: string) =>
    setOrders((arr) => arr.map((o) => (o.id === id ? { ...o, status: nextStatus(o.status) } : o)));

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <Screen
      title="Kitchen"
      subtitle={`${counts.n} new · ${counts.p} preparing · ${counts.r} ready`}
      right={
        <TouchableOpacity onPress={logout} className="bg-surface border border-border rounded-lg px-3" style={{ height: 32, justifyContent: "center" }}>
          <Text className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">Sign out</Text>
        </TouchableOpacity>
      }
    >
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <OrderCard order={item} onAdvance={() => advance(item.id)} hideTotals />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-text-muted">All caught up.</Text>
          </View>
        }
      />
    </Screen>
  );
}
