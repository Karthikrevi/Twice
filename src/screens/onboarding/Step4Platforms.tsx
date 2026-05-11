import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { StepShell } from "./StepShell";
import { useOnboarding } from "@/store/onboarding";

const AMBER = "#F5A623";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const TEXT_MUTED = "#4A4F5E";
const TALABAT = "#FF6D00";
const DELIVEROO = "#00CCBC";
const SUCCESS = "#22C55E";

export function Step4Platforms() {
  const { deliveryHeroToken, deliverooConnected, set, next } = useOnboarding();

  return (
    <StepShell
      step={4}
      title="Connect your platforms."
      subtitle="Link your delivery accounts. You can skip and connect later."
      onNext={next}
      onSkip={next}
      skipLabel="Skip for now"
      nextLabel="Continue"
    >
      <View style={{ gap: 12 }}>
        {/* Talabat + InstaShop */}
        <View
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: TALABAT,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>T</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                Talabat + InstaShop
              </Text>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                One Delivery Hero token covers both
              </Text>
            </View>
          </View>
          <TextInput
            value={deliveryHeroToken}
            onChangeText={(deliveryHeroToken) => set({ deliveryHeroToken })}
            placeholder="dh_vendor_••••••••••••"
            placeholderTextColor={TEXT_MUTED}
            autoCapitalize="none"
            style={{
              height: 52,
              backgroundColor: "#0D0F14",
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              paddingHorizontal: 16,
              color: TEXT_PRIMARY,
              fontFamily: "Inter_400Regular",
              fontSize: 15,
            }}
          />
        </View>

        {/* Deliveroo */}
        <View
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: DELIVEROO,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>D</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT_PRIMARY, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                Deliveroo
              </Text>
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Connect via OAuth — one tap.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => set({ deliverooConnected: !deliverooConnected })}
              activeOpacity={0.85}
              style={{
                height: 40,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: deliverooConnected ? SUCCESS : AMBER,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: deliverooConnected ? "#FFF" : "#000",
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                }}
              >
                {deliverooConnected ? "Connected ✓" : "Connect"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_400Regular",
          fontSize: 12,
          lineHeight: 18,
          marginTop: 20,
        }}
      >
        Credentials are encrypted with AES-256 on Once's servers. We only ever read order data, never
        customer payment details.
      </Text>
    </StepShell>
  );
}
