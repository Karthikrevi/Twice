import { useState } from "react";
import { Text, View, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/store/session";
import type { Role } from "@/types";

export default function Login() {
  const setUser = useSession((s) => s.setUser);
  const restaurant = useSession((s) => s.restaurant);
  const [email, setEmail] = useState(restaurant?.ownerEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = async () => {
    setError(undefined);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const role: Role = email === restaurant?.ownerEmail
      ? "owner"
      : email.includes("manager")
      ? "manager"
      : email.includes("kitchen")
      ? "kitchen"
      : "waiter";
    setUser({
      id: Math.random().toString(36).slice(2, 9),
      name: email.split("@")[0],
      email,
      role,
    });
    setLoading(false);
    router.replace(role === "kitchen" ? "/kitchen" : "/(tabs)/orders");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-7"
      >
        <View className="mb-10 items-start">
          <Text className="text-amber text-[14px] font-bold tracking-[6px] mb-3">ONCE</Text>
          <Text className="text-text-primary text-[32px] font-bold tracking-tight">Welcome back</Text>
          <Text className="text-text-secondary text-[14px] mt-1.5">
            {restaurant?.name ?? "Once restaurant"} · sign in to continue
          </Text>
        </View>

        <View className="gap-4">
          <Input
            label="Email"
            placeholder="you@restaurant.ae"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={error}
          />
        </View>

        <View className="mt-6">
          <Button label="Sign in" onPress={submit} disabled={!valid} loading={loading} full />
        </View>

        <Text className="text-text-muted text-[12px] mt-8 text-center leading-5">
          Sessions expire after 15 minutes of inactivity. Trouble signing in? Contact your owner.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
