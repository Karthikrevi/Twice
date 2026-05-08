import { Text, TouchableOpacity, View, ScrollView } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { mockTables } from "@/data/mock";
import { colors } from "@/theme/colors";

export default function Tables() {
  const occupied = mockTables.filter((t) => t.status === "occupied");
  const available = mockTables.length - occupied.length;
  const revenue = occupied.reduce((s, t) => s + t.total, 0);

  return (
    <Screen
      title="Tables"
      subtitle={`${available} available · ${occupied.length} occupied`}
      right={
        <View className="bg-surface border border-border rounded-lg px-3" style={{ height: 32, justifyContent: "center" }}>
          <Text className="text-amber font-semibold text-[12px]">AED {revenue} open</Text>
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row flex-wrap -m-1.5">
          {mockTables.map((t) => {
            const occ = t.status === "occupied";
            return (
              <View key={t.id} className="p-1.5" style={{ width: "33.333%" }}>
                <TouchableOpacity
                  onPress={() => router.push(`/table/${t.id}`)}
                  activeOpacity={0.85}
                  className={`rounded-2xl p-4 border ${occ ? "bg-surfaceActive border-amber/40" : "bg-surface border-border"}`}
                  style={{ minHeight: 120 }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-text-primary text-[22px] font-bold tracking-tight">{t.name}</Text>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: occ ? colors.status.occupied : colors.status.available,
                      }}
                    />
                  </View>
                  {occ ? (
                    <View>
                      <Text className="text-text-secondary text-[12px]">{t.guests} guests</Text>
                      <Text className="text-amber text-[15px] font-bold mt-2">AED {t.total}</Text>
                    </View>
                  ) : (
                    <Text className="text-text-muted text-[12px] mt-2">Available</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
