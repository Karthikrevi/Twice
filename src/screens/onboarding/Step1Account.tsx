import { View } from "react-native";
import { StepShell } from "./StepShell";
import { Input } from "@/components/ui/Input";
import { useOnboarding } from "@/store/onboarding";

export function Step1Account() {
  const { restaurantName, location, ownerEmail, ownerPassword, set, next } = useOnboarding();
  const valid =
    restaurantName.trim().length > 1 &&
    location.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(ownerEmail) &&
    ownerPassword.length >= 6;

  return (
    <StepShell
      step={1}
      title="Create your restaurant"
      subtitle="This will be the owner account. Only you can change setup later."
      onNext={next}
      nextDisabled={!valid}
    >
      <View className="gap-4">
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
        <Input
          label="Password"
          placeholder="At least 6 characters"
          value={ownerPassword}
          onChangeText={(ownerPassword) => set({ ownerPassword })}
          secureTextEntry
        />
      </View>
    </StepShell>
  );
}
