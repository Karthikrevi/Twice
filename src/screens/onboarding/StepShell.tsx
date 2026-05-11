import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { useOnboarding } from "@/store/onboarding";

const AMBER = "#F5A623";
const BG = "#0D0F14";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";

interface Props {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
}

export function StepShell({
  step,
  title,
  subtitle,
  children,
  onNext,
  nextLabel,
  nextDisabled,
  loading,
  skipLabel,
  onSkip,
}: Props) {
  const prev = useOnboarding((s) => s.prev);
  const totalSteps = 5;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
            }}
          >
            Step {step} of {totalSteps}
          </Text>

          {step === 1 ? (
            <Text
              style={{
                color: AMBER,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                letterSpacing: 10,
              }}
            >
              O N C E
            </Text>
          ) : (
            <TouchableOpacity onPress={prev} hitSlop={10}>
              <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                Back
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress bar */}
        <View style={{ flexDirection: "row", marginBottom: 24 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                marginRight: i < totalSteps - 1 ? 4 : 0,
                backgroundColor: i < step ? AMBER : BORDER,
              }}
            />
          ))}
        </View>

        {/* Heading */}
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_700Bold",
            fontSize: 28,
            letterSpacing: -0.5,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            marginTop: 6,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* Bottom bar */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: BORDER,
          backgroundColor: BG,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        {onSkip ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onSkip}
              activeOpacity={0.85}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: BORDER,
                backgroundColor: "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                {skipLabel ?? "Skip for now"}
              </Text>
            </TouchableOpacity>
            <PrimaryButton
              onPress={onNext}
              label={nextLabel ?? "Continue"}
              disabled={nextDisabled}
              loading={loading}
              flex
            />
          </View>
        ) : (
          <PrimaryButton
            onPress={onNext}
            label={nextLabel ?? (step === totalSteps ? "Finish setup" : "Continue")}
            disabled={nextDisabled}
            loading={loading}
            full
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function PrimaryButton({
  onPress,
  label,
  disabled,
  loading,
  full,
  flex,
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  flex?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={{
        height: 52,
        backgroundColor: AMBER,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        opacity: isDisabled ? 0.5 : 1,
        ...(full ? { width: "100%" } : {}),
        ...(flex ? { flex: 1 } : {}),
      }}
    >
      {loading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
