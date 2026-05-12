import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View, ScrollView, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState, EmptyState, ListSkeleton } from "@/components/ui/States";
import { useTables, useTableSession, useAddSessionItem, useCloseSession, useOpenTable } from "@/hooks/useTables";
import { useMenu } from "@/hooks/useMenu";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { nextStatus } from "@/data/mock";
import type { MenuItem } from "@/types";

export default function TableDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tables = useTables();
  const menu = useMenu();

  const table = tables.data?.find((t) => t.id === id);
  const session = useTableSession(table?.sessionId ?? null);
  const openTable = useOpenTable();
  const addItem = useAddSessionItem();
  const closeSession = useCloseSession();
  const orders = useOrders();
  const advance = useAdvanceOrderStatus();

  const readyOrder = useMemo(() => {
    if (!table) return undefined;
    return (orders.data ?? []).find(
      (o) => o.tableId === table.id && o.status === "ready"
    );
  }, [orders.data, table?.id]);

  const [guests, setGuests] = useState<number>(table?.guests || 2);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const items = session.data?.items ?? [];
  const total = useMemo(
    () => items.reduce((s, i) => s + (i.priceCents * i.qty) / 100, 0),
    [items]
  );

  const isLoading = tables.isLoading || menu.isLoading;
  const isError = tables.isError || menu.isError;

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
        <View className="px-5 pt-2 pb-4">
          <Text className="text-text-secondary text-[14px]" onPress={() => router.back()}>
            ‹ Tables
          </Text>
        </View>
        <View className="px-5">
          <ListSkeleton count={3} />
        </View>
      </SafeAreaView>
    );
  }
  if (isError || !table) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
        <View className="px-5 pt-2 pb-4">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text className="text-text-secondary text-[14px]">‹ Tables</Text>
          </TouchableOpacity>
        </View>
        <ErrorState onRetry={() => tables.refetch()} message="We couldn't load this table." />
      </SafeAreaView>
    );
  }

  const occ = table.status === "occupied";

  const addFromMenu = (m: MenuItem) => {
    if (!table.sessionId) return;
    addItem.mutate({
      sessionId: table.sessionId,
      menuItemId: m.id,
      name: m.name,
      qty: 1,
      priceCents: Math.round(m.price * 100),
    });
  };

  const openSession = () => {
    openTable.mutate({ id: table.id, guests }, { onSuccess: () => tables.refetch() });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-bg">
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text className="text-text-secondary text-[14px]">‹ Tables</Text>
        </TouchableOpacity>
        <View className="flex-row items-center bg-surfaceActive rounded-full px-3" style={{ height: 28 }}>
          <View
            className={`w-1.5 h-1.5 rounded-full mr-2 ${occ ? "bg-status-occupied" : "bg-status-available"}`}
          />
          <Text className="text-text-primary text-[11px] font-semibold uppercase">
            {occ ? "Occupied" : "Available"}
          </Text>
        </View>
      </View>

      <View className="px-5 pb-3">
        <Text className="text-text-primary text-[34px] font-bold tracking-tight">{table.name}</Text>
        <Text className="text-text-secondary text-[13px] mt-0.5">
          {occ ? `Open since ${table.openedAt ? new Date(table.openedAt).toLocaleTimeString() : "now"}` : "Tap below to open this table"}
        </Text>
      </View>

      {readyOrder ? (
        <View className="px-5 mb-3">
          <View
            style={{
              backgroundColor: "#22C55E22",
              borderWidth: 2,
              borderColor: "#22C55E",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{
                color: "#22C55E",
                fontFamily: "Inter_700Bold",
                fontSize: 18,
                letterSpacing: -0.3,
              }}
            >
              Order Ready
            </Text>
            <View style={{ marginTop: 8 }}>
              {readyOrder.items.map((it) => (
                <Text
                  key={it.id}
                  style={{
                    color: "#F1F3F7",
                    fontFamily: "Inter_500Medium",
                    fontSize: 15,
                    marginBottom: 2,
                  }}
                >
                  {it.qty}× {it.name}
                </Text>
              ))}
            </View>
            <Text
              style={{
                color: "#8B90A0",
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                marginTop: 6,
              }}
            >
              Ready since {Math.max(0, Math.floor((Date.now() - new Date(readyOrder.placedAt).getTime()) / 60_000))} mins ago
            </Text>
            <TouchableOpacity
              onPress={() =>
                advance.mutate({ id: readyOrder.id, status: nextStatus(readyOrder.status) })
              }
              activeOpacity={0.85}
              style={{
                marginTop: 14,
                height: 52,
                borderRadius: 12,
                backgroundColor: "#22C55E",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#000", fontFamily: "Inter_700Bold", fontSize: 15 }}>
                Mark Delivered
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
        {!occ ? (
          <EmptyState
            title="Table is available"
            hint="Open the table to start taking orders."
            glyph="▦"
          />
        ) : session.isLoading ? (
          <ListSkeleton count={2} />
        ) : items.length === 0 ? (
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
                <Text className="text-text-secondary text-[12px] mt-0.5">
                  AED {(it.priceCents / 100).toFixed(0)} each
                </Text>
              </View>
              <Text className="text-text-primary font-bold mx-3" style={{ minWidth: 20, textAlign: "center" }}>
                {it.qty}
              </Text>
              <Text className="text-amber font-bold" style={{ minWidth: 64, textAlign: "right" }}>
                AED {((it.qty * it.priceCents) / 100).toFixed(0)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View className="px-5 pt-3 border-t border-border bg-bg">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-text-secondary text-[13px] uppercase tracking-wider font-semibold">Total</Text>
          <Text className="text-amber text-[26px] font-bold">AED {total.toFixed(0)}</Text>
        </View>
        {!occ ? (
          <View className="pb-2">
            <Button label="Open table" full onPress={openSession} loading={openTable.isPending} />
          </View>
        ) : (
          <View className="flex-row gap-2 pb-2">
            <View className="flex-1">
              <Button variant="secondary" label="Add items" full onPress={() => setPickerOpen(true)} />
            </View>
            <View className="flex-1">
              <Button
                label="Close bill"
                full
                onPress={() => setBillOpen(true)}
                disabled={items.length === 0}
              />
            </View>
          </View>
        )}
      </View>

      <MenuPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addFromMenu}
        menu={menu.data ?? []}
      />
      <CloseBillSheet
        open={billOpen}
        onClose={() => setBillOpen(false)}
        total={total}
        guests={guests}
        loading={closeSession.isPending}
        onDone={(method) => {
          if (!table.sessionId) return;
          closeSession.mutate(
            {
              sessionId: table.sessionId,
              splits: [{ amountCents: Math.round(total * 100), method }],
            },
            {
              onSuccess: () => {
                setBillOpen(false);
                router.back();
              },
            }
          );
        }}
      />
    </SafeAreaView>
  );
}

function MenuPicker({
  open,
  onClose,
  onPick,
  menu,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (m: MenuItem) => void;
  menu: MenuItem[];
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
            {menu.filter((m) => m.available).map((m) => (
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
  loading,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  guests: number;
  loading: boolean;
  onDone: (method: Pay) => void;
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
            <Text className="text-text-primary text-[22px] font-bold">AED {total.toFixed(0)}</Text>
          </View>

          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Button variant="secondary" label="Print bill" full />
            </View>
            <View className="flex-1">
              <Button label="Mark paid" full onPress={() => onDone(payment)} loading={loading} />
            </View>
          </View>
          {loading ? (
            <View className="items-center mt-3">
              <ActivityIndicator color="#F5A623" />
            </View>
          ) : (
            <Text className="text-text-muted text-[11px] text-center mt-2">
              Marking paid resets the table to available, deducts stock and logs the action.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
