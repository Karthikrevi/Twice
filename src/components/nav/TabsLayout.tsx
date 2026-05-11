import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { colors } from "@/theme/colors";

export interface TabSpec {
  name: string;
  title: string;
  glyph: string;
}

function Icon({ glyph, color }: { glyph: string; color: string }) {
  return (
    <View style={{ width: 26, height: 26, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color, fontSize: 18, fontFamily: "Inter_600SemiBold" }}>{glyph}</Text>
    </View>
  );
}

export function TabsLayout({ tabs }: { tabs: TabSpec[] }) {
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
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color }) => <Icon glyph={t.glyph} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
