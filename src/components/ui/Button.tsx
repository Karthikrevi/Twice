import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  icon?: ReactNode;
}

const styles: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: "bg-amber active:bg-amber-pressed", text: "text-black" },
  secondary: { bg: "bg-surfaceActive border border-border", text: "text-text-primary" },
  ghost: { bg: "bg-transparent", text: "text-text-secondary" },
  danger: { bg: "bg-status-urgent", text: "text-white" },
};

export function Button({ label, onPress, variant = "primary", disabled, loading, full, icon }: Props) {
  const v = styles[variant];
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      className={`${v.bg} h-12 px-5 rounded-xl flex-row items-center justify-center ${full ? "w-full" : ""} ${
        disabled ? "opacity-50" : ""
      }`}
      style={{ minHeight: 48 }}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#000" : "#F5A623"} />
      ) : (
        <View className="flex-row items-center">
          {icon ? <View className="mr-2">{icon}</View> : null}
          <Text className={`${v.text} font-semibold text-[15px]`}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
