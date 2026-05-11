import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import axios from "axios";
import { StepShell } from "./StepShell";
import { useOnboarding, type StaffDraft } from "@/store/onboarding";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useSubmitOnboarding } from "@/hooks/useOnboardingSubmit";
import { useSession } from "@/store/session";

const roles: StaffDraft["role"][] = ["manager", "waiter", "kitchen"];

export function Step6Staff() {
  const { staff, addStaff, removeStaff, reset } = useOnboarding();
  const setSetupDone = useSession((s) => s.setSetupDone);
  const submit = useSubmitOnboarding();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffDraft["role"]>("waiter");

  const canAdd = name.trim() && /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const add = () => {
    if (!canAdd) return;
    addStaff({ id: Math.random().toString(36).slice(2, 9), name: name.trim(), email, password, role });
    setName("");
    setEmail("");
    setPassword("");
  };

  const finish = async () => {
    submit.reset();
    try {
      await submit.mutateAsync();
      setSetupDone(true);
      reset();
      router.replace("/login");
    } catch {
      // error state is rendered below
    }
  };

  const errorMessage = submit.isError
    ? axios.isAxiosError(submit.error) && submit.error.response?.data?.error === "bad_input"
      ? "Some details are missing or invalid. Please go back and review."
      : "We couldn't complete setup. Check your connection and try again."
    : undefined;

  return (
    <StepShell
      step={6}
      title="Add your team"
      subtitle="Add staff now or later from Settings."
      onNext={finish}
      finalStep
      nextDisabled={submit.isPending}
      nextLabel={submit.isPending ? "Setting up…" : undefined}
    >
      <Card>
        <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mb-3">
          New staff member
        </Text>
        <View className="gap-3">
          <Input placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input placeholder="Temporary password" value={password} onChangeText={setPassword} secureTextEntry />

          <View>
            <Text className="text-text-secondary text-[12px] uppercase tracking-wider font-medium mb-2">
              Role
            </Text>
            <View className="flex-row gap-2">
              {roles.map((r) => {
                const active = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    activeOpacity={0.85}
                    className={`flex-1 rounded-xl items-center justify-center border ${
                      active ? "bg-amber border-amber" : "bg-surface border-border"
                    }`}
                    style={{ height: 48 }}
                  >
                    <Text className={`capitalize font-semibold text-[13px] ${active ? "text-black" : "text-text-primary"}`}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            onPress={add}
            disabled={!canAdd}
            activeOpacity={0.8}
            className={`rounded-xl items-center justify-center border-2 border-dashed ${
              canAdd ? "border-amber" : "border-border opacity-50"
            }`}
            style={{ height: 48 }}
          >
            <Text className={`font-semibold ${canAdd ? "text-amber" : "text-text-muted"}`}>+ Add staff</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Text className="text-text-secondary text-[12px] uppercase tracking-widest font-semibold mt-6 mb-2">
        Team ({staff.length})
      </Text>
      {staff.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-text-muted text-[13px]">No staff yet — you can finish without them</Text>
        </View>
      ) : (
        staff.map((s) => (
          <View
            key={s.id}
            className="bg-surface border border-border rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
          >
            <View className="flex-1">
              <Text className="text-text-primary font-semibold text-[15px]">{s.name}</Text>
              <Text className="text-text-secondary text-[12px] mt-0.5 capitalize">
                {s.role} · {s.email}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeStaff(s.id)} hitSlop={10}>
              <Text className="text-status-urgent text-[13px] font-semibold">Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {errorMessage ? (
        <View className="mt-6 bg-status-urgent/15 border border-status-urgent/40 rounded-xl px-4 py-3">
          <Text className="text-status-urgent text-[13px] font-semibold">{errorMessage}</Text>
        </View>
      ) : null}
    </StepShell>
  );
}
