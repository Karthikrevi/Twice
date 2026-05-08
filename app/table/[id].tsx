import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { mockTables, mockMenu } from "@/data/mock";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors } from "@/theme/colors";
import type { OrderItem } from "@/types";

export default function TableDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const original = mockTables.find((t) => t.id === id) ?? mockTables[0];

  const [guests, setGuests] = useState(Math.max(1, original.guests || 2));
  const [items, setItems] = useState<OrderItem[]>(original.items);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);

  const addFromMenu = (m: (typeof mockMenu)[number]) => {
    setItems((arr) => {
      const existing = arr.find((i) => i.name === m.name);
      if (existing) return arr.map((i) => (i.id === existing.id ? { ...i, qty: i.qty + 1 } : i));
      return [...arr, { id: Math.random().toString(36).slice(2, 9), name: m.name, qty: 1, price: m.price }];
    });
  };

  const dec = (id: string) =>
    setItems((arr) =>
      arr
        .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg">
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text className="text-text-secondary text-[14px]">‹ Tables</Text>
        </TouchableOpacity>
        <View className="flex-row items-center bg-surfaceActive rounded-full px-3" style={{ height: 28 }}>
          <View className="w-1.5 h-1.5 rounded-full bg-status-occupied mr-2" />
          <Text className="text-text-primary text-[11px] font-semibold uppercase">Occupied</Text>
        </View>
      </View>

      <View className="px-5 pb-3">
        <Text className="text-text-primary text-[34px] font-bold tracking-tight">{original.name}</Text>
        <Text className="text-text-secondary text-[13px] mt-0.5">Open since {original.openedAt ? "20m" : "now"}</Text>
      </View>

      <View className="px-5">
        <Card>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-text-secondary text-[11px] uppercase tracking-wider">Guests</Text>
              <Text className="text-text-primary text-[26px] font-bold mt-0.5">{guests}</Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setGuests((g) => Math.max(1, g - 1))}
                className="bg-surfaceActive border border-border rounded-xl items-center justify-center"
                style={{ width: 48, height: 48 }}
              >
                <Text className="text-amber text-[22px] font-bold">−</Text>
              </TouchableOpacity>
              <View className="w-3" />
              <TouchableOpacity
                onPress={() => setGuests((g) => g + 1)}
                className="bg-surfaceActive border border-border rounded-xl items-center justify-center"
                style={{ width: 48, height: 48 }}
              >
                <Text className="text-amber text-[22px] font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </View>

      <ScrollView className="flex-1 px-5 mt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mb-3">
          Order ({items.length})
        </Text>
        {items.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-text-muted">No items yet — tap "Add items"</Text>
          </View>
        ) : (
          items.map((it) => (
            <View
              key={it.id}
              className="bg-surface border border-border rounded-xl px-4 py-3 mb-2 flex-row items-center"
            >
              <View className="flex-1">
                <Text className="text-text-primary font-semibold text-[14px]">{it.name}</Text>
                <Text className="text-text-secondary text-[12px] mt-0.5">AED {it.price} each</Text>
              </View>
              <TouchableOpacity
                onPress={() => dec(it.id)}
                className="w-9 h-9 rounded-lg items-center justify-center bg-surfaceActive border border-border"
              >
                <Text className="text-amber text-[18px] font-bold">−</Text>
              </TouchableOpacity>
              <Text className="text-text-primary font-bold mx-3" style={{ minWidth: 20, textAlign: "center" }}>
                {it.qty}
              </Text>
              <Text className="text-amber font-bold" style={{ minWidth: 64, textAlign: "right" }}>
                AED {it.qty * it.price}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View className="px-5 pt-3 border-t border-border bg-bg">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-text-secondary text-[13px] uppercase tracking-wider font-semibold">Total</Text>
          <Text className="text-amber text-[26px] font-bold">AED {total}</Text>
        </View>
        <View className="flex-row gap-2 pb-2">
          <View className="flex-1">
            <Button variant="secondary" label="Add items" full onPress={() => setPickerOpen(true)} />
          </View>
          <View className="flex-1">
            <Button label="Close bill" full onPress={() => setBillOpen(true)} disabled={items.length === 0} />
          </View>
        </View>
      </View>

      <MenuPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addFromMenu} />
      <CloseBillSheet
        open={billOpen}
        onClose={() => setBillOpen(false)}
        total={total}
        guests={guests}
        onDone={() => {
          setBillOpen(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

function MenuPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (m: (typeof mockMenu)[number]) => void;
}) {
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-bg rounded-t-3xl border-t border-border" style={{ maxHeight: "80%" }}>
          <View className="px-5 py-4 flex-row items-center justify-between border-b border-border">
            <Text className="text-text-primary text-[18px] font-bold">Add items</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text className="text-amber font-semibold text-[14px]">Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="px-5" contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}>
            {mockMenu.filter((m) => m.available).map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => onPick(m)}
                activeOpacity={0.85}
                className="bg-surface border border-border rounded-xl px-4 py-3 mb-2 flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold text-[14px]">{m.name}</Text>
                  <Text className="text-text-secondary text-[12px] mt-0.5">
                    {m.category} · AED {m.price}
                  </Text>
                </View>
                <View className="w-9 h-9 rounded-lg bg-amber items-center justify-center">
                  <Text className="text-black text-[18px] font-bold">+</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type SplitMode = "even" | "item";
type Pay = "cash" | "card" | "wallet";

function CloseBillSheet({
  open,
  onClose,
  total,
  guests,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  guests: number;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<SplitMode>("even");
  const [payment, setPayment] = useState<Pay>("card");

  const perGuest = guests > 0 ? total / guests : total;

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-bg rounded-t-3xl border-t border-border px-5 py-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-primary text-[20px] font-bold">Close bill</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text className="text-text-secondary">Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-text-secondary text-[12px] uppercase tracking-wider font-semibold mb-2">Split</Text>
          <View className="flex-row gap-2 mb-5">
            {(["even", "item"] as SplitMode[]).map((s) => {
              const a = mode === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setMode(s)}
                  className={`flex-1 rounded-xl items-center justify-center border ${
                    a ? "bg-amber border-amber" : "bg-surface border-border"
                  }`}
                  style={{ height: 52 }}
                >
                  <Text className={`font-semibold text-[14px] ${a ? "text-black" : "text-text-primary"}`}>
                    {s === "even" ? `Split evenly · ${guests} guests` : "Split by item"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === "even" ? (
            <View className="bg-surface border border-border rounded-xl p-4 mb-5">
              <Text className="text-text-secondary text-[12px] uppercase tracking-wider mb-1">Per guest</Text>
              <Text className="text-amber text-[28px] font-bold">AED {perGuest.toFixed(2)}</Text>
            </View>
          ) : (
            <View className="bg-surface border border-border rounded-xl p-4 mb-5">
              <Text className="text-text-muted text-[12px]">
                After confirming, you'll assign each item to a guest tab.
              </Text>
            </View>
          )}

          <Text className="text-text-secondary text-[12px] uppercase tracking-wider font-semibold mb-2">Payment</Text>
          <View className="flex-row gap-2 mb-5">
            {(["cash", "card", "wallet"] as Pay[]).map((p) => {
              const a = payment === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPayment(p)}
                  className={`flex-1 rounded-xl items-center justify-center border ${
                    a ? "bg-amber border-amber" : "bg-surface border-border"
                  }`}
                  style={{ height: 52 }}
                >
                  <Text className={`font-semibold capitalize text-[14px] ${a ? "text-black" : "text-text-primary"}`}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-secondary text-[14px]">Total</Text>
            <Text className="text-text-primary text-[22px] font-bold">AED {total}</Text>
          </View>

          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Button variant="secondary" label="Print bill" full />
            </View>
            <View className="flex-1">
              <Button label="Mark paid" full onPress={onDone} />
            </View>
          </View>
          <Text className="text-text-muted text-[11px] text-center mt-2">
            Marking paid resets the table to available, deducts stock and logs the action.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
