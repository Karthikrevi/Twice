import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View, FlatList } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { mockMenu } from "@/data/mock";
import type { MenuItem } from "@/types";
import { colors } from "@/theme/colors";

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>(mockMenu);
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const [active, setActive] = useState<string>(categories[0] ?? "");

  const visible = items.filter((i) => i.category === active);

  const toggle = (id: string) =>
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, available: !it.available } : it)));

  return (
    <Screen
      title="Menu"
      subtitle={`${items.length} dishes · syncs to platforms on toggle`}
      right={
        <TouchableOpacity
          activeOpacity={0.85}
          className="bg-amber rounded-lg px-3 flex-row items-center"
          style={{ height: 32 }}
        >
          <Text className="text-black font-semibold text-[12px]">+ New dish</Text>
        </TouchableOpacity>
      }
    >
      <View className="flex-row gap-2 mb-4">
        {categories.map((c) => {
          const a = c === active;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setActive(c)}
              activeOpacity={0.85}
              className={`px-3 rounded-full border ${a ? "bg-amber border-amber" : "bg-surface border-border"}`}
              style={{ height: 36, justifyContent: "center" }}
            >
              <Text className={`font-semibold text-[12px] ${a ? "text-black" : "text-text-primary"}`}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="bg-surface border border-border rounded-2xl p-4 mb-3 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-text-primary font-semibold text-[15px]">{item.name}</Text>
              <Text className="text-text-secondary text-[12px] mt-1">
                AED {item.price} · {item.stock} in stock
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => toggle(item.id)}
              activeOpacity={0.8}
              className="rounded-full p-1 border"
              style={{
                width: 56,
                height: 32,
                backgroundColor: item.available ? colors.amber : colors.surfaceActive,
                borderColor: item.available ? colors.amber : colors.border,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: item.available ? "#000" : colors.text.muted,
                  alignSelf: item.available ? "flex-end" : "flex-start",
                }}
              />
            </TouchableOpacity>
          </View>
        )}
      />
    </Screen>
  );
}
