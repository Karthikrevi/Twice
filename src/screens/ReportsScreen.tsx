import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { ListSkeleton, ErrorState, EmptyState } from "@/components/ui/States";
import { useDailyReport } from "@/hooks/useReports";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";

export function ReportsScreen() {
  const { data, isLoading, isError, refetch } = useDailyReport();

  if (isLoading) {
    return (
      <Screen title="Reports" subtitle="Today">
        <ListSkeleton count={3} />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen title="Reports" subtitle="Today">
        <ErrorState onRetry={() => refetch()} />
      </Screen>
    );
  }

  const byPlatform = data?.byPlatform ?? [];
  const tills = data?.tills ?? {};
  const gross = byPlatform.reduce((s, r) => s + (r.gross ?? 0), 0) / 100;
  const commission = byPlatform.reduce((s, r) => s + (r.commission ?? 0), 0) / 100;
  const net = gross - commission;

  return (
    <Screen
      title="Reports"
      subtitle="Today"
      right={
        <TouchableOpacity
          activeOpacity={0.85}
          className="bg-surface border border-border rounded-lg px-3"
          style={{ height: 32, justifyContent: "center" }}
        >
          <Text className="text-amber font-semibold text-[12px]">Export PDF</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row gap-3">
          <Card className="flex-1">
            <Text className="text-text-secondary text-[11px] uppercase tracking-wider font-semibold">Gross</Text>
            <Text className="text-text-primary text-[24px] font-bold mt-1">AED {gross.toFixed(0)}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-text-secondary text-[11px] uppercase tracking-wider font-semibold">Commission</Text>
            <Text style={{ color: colors.status.urgent }} className="text-[24px] font-bold mt-1">
              −{commission.toFixed(0)}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-text-secondary text-[11px] uppercase tracking-wider font-semibold">Net</Text>
            <Text className="text-amber text-[24px] font-bold mt-1">{net.toFixed(0)}</Text>
          </Card>
        </View>

        <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mt-6 mb-3">
          By channel
        </Text>
        {byPlatform.length === 0 ? (
          <EmptyState title="No revenue yet today" hint="Orders and table sales will appear here." />
        ) : (
          <Card padded={false}>
            {byPlatform.map((r, i) => (
              <View
                key={r.platform}
                className={`flex-row items-center px-4 py-3 ${i < byPlatform.length - 1 ? "border-b border-border" : ""}`}
              >
                <View
                  style={{
                    width: 8,
                    height: 28,
                    borderRadius: 2,
                    backgroundColor: colors.platform[r.platform as PlatformKey],
                  }}
                  className="mr-3"
                />
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold text-[14px]">
                    {platformLabel[r.platform as PlatformKey]}
                  </Text>
                  <Text className="text-text-muted text-[11px] mt-0.5">
                    {r.rate ? `${(r.rate * 100).toFixed(0)}% commission` : "Direct"}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-text-primary font-bold text-[14px]">
                    AED {(r.gross / 100).toFixed(0)}
                  </Text>
                  {r.rate ? (
                    <Text className="text-status-urgent text-[11px] mt-0.5">
                      −{(r.commission / 100).toFixed(0)} fee
                    </Text>
                  ) : (
                    <Text className="text-text-muted text-[11px] mt-0.5">no fee</Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mt-6 mb-3">
          Till verification
        </Text>
        <View className="flex-row gap-3">
          <Card className="flex-1">
            <Text className="text-text-muted text-[11px] uppercase tracking-wider">Cash</Text>
            <Text className="text-text-primary text-[20px] font-bold mt-1">
              {((tills.cash ?? 0) / 100).toFixed(0)}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-text-muted text-[11px] uppercase tracking-wider">Card</Text>
            <Text className="text-text-primary text-[20px] font-bold mt-1">
              {((tills.card ?? 0) / 100).toFixed(0)}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-text-muted text-[11px] uppercase tracking-wider">Wallet</Text>
            <Text className="text-text-primary text-[20px] font-bold mt-1">
              {((tills.wallet ?? 0) / 100).toFixed(0)}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
