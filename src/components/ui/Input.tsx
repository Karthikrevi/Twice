import { Text, TextInput, View, type TextInputProps } from "react-native";

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, ...rest }: Props) {
  return (
    <View className="w-full">
      {label ? (
        <Text className="text-text-secondary text-[12px] mb-2 uppercase tracking-wider font-medium">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#6B7080"
        {...rest}
        className={`bg-surface border rounded-xl px-4 text-text-primary text-[15px] ${
          error ? "border-status-urgent" : "border-border"
        }`}
        style={{ height: 52 }}
      />
      {hint && !error ? <Text className="text-text-muted text-[12px] mt-1.5">{hint}</Text> : null}
      {error ? <Text className="text-status-urgent text-[12px] mt-1.5">{error}</Text> : null}
    </View>
  );
}
