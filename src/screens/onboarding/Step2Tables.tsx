import { Text, TouchableOpacity, View } from "react-native";
import { StepShell } from "./StepShell";
import { useOnboarding } from "@/store/onboarding";
import { Card } from "@/components/ui/Card";

export function Step2Tables() {
  const { tableCount, set, next } = useOnboarding();

  const dec = () => set({ tableCount: Math.max(1, tableCount - 1) });
  const inc = () => set({ tableCount: Math.min(60, tableCount + 1) });

  return (
    <StepShell step={2} title="How many tables?" subtitle="We'll name them T1 through T{n} automatically." onNext={next}>
      <Card>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={dec}
            className="bg-surfaceActive border border-border rounded-xl items-center justify-center"
            style={{ width: 56, height: 56 }}
          >
            <Text className="text-amber text-[28px] font-bold">−</Text>
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-text-primary text-[56px] font-bold tracking-tight">{tableCount}</Text>
            <Text className="text-text-secondary text-[12px] uppercase tracking-widest">tables</Text>
          </View>
          <TouchableOpacity
            onPress={inc}
            className="bg-surfaceActive border border-border rounded-xl items-center justify-center"
            style={{ width: 56, height: 56 }}
          >
            <Text className="text-amber text-[28px] font-bold">+</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mt-6 mb-3">
        Preview
      </Text>
      <View className="flex-row flex-wrap -m-1">
        {Array.from({ length: tableCount }).map((_, i) => (
          <View key={i} className="p-1" style={{ width: "25%" }}>
            <View className="bg-surface border border-border rounded-xl items-center justify-center" style={{ height: 56 }}>
              <Text className="text-text-primary font-semibold">T{i + 1}</Text>
            </View>
          </View>
        ))}
      </View>
    </StepShell>
  );
}
