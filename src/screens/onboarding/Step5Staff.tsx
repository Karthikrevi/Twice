import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import axios from "axios";
import { StepShell } from "./StepShell";
import { useOnboarding, type StaffDraft } from "@/store/onboarding";
import { Input } from "@/components/ui/Input";
import { useSubmitOnboarding } from "@/hooks/useOnboardingSubmit";
import { useSession } from "@/store/session";

const AMBER = "#F5A623";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const URGENT = "#EF4444";

const roles: StaffDraft["role"][] = ["manager", "waiter", "kitchen"];

export function Step5Staff() {
  const { staff, addStaff, removeStaff, reset } = useOnboarding();
  const setSetupDone = useSession((s) => s.setSetupDone);
  const submit = useSubmitOnboarding();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffDraft["role"]>("waiter");

  const canAdd = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && password.length >= 6;

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
      // surfaced inline below
    }
  };

  const errorMessage = submit.isError
    ? axios.isAxiosError(submit.error) && submit.error.response?.data?.error === "bad_input"
      ? "Some details are missing or invalid. Please go back and review."
      : "We couldn't complete setup. Check your connection and try again."
    : undefined;

  return (
    <StepShell
      step={5}
      title="Add your team."
      subtitle="Add staff now or later from Settings."
      onNext={finish}
      onSkip={finish}
      skipLabel="Skip for now"
      nextLabel={submit.isPending ? "Setting up…" : "Finish setup"}
      loading={submit.isPending}
      nextDisabled={submit.isPending}
    >
      {/* Add staff card */}
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
            marginBottom: 14,
            textTransform: "uppercase",
          }}
        >
          New staff member
        </Text>

        <View style={{ gap: 12 }}>
          <Input placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            placeholder="Temporary password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

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
              Role
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {roles.map((r) => {
                const active = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    activeOpacity={0.85}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      borderWidth: 1,
                      backgroundColor: active ? AMBER : SURFACE,
                      borderColor: active ? AMBER : BORDER,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#000" : TEXT_PRIMARY,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 13,
                        textTransform: "capitalize",
                      }}
                    >
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
            style={{
              height: 48,
              borderRadius: 12,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: canAdd ? AMBER : BORDER,
              alignItems: "center",
              justifyContent: "center",
              opacity: canAdd ? 1 : 0.5,
            }}
          >
            <Text
              style={{
                color: canAdd ? AMBER : TEXT_MUTED,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
              }}
            >
              Add staff member +
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Team list */}
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          letterSpacing: 1.8,
          marginTop: 24,
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        Team ({staff.length})
      </Text>
      {staff.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            No staff yet — you can finish without them
          </Text>
        </View>
      ) : (
        staff.map((s) => (
          <View
            key={s.id}
            style={{
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                {s.name}
              </Text>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginTop: 2,
                  textTransform: "capitalize",
                }}
              >
                {s.role} · {s.email}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeStaff(s.id)} hitSlop={10}>
              <Text style={{ color: URGENT, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {errorMessage ? (
        <View
          style={{
            marginTop: 20,
            backgroundColor: URGENT + "1F",
            borderColor: URGENT + "55",
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: URGENT, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}
    </StepShell>
  );
}
