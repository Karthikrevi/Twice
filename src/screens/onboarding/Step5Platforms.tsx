import { Text, TouchableOpacity, View } from "react-native";
import { StepShell } from "./StepShell";
import { useOnboarding } from "@/store/onboarding";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { colors } from "@/theme/colors";

export function Step5Platforms() {
  const { deliveryHeroToken, deliverooConnected, set, next } = useOnboarding();

  return (
    <StepShell
      step={5}
      title="Connect platforms"
      subtitle="Link your delivery accounts. You can skip and connect later in Settings."
      onNext={next}
      nextLabel="Continue"
    >
      <Card>
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.platform.talabat }}>
            <Text className="text-white font-bold">T</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-semibold text-[15px]">Talabat + InstaShop</Text>
            <Text className="text-text-secondary text-[12px]">One Delivery Hero token covers both</Text>
          </View>
        </View>
        <Input
          placeholder="dh_vendor_••••••••••••"
          value={deliveryHeroToken}
          onChangeText={(deliveryHeroToken) => set({ deliveryHeroToken })}
          autoCapitalize="none"
        />
      </Card>

      <View className="h-3" />

      <Card>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.platform.deliveroo }}>
              <Text className="text-white font-bold">D</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-semibold text-[15px]">Deliveroo</Text>
              <Text className="text-text-secondary text-[12px]">Connect via OAuth</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => set({ deliverooConnected: !deliverooConnected })}
            activeOpacity={0.8}
            className={`px-4 rounded-lg items-center justify-center ${deliverooConnected ? "bg-status-available" : "bg-amber"}`}
            style={{ height: 40 }}
          >
            <Text className={`font-semibold text-[13px] ${deliverooConnected ? "text-white" : "text-black"}`}>
              {deliverooConnected ? "Connected" : "Connect"}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Text className="text-text-muted text-[12px] mt-6 leading-5">
        Credentials are encrypted with AES-256 on Once's servers. We only ever read order data, never customer
        payment details.
      </Text>
    </StepShell>
  );
}
