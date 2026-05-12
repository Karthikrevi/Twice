import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useStaff, useCreateStaff, useDeleteStaff, type StaffRow } from "@/hooks/useStaff";
import { Input } from "@/components/ui/Input";
import { ListSkeleton } from "@/components/ui/States";

const BG = "#0D0F14";
const SURFACE = "#161920";
const SURFACE_ACTIVE = "#1E2128";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const AMBER = "#F5A623";
const URGENT = "#EF4444";
const SUCCESS = "#22C55E";
const PURPLE = "#7C6AF5";
const ORANGE = "#FF6D00";

type Role = "manager" | "waiter" | "kitchen";
type Filter = "all" | Role;

const ROLE_COLOR: Record<Role, string> = {
  manager: SUCCESS,
  waiter: PURPLE,
  kitchen: ORANGE,
};

// TODO: backend doesn't yet expose pending invites — replace with a real
// GET /staff/invites endpoint when available.
const PLACEHOLDER_INVITES: { id: string; email: string; role: Role; daysAgo: number }[] = [
  { id: "i1", email: "sara@almandi.ae", role: "waiter", daysAgo: 2 },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StaffManagement() {
  const staff = useStaff();
  const remove = useDeleteStaff();

  const [filter, setFilter] = useState<Filter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const visible = useMemo(() => {
    const rows = (staff.data ?? []).filter((r) => r.role !== "owner");
    if (filter === "all") return rows;
    return rows.filter((r) => r.role === filter);
  }, [staff.data, filter]);

  const onRemove = (row: StaffRow) =>
    Alert.alert(
      `Remove ${row.name}?`,
      "They'll lose access immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => remove.mutate(row.id),
        },
      ],
      { cancelable: true }
    );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={{ marginRight: 8 }}>
            <Feather name="chevron-left" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>
          <Text
            style={{
              color: TEXT_PRIMARY,
              fontFamily: "Inter_700Bold",
              fontSize: 24,
              letterSpacing: -0.3,
            }}
          >
            Staff Management
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setAddOpen(true)}
          activeOpacity={0.85}
          style={{
            backgroundColor: AMBER,
            borderRadius: 10,
            paddingHorizontal: 12,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
            Add Staff Member +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        {(["all", "manager", "waiter", "kitchen"] as Filter[]).map((f) => {
          const active = filter === f;
          const label = f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1);
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              activeOpacity={0.85}
              style={{
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: active ? AMBER : SURFACE,
                borderWidth: active ? 0 : 1,
                borderColor: BORDER,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: active ? "#000" : TEXT_SECONDARY,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {staff.isLoading ? (
        <View style={{ paddingHorizontal: 20 }}>
          <ListSkeleton count={4} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <StaffCard
              row={item}
              onEdit={() => Alert.alert("Edit staff coming soon.")}
              onReset={() => Alert.alert("Reset password coming soon.")}
              onRemove={() => onRemove(item)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64 }}>
              <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                No staff yet
              </Text>
            </View>
          }
          ListFooterComponent={<PendingInvites />}
        />
      )}

      <AddStaffSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

function StaffCard({
  row,
  onEdit,
  onReset,
  onRemove,
}: {
  row: StaffRow;
  onEdit: () => void;
  onReset: () => void;
  onRemove: () => void;
}) {
  if (row.role === "owner") return null;
  const role = row.role as Role;
  const c = ROLE_COLOR[role];
  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: SURFACE_ACTIVE,
          borderWidth: 1,
          borderColor: BORDER,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: AMBER, fontFamily: "Inter_700Bold", fontSize: 14 }}>
          {initialsOf(row.name)}
        </Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              color: TEXT_PRIMARY,
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
            }}
          >
            {row.name}
          </Text>
          <View
            style={{
              height: 20,
              paddingHorizontal: 8,
              borderRadius: 999,
              backgroundColor: c + "22",
              borderWidth: 1,
              borderColor: c + "44",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: c,
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
                textTransform: "capitalize",
              }}
            >
              {role}
            </Text>
          </View>
        </View>
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {row.email}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 6 }}>
        <SmallButton label="Edit" bg={AMBER + "22"} color={AMBER} onPress={onEdit} />
        <SmallButton
          label="Reset Password"
          bg={SURFACE_ACTIVE}
          color={TEXT_SECONDARY}
          border={BORDER}
          onPress={onReset}
        />
        <SmallButton label="Remove" bg={URGENT + "22"} color={URGENT} onPress={onRemove} />
      </View>
    </View>
  );
}

function SmallButton({
  label,
  bg,
  color,
  border,
  onPress,
}: {
  label: string;
  bg: string;
  color: string;
  border?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: bg,
        borderRadius: 8,
        paddingHorizontal: 8,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: border ? 1 : 0,
        borderColor: border,
      }}
    >
      <Text style={{ color, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function PendingInvites() {
  const invites = PLACEHOLDER_INVITES;
  if (invites.length === 0) return null;
  return (
    <View style={{ marginTop: 16 }}>
      <Text
        style={{
          color: AMBER,
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Pending invitations ({invites.length})
      </Text>
      {invites.map((i) => (
        <View
          key={i.id}
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
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontFamily: "Inter_500Medium",
                fontSize: 14,
              }}
            >
              {i.email}
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
              {i.role} · Sent {i.daysAgo} {i.daysAgo === 1 ? "day" : "days"} ago
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <SmallButton
              label="Resend"
              bg={AMBER + "22"}
              color={AMBER}
              onPress={() => Alert.alert("Resend invite coming soon.")}
            />
            <SmallButton
              label="Cancel"
              bg={URGENT + "22"}
              color={URGENT}
              onPress={() => Alert.alert("Cancel invite coming soon.")}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function AddStaffSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("waiter");
  const create = useCreateStaff();

  const valid =
    name.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6;

  const close = () => {
    create.reset();
    setName("");
    setEmail("");
    setPassword("");
    setRole("waiter");
    onClose();
  };

  const submit = () => {
    if (!valid) return;
    create.reset();
    create.mutate(
      { name: name.trim(), email: email.trim(), password, role },
      { onSuccess: close }
    );
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={{ flex: 1 }} />
      </Pressable>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          backgroundColor: SURFACE,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: BORDER }} />
        </View>

        <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 14 }}>
          Add Staff
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
              {(["manager", "waiter", "kitchen"] as Role[]).map((r) => {
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
                      backgroundColor: active ? AMBER : SURFACE_ACTIVE,
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
        </View>

        {create.isError ? (
          <Text
            style={{
              color: URGENT,
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              marginTop: 10,
            }}
          >
            We couldn't send the invitation. Please try again.
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={submit}
          disabled={!valid || create.isPending}
          activeOpacity={0.85}
          style={{
            marginTop: 18,
            height: 52,
            borderRadius: 12,
            backgroundColor: AMBER,
            alignItems: "center",
            justifyContent: "center",
            opacity: !valid || create.isPending ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
            {create.isPending ? "Sending…" : "Send invitation"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={close} activeOpacity={0.7} style={{ marginTop: 14, alignItems: "center" }}>
          <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
