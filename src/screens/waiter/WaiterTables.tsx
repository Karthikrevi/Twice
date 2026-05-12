import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTables, useOpenTable } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { ListSkeleton } from "@/components/ui/States";
import type { RestaurantTable } from "@/types";

const BG = "#0D0F14";
const SURFACE = "#161920";
const SURFACE_ACTIVE = "#1E2128";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const AMBER = "#F5A623";
const SUCCESS = "#22C55E";
const URGENT = "#EF4444";

const AMBER_60 = "#F5A6239A";

type TileState = "available" | "occupied" | "ready";

export function WaiterTables() {
  const tables = useTables();
  const orders = useOrders();
  const [pendingTable, setPendingTable] = useState<RestaurantTable | null>(null);

  // Map tableId → has-a-ready-order
  const readyTableIds = useMemo(() => {
    const s = new Set<string>();
    (orders.data ?? []).forEach((o) => {
      if (o.tableId && o.status === "ready") s.add(o.tableId);
    });
    return s;
  }, [orders.data]);

  const tileState = (t: RestaurantTable): TileState => {
    if (t.status === "occupied" && readyTableIds.has(t.id)) return "ready";
    if (t.status === "occupied") return "occupied";
    return "available";
  };

  const onTilePress = (t: RestaurantTable) => {
    const state = tileState(t);
    if (state === "available") {
      setPendingTable(t);
    } else {
      router.push(`/table/${t.id}` as any);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_700Bold",
            fontSize: 28,
            letterSpacing: -0.5,
          }}
        >
          My Tables
        </Text>
      </View>

      {tables.isLoading ? (
        <View style={{ paddingHorizontal: 20 }}>
          <ListSkeleton count={3} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {(tables.data ?? []).map((t) => (
              <TableTile
                key={t.id}
                table={t}
                state={tileState(t)}
                onPress={() => onTilePress(t)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <OpenTableSheet table={pendingTable} onClose={() => setPendingTable(null)} />
    </View>
  );
}

function TableTile({
  table,
  state,
  onPress,
}: {
  table: RestaurantTable;
  state: TileState;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== "ready") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, state]);

  const animatedBorderColor =
    state === "ready"
      ? pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [SUCCESS, SUCCESS + "55"],
        })
      : undefined;

  const isOccupied = state === "occupied";
  const isReady = state === "ready";
  const isAvailable = state === "available";

  return (
    <Animated.View
      style={{
        width: "47%",
        minHeight: 90,
        backgroundColor: isAvailable ? SURFACE : SURFACE_ACTIVE,
        borderWidth: isReady ? 2 : 1,
        borderColor: isReady ? (animatedBorderColor as any) : isOccupied ? AMBER_60 : BORDER,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        {/* Top-right dot */}
        {isAvailable ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: SUCCESS,
            }}
          />
        ) : null}
        {isReady ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: AMBER,
            }}
          />
        ) : null}

        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              color: isOccupied || isReady ? (isReady ? "#FFF" : AMBER) : TEXT_PRIMARY,
              fontFamily: "Inter_700Bold",
              fontSize: 28,
              letterSpacing: -0.5,
            }}
          >
            {table.name}
          </Text>

          {isAvailable ? (
            <Text
              style={{
                color: SUCCESS,
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Available
            </Text>
          ) : null}

          {isOccupied ? (
            <>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {table.guests} {table.guests === 1 ? "guest" : "guests"}
              </Text>
              <Text
                style={{
                  color: AMBER,
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                  marginTop: 4,
                }}
              >
                AED {table.total.toFixed(0)}
              </Text>
            </>
          ) : null}

          {isReady ? (
            <Text
              style={{
                color: SUCCESS,
                fontFamily: "Inter_600SemiBold",
                fontSize: 13,
                marginTop: 6,
              }}
            >
              Order Ready 🔔
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function OpenTableSheet({
  table,
  onClose,
}: {
  table: RestaurantTable | null;
  onClose: () => void;
}) {
  const open = !!table;
  const [guests, setGuests] = useState(2);
  const openMut = useOpenTable();

  // Reset guest count whenever a new table is selected
  useEffect(() => {
    if (table) setGuests(2);
  }, [table?.id]);

  const close = () => {
    openMut.reset();
    onClose();
  };

  const submit = () => {
    if (!table) return;
    openMut.reset();
    openMut.mutate(
      { id: table.id, guests },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={{ flex: 1 }} />
      </Pressable>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          backgroundColor: SURFACE,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: BORDER }} />
        </View>

        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_700Bold",
            fontSize: 20,
            textAlign: "center",
          }}
        >
          Open Table
        </Text>
        <Text
          style={{
            color: AMBER,
            fontFamily: "Inter_700Bold",
            fontSize: 24,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {table?.name ?? ""}
        </Text>
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            textAlign: "center",
            marginTop: 16,
          }}
        >
          How many guests?
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => setGuests((g) => Math.max(1, g - 1))}
            activeOpacity={0.8}
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: SURFACE_ACTIVE,
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: AMBER, fontFamily: "Inter_700Bold", fontSize: 28 }}>−</Text>
          </TouchableOpacity>

          <Text
            style={{
              color: TEXT_PRIMARY,
              fontFamily: "Inter_700Bold",
              fontSize: 64,
              letterSpacing: -2,
              marginHorizontal: 32,
              minWidth: 72,
              textAlign: "center",
            }}
          >
            {guests}
          </Text>

          <TouchableOpacity
            onPress={() => setGuests((g) => Math.min(40, g + 1))}
            activeOpacity={0.8}
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: SURFACE_ACTIVE,
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: AMBER, fontFamily: "Inter_700Bold", fontSize: 28 }}>+</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          You can adjust this anytime.
        </Text>

        {openMut.isError ? (
          <Text
            style={{
              color: URGENT,
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Couldn't open the table. Try again.
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={submit}
          disabled={openMut.isPending}
          activeOpacity={0.85}
          style={{
            marginTop: 24,
            height: 52,
            borderRadius: 12,
            backgroundColor: AMBER,
            alignItems: "center",
            justifyContent: "center",
            opacity: openMut.isPending ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#000", fontFamily: "Inter_700Bold", fontSize: 16 }}>
            {openMut.isPending ? "Opening…" : "Open Table"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={close} activeOpacity={0.7} style={{ marginTop: 12, alignItems: "center" }}>
          <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default WaiterTables;
