import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { StepShell } from "./StepShell";
import { useOnboarding, type MenuDraft } from "@/store/onboarding";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function Step4Menu() {
  const { menu, addMenuItem, removeMenuItem, next } = useOnboarding();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const canAdd = name.trim() && Number(price) > 0 && Number(stock) >= 0;

  const add = () => {
    if (!canAdd) return;
    const item: MenuDraft = {
      id: Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      price: Number(price),
      stock: Number(stock),
    };
    addMenuItem(item);
    setName("");
    setPrice("");
    setStock("");
  };

  return (
    <StepShell
      step={4}
      title="Add your menu"
      subtitle="At least one item to continue. You can add more anytime in Menu."
      onNext={next}
      nextDisabled={menu.length === 0}
    >
      <Card>
        <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mb-3">
          New dish
        </Text>
        <View className="gap-3">
          <Input placeholder="Dish name" value={name} onChangeText={setName} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input placeholder="Price (AED)" value={price} onChangeText={setPrice} keyboardType="numeric" />
            </View>
            <View className="flex-1">
              <Input placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />
            </View>
          </View>
          <TouchableOpacity
            onPress={add}
            disabled={!canAdd}
            activeOpacity={0.8}
            className={`rounded-xl items-center justify-center border-2 border-dashed ${
              canAdd ? "border-amber" : "border-border opacity-50"
            }`}
            style={{ height: 48 }}
          >
            <Text className={`font-semibold ${canAdd ? "text-amber" : "text-text-muted"}`}>+ Add to menu</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mt-6 mb-2">
        Menu ({menu.length})
      </Text>
      {menu.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-muted text-[13px]">No dishes yet</Text>
        </View>
      ) : (
        menu.map((m) => (
          <View
            key={m.id}
            className="bg-surface border border-border rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
          >
            <View className="flex-1">
              <Text className="text-text-primary font-semibold text-[15px]">{m.name}</Text>
              <Text className="text-text-secondary text-[12px] mt-0.5">
                AED {m.price} · {m.stock} in stock
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeMenuItem(m.id)} hitSlop={10}>
              <Text className="text-status-urgent text-[13px] font-semibold">Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </StepShell>
  );
}
