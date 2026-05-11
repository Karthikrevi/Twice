import { Text, TextInput, View, type TextInputProps } from "react-native";

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, style, ...rest }: Props) {
  return (
    <View style={{ width: "100%" }}>
      {label ? (
        <Text
          style={{
            color: "#8B90A0",
            fontFamily: "Inter_500Medium",
            fontSize: 12,
            letterSpacing: 1.8,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#4A4F5E"
        {...rest}
        style={[
          {
            height: 52,
            backgroundColor: "#161920",
            borderWidth: 1,
            borderColor: error ? "#EF4444" : "#2C2F3A",
            borderRadius: 12,
            paddingHorizontal: 16,
            color: "#F1F3F7",
            fontFamily: "Inter_400Regular",
            fontSize: 15,
          },
          style,
        ]}
      />
      {hint && !error ? (
        <Text
          style={{
            color: "#4A4F5E",
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          {hint}
        </Text>
      ) : null}
      {error ? (
        <Text
          style={{
            color: "#EF4444",
            fontFamily: "Inter_500Medium",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
