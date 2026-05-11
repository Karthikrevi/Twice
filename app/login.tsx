import { useState } from "react";
import { Text, View, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLogin } from "@/hooks/useAuth";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = () => {
    login.reset();
    login.mutate({ email: email.trim(), password });
  };

  const errorMessage = login.isError
    ? axios.isAxiosError(login.error) && login.error.response?.status === 401
      ? "Email or password is incorrect."
      : "We couldn't sign you in. Try again."
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-7"
      >
        <View className="mb-10 items-start">
          <Text className="text-amber text-[14px] font-bold tracking-[6px] mb-3">ONCE</Text>
          <Text className="text-text-primary text-[32px] font-bold tracking-tight">Welcome back</Text>
          <Text className="text-text-secondary text-[14px] mt-1.5">Sign in to continue</Text>
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
            error={errorMessage}
          />
        </View>

        <View className="mt-6">
          <Button label="Sign in" onPress={submit} disabled={!valid} loading={login.isPending} full />
        </View>

        <Text className="text-text-muted text-[12px] mt-8 text-center leading-5">
          Sessions expire after 15 minutes of inactivity. Trouble signing in? Contact your owner.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
