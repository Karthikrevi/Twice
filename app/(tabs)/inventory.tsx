import { useState } from "react";
import { Text, TouchableOpacity, View, FlatList } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { mockMenu } from "@/data/mock";
import { colors } from "@/theme/colors";
import type { MenuItem } from "@/types";

export default function Inventory() {
  const [items, setItems] = useState<MenuItem[]>(mockMenu);

  const lowCount = items.filter((i) => i.stock <= i.lowStockThreshold).length;
  const outCount = items.filter((i) => i.stock === 0).length;

  const adjust = (id: string, delta: number) =>
    setItems((arr) =>
      arr.map((it) => (it.id === id ? { ...it, stock: Math.max(0, it.stock + delta) } : it))
    );

  return (
    <Screen
      title="Stock"
      subtitle={`${items.length} items · ${lowCount} low · ${outCount} out`}
      right={
        outCount > 0 ? (
          <View className="bg-status-urgent/20 border border-status-urgent/40 rounded-lg px-2.5" style={{ height: 32, justifyContent: "center" }}>
            <Text style={{ color: colors.status.urgent }} className="font-bold text-[11px] uppercase tracking-wider">
              {outCount} paused
            </Text>
          </View>
        ) : null
      }
    >
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
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
                  onPress={() => adjust(item.id, -1)}
                  className="bg-surfaceActive border border-border items-center justify-center rounded-lg"
                  style={{ width: 40, height: 40 }}
                >
                  <Text className="text-amber text-[20px] font-bold">−</Text>
                </TouchableOpacity>
                <View style={{ minWidth: 44 }} className="items-center">
                  <Text className="text-text-primary text-[22px] font-bold">{item.stock}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => adjust(item.id, 1)}
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
    </Screen>
  );
}
