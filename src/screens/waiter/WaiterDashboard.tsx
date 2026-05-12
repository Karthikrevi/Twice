import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WaiterTables } from "@/screens/waiter/WaiterTables";
import { WaiterOrders } from "@/screens/waiter/WaiterOrders";

const BG = "#0D0F14";
const BORDER = "#2C2F3A";
const TEXT_SECONDARY = "#8B90A0";
const AMBER = "#F5A623";

type TabKey = "tables" | "orders";

export function WaiterDashboard() {
  const [active, setActive] = useState<TabKey>("tables");
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: BG }}>
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          paddingTop: 8,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        {([
          { key: "tables" as const, label: "Tables" },
          { key: "orders" as const, label: "Orders" },
        ]).map((t) => {
          const a = active === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActive(t.key)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor: a ? AMBER : "transparent",
                marginBottom: -1,
              }}
            >
              <Text
                style={{
                  color: a ? AMBER : TEXT_SECONDARY,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {active === "tables" ? <WaiterTables /> : <WaiterOrders />}
      </View>
    </SafeAreaView>
  );
}

export default WaiterDashboard;
