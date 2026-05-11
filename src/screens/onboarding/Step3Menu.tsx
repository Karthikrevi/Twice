import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { StepShell } from "./StepShell";
import { Input } from "@/components/ui/Input";
import { useOnboarding, type MenuDraft } from "@/store/onboarding";

const AMBER = "#F5A623";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const URGENT = "#EF4444";

export function Step3Menu() {
  const { menu, addMenuItem, removeMenuItem, next } = useOnboarding();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const canAdd = name.trim().length > 0 && Number(price) > 0;

  const add = () => {
    if (!canAdd) return;
    const item: MenuDraft = {
      id: Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      price: Number(price),
      stock: Number(stock) || 0,
    };
    addMenuItem(item);
    setName("");
    setPrice("");
    setStock("");
  };

  return (
    <StepShell
      step={3}
      title="Build your menu."
      subtitle="Add at least one dish to continue. You can add more anytime."
      onNext={next}
      nextDisabled={menu.length === 0}
    >
      {/* Add dish card */}
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
          New dish
        </Text>

        <View style={{ gap: 12 }}>
          <Input placeholder="Dish name" value={name} onChangeText={setName} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Price (AED)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Stock"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />
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
              Add to menu +
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu list */}
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
        Menu ({menu.length} {menu.length === 1 ? "item" : "items"})
      </Text>

      {menu.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <Text style={{ color: TEXT_MUTED, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            No dishes yet
          </Text>
        </View>
      ) : (
        menu.map((m) => (
          <View
            key={m.id}
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
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 15,
                }}
              >
                {m.name}
              </Text>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                AED {m.price} · {m.stock} in stock
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeMenuItem(m.id)} hitSlop={10}>
              <Text style={{ color: URGENT, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </StepShell>
  );
}
