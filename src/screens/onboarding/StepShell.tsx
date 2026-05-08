import { Text, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useOnboarding } from "@/store/onboarding";

interface Props {
  step: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  finalStep?: boolean;
}

export function StepShell({ step, title, subtitle, children, onNext, nextLabel, nextDisabled, finalStep }: Props) {
  const prev = useOnboarding((s) => s.prev);
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="px-6 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-text-muted text-[12px] uppercase tracking-widest font-semibold">
            Step {step} of 6
          </Text>
          {step > 1 ? (
            <TouchableOpacity onPress={prev} hitSlop={8}>
              <Text className="text-text-secondary text-[13px]">Back</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-amber text-[14px] font-bold tracking-tight">ONCE</Text>
          )}
        </View>
        <View className="flex-row mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              className={`flex-1 h-1 rounded-full mr-1 ${i < step ? "bg-amber" : "bg-surfaceActive"}`}
            />
          ))}
        </View>
        <Text className="text-text-primary text-[28px] font-bold tracking-tight">{title}</Text>
        <Text className="text-text-secondary text-[14px] mt-1.5">{subtitle}</Text>
      </View>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}>
        {children}
      </ScrollView>
      <View className="px-6 pt-3 pb-5 border-t border-border bg-bg">
        <Button
          full
          label={nextLabel ?? (finalStep ? "Finish setup" : "Continue")}
          onPress={onNext}
          disabled={nextDisabled}
        />
      </View>
    </SafeAreaView>
  );
}
