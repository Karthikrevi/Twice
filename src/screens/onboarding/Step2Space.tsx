import { Text, TouchableOpacity, View } from "react-native";
import { StepShell } from "./StepShell";
import { useOnboarding } from "@/store/onboarding";

const AMBER = "#F5A623";
const SURFACE = "#161920";
const SURFACE_ACTIVE = "#1E2128";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";

const outputOptions = [
  {
    key: "screen" as const,
    title: "Kitchen screen",
    desc: "Kitchen staff sign in on a tablet and work from live tickets that update in real time.",
    glyph: "▢",
  },
  {
    key: "printer" as const,
    title: "Thermal printer",
    desc: "Every confirmed order auto-prints an 80mm ticket. No kitchen login required.",
    glyph: "⎙",
  },
];

export function Step2Space() {
  const { tableCount, kitchenOutput, set, next } = useOnboarding();
  const inc = () => set({ tableCount: Math.min(60, tableCount + 1) });
  const dec = () => set({ tableCount: Math.max(1, tableCount - 1) });

  return (
    <StepShell
      step={2}
      title="Set up your space."
      subtitle="We'll handle the naming automatically."
      onNext={next}
    >
      {/* Tables counter card */}
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_500Medium",
            fontSize: 12,
            letterSpacing: 1.8,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          How many tables?
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <TouchableOpacity
            onPress={dec}
            activeOpacity={0.8}
            style={{
              width: 56,
              height: 56,
              backgroundColor: SURFACE_ACTIVE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: AMBER, fontFamily: "Inter_700Bold", fontSize: 28 }}>−</Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontFamily: "Inter_700Bold",
                fontSize: 56,
                letterSpacing: -1.5,
                lineHeight: 64,
              }}
            >
              {tableCount}
            </Text>
          </View>
          <TouchableOpacity
            onPress={inc}
            activeOpacity={0.8}
            style={{
              width: 56,
              height: 56,
              backgroundColor: SURFACE_ACTIVE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: AMBER, fontFamily: "Inter_700Bold", fontSize: 28 }}>+</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Tables will be named T1 through T{tableCount}
        </Text>
      </View>

      {/* Preview tiles */}
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          letterSpacing: 1.8,
          marginTop: 24,
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        Preview
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
        {Array.from({ length: tableCount }).map((_, i) => (
          <View key={i} style={{ width: "25%", padding: 4 }}>
            <View
              style={{
                height: 56,
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                T{i + 1}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Kitchen output section */}
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          letterSpacing: 1.8,
          marginTop: 24,
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        Kitchen output
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {outputOptions.map((o) => {
          const active = kitchenOutput === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              onPress={() => set({ kitchenOutput: o.key })}
              activeOpacity={0.9}
              style={{
                flex: 1,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                backgroundColor: active ? SURFACE_ACTIVE : SURFACE,
                borderColor: active ? AMBER : BORDER,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: active ? AMBER : SURFACE_ACTIVE,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#000" : AMBER,
                      fontSize: 20,
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    {o.glyph}
                  </Text>
                </View>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: active ? AMBER : BORDER,
                    backgroundColor: active ? AMBER : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#000" }} /> : null}
                </View>
              </View>
              <Text
                style={{
                  color: TEXT_PRIMARY,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 17,
                  marginBottom: 6,
                }}
              >
                {o.title}
              </Text>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  lineHeight: 20,
                }}
              >
                {o.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </StepShell>
  );
}
