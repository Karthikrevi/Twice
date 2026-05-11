import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { ListSkeleton, ErrorState, EmptyState } from "@/components/ui/States";
import { useTables } from "@/hooks/useTables";
import { colors } from "@/theme/colors";

export function TablesScreen() {
  const { data: tables, isLoading, isError, refetch } = useTables();

  const occupied = (tables ?? []).filter((t) => t.status === "occupied");
  const available = (tables?.length ?? 0) - occupied.length;
  const revenue = occupied.reduce((s, t) => s + t.total, 0);

  return (
    <Screen
      title="Tables"
      subtitle={`${available} available · ${occupied.length} occupied`}
      right={
        <View
          className="bg-surface border border-border rounded-lg px-3"
          style={{ height: 32, justifyContent: "center" }}
        >
          <Text className="text-amber font-semibold text-[12px]">AED {revenue.toFixed(0)} open</Text>
        </View>
      }
    >
      {isLoading ? (
        <ListSkeleton count={3} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !tables || tables.length === 0 ? (
        <EmptyState title="No tables configured" hint="Add tables in Settings." glyph="▦" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="flex-row flex-wrap -m-1.5">
            {tables.map((t) => {
              const occ = t.status === "occupied";
              return (
                <View key={t.id} className="p-1.5" style={{ width: "33.333%" }}>
                  <TouchableOpacity
                    onPress={() => router.push(`/table/${t.id}`)}
                    activeOpacity={0.85}
                    className={`rounded-2xl p-4 border ${
                      occ ? "bg-surfaceActive border-amber/40" : "bg-surface border-border"
                    }`}
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
                        <Text className="text-amber text-[15px] font-bold mt-2">AED {t.total.toFixed(0)}</Text>
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
      )}
    </Screen>
  );
}
