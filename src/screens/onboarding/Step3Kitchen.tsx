import { Text, TouchableOpacity, View } from "react-native";
import { StepShell } from "./StepShell";
import { useOnboarding } from "@/store/onboarding";

const opts = [
  {
    key: "screen" as const,
    title: "Kitchen screen",
    desc: "Kitchen staff log in and see live order tickets on a tablet. Status updates in real time.",
    glyph: "▢",
  },
  {
    key: "printer" as const,
    title: "Thermal printer",
    desc: "Every confirmed order auto-prints an 80mm ticket. No kitchen login needed.",
    glyph: "⎙",
  },
];

export function Step3Kitchen() {
  const { kitchenOutput, set, next } = useOnboarding();
  return (
    <StepShell
      step={3}
      title="Kitchen output"
      subtitle="How should orders reach the kitchen? You can change this later in settings."
      onNext={next}
    >
      <View className="gap-3">
        {opts.map((o) => {
          const active = kitchenOutput === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              onPress={() => set({ kitchenOutput: o.key })}
              activeOpacity={0.85}
              className={`rounded-2xl p-5 border ${active ? "bg-surfaceActive border-amber" : "bg-surface border-border"}`}
            >
              <View className="flex-row items-center mb-2">
                <View
                  className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${active ? "bg-amber" : "bg-surfaceActive"}`}
                >
                  <Text className={`text-[20px] ${active ? "text-black" : "text-amber"}`}>{o.glyph}</Text>
                </View>
                <Text className="text-text-primary text-[17px] font-semibold flex-1">{o.title}</Text>
                <View
                  className={`w-5 h-5 rounded-full border-2 ${active ? "border-amber bg-amber" : "border-border"}`}
                />
              </View>
              <Text className="text-text-secondary text-[13px] leading-5">{o.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </StepShell>
  );
}
