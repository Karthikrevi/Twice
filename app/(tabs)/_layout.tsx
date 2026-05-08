import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSession } from "@/store/session";
import { colors } from "@/theme/colors";

function Icon({ glyph, color }: { glyph: string; color: string }) {
  return (
    <View style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontSize: 18, fontFamily: "Inter_600SemiBold" }}>{glyph}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const role = useSession((s) => s.user?.role) ?? "owner";

  const showOrders = role !== "kitchen";
  const showTables = role === "owner" || role === "manager" || role === "waiter";
  const showInventory = role === "owner" || role === "manager";
  const showMenu = role === "owner" || role === "manager";
  const showReports = role === "owner" || role === "manager";
  const showSettings = role === "owner";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 14,
        },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          href: showOrders ? "/(tabs)/orders" : null,
          tabBarIcon: ({ color }) => <Icon glyph="◧" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: "Tables",
          href: showTables ? "/(tabs)/tables" : null,
          tabBarIcon: ({ color }) => <Icon glyph="▦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Stock",
          href: showInventory ? "/(tabs)/inventory" : null,
          tabBarIcon: ({ color }) => <Icon glyph="▤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          href: showMenu ? "/(tabs)/menu" : null,
          tabBarIcon: ({ color }) => <Icon glyph="≡" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          href: showReports ? "/(tabs)/reports" : null,
          tabBarIcon: ({ color }) => <Icon glyph="◔" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          href: showSettings ? "/(tabs)/settings" : null,
          tabBarIcon: ({ color }) => <Icon glyph="⚙" color={color} />,
        }}
      />
    </Tabs>
  );
}
