import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { StepShell } from "./StepShell";
import { Input } from "@/components/ui/Input";
import { useOnboarding } from "@/store/onboarding";

const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";

export function Step1Account() {
  const { restaurantName, location, ownerEmail, ownerPassword, set, next } = useOnboarding();
  const [showPassword, setShowPassword] = useState(false);

  const valid =
    restaurantName.trim().length >= 2 &&
    location.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(ownerEmail) &&
    ownerPassword.length >= 6;

  return (
    <StepShell
      step={1}
      title="Create your restaurant."
      subtitle="This will be your owner account. Only you can change setup later."
      onNext={next}
      nextDisabled={!valid}
    >
      <View style={{ gap: 16 }}>
        <Input
          label="Restaurant name"
          placeholder="Al Mandi House"
          value={restaurantName}
          onChangeText={(restaurantName) => set({ restaurantName })}
          autoCapitalize="words"
        />
        <Input
          label="Location"
          placeholder="Jumeirah, Dubai"
          value={location}
          onChangeText={(location) => set({ location })}
        />
        <Input
          label="Owner email"
          placeholder="owner@restaurant.ae"
          value={ownerEmail}
          onChangeText={(ownerEmail) => set({ ownerEmail })}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password with eye toggle */}
        <View>
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              letterSpacing: 1.8,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Password
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              value={ownerPassword}
              onChangeText={(ownerPassword) => set({ ownerPassword })}
              placeholder="At least 6 characters"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={{
                height: 52,
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 12,
                paddingLeft: 16,
                paddingRight: 48,
                color: TEXT_PRIMARY,
                fontFamily: "Inter_400Regular",
                fontSize: 15,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              style={{
                position: "absolute",
                right: 12,
                top: 0,
                bottom: 0,
                width: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={{
            color: TEXT_MUTED,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            marginTop: 4,
          }}
        >
          You can change these later in Settings.
        </Text>
      </View>
    </StepShell>
  );
}
