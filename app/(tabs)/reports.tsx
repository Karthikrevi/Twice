import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";

interface Row {
  platform: PlatformKey;
  gross: number;
  commission: number;
  rate: number;
}

const today: Row[] = [
  { platform: "talabat", gross: 1842, commission: 0.25, rate: 0.25 },
  { platform: "deliveroo", gross: 1216, commission: 0.28, rate: 0.28 },
  { platform: "instashop", gross: 488, commission: 0.22, rate: 0.22 },
  { platform: "dinein", gross: 2104, commission: 0, rate: 0 },
  { platform: "takeaway", gross: 612, commission: 0, rate: 0 },
];

const tills = { cash: 1240, card: 1310, wallet: 166 };

export default function Reports() {
  const gross = today.reduce((s, r) => s + r.gross, 0);
  const commission = today.reduce((s, r) => s + r.gross * r.rate, 0);
  const net = gross - commission;

  return (
    <Screen
      title="Reports"
      subtitle="Today · Friday, 8 May"
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
            <Text className="text-text-primary text-[24px] font-bold mt-1">AED {gross.toLocaleString()}</Text>
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
        <Card padded={false}>
          {today.map((r, i) => (
            <View
              key={r.platform}
              className={`flex-row items-center px-4 py-3 ${i < today.length - 1 ? "border-b border-border" : ""}`}
            >
              <View
                style={{ width: 8, height: 28, borderRadius: 2, backgroundColor: colors.platform[r.platform] }}
                className="mr-3"
              />
              <View className="flex-1">
                <Text className="text-text-primary font-semibold text-[14px]">{platformLabel[r.platform]}</Text>
                <Text className="text-text-muted text-[11px] mt-0.5">
                  {r.rate ? `${(r.rate * 100).toFixed(0)}% commission` : "Direct"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-text-primary font-bold text-[14px]">AED {r.gross.toLocaleString()}</Text>
                {r.rate ? (
                  <Text className="text-status-urgent text-[11px] mt-0.5">
                    −{(r.gross * r.rate).toFixed(0)} fee
                  </Text>
                ) : (
                  <Text className="text-text-muted text-[11px] mt-0.5">no fee</Text>
                )}
              </View>
            </View>
          ))}
        </Card>

        <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mt-6 mb-3">
          Till verification
        </Text>
        <View className="flex-row gap-3">
          <Card className="flex-1">
            <Text className="text-text-muted text-[11px] uppercase tracking-wider">Cash</Text>
            <Text className="text-text-primary text-[20px] font-bold mt-1">{tills.cash}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-text-muted text-[11px] uppercase tracking-wider">Card</Text>
            <Text className="text-text-primary text-[20px] font-bold mt-1">{tills.card}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-text-muted text-[11px] uppercase tracking-wider">Wallet</Text>
            <Text className="text-text-primary text-[20px] font-bold mt-1">{tills.wallet}</Text>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
