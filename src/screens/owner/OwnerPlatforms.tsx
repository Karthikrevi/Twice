import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { usePlatforms, type PlatformRow } from "@/hooks/usePlatforms";
import { ListSkeleton } from "@/components/ui/States";

const BG = "#0D0F14";
const SURFACE = "#161920";
const SURFACE_ACTIVE = "#1E2128";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const AMBER = "#F5A623";
const SUCCESS = "#22C55E";
const URGENT = "#EF4444";

const TALABAT = "#FF6D00";
const DELIVEROO = "#00CCBC";
const INSTASHOP = "#43A047";

interface PlatformMeta {
  key: "talabat" | "deliveroo" | "instashop";
  name: string;
  method: string;
  methodItalic?: boolean;
  color: string;
  initial: string;
}

const PLATFORMS: PlatformMeta[] = [
  {
    key: "talabat",
    name: "Talabat + InstaShop",
    method: "Connected via Delivery Hero",
    color: TALABAT,
    initial: "T",
  },
  {
    key: "deliveroo",
    name: "Deliveroo",
    method: "Connected via OAuth",
    color: DELIVEROO,
    initial: "D",
  },
  {
    key: "instashop",
    name: "InstaShop",
    method: "Shares Delivery Hero token with Talabat",
    methodItalic: true,
    color: INSTASHOP,
    initial: "I",
  },
];

const COMING_SOON = [
  { name: "Careem Food", color: "#5BC85C" },
  { name: "Noon Food", color: "#FFE600" },
];

function relativeTime(iso?: string) {
  if (!iso) return "—";
  try {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const min = Math.floor(diff / 60_000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  } catch {
    return "—";
  }
}

export function OwnerPlatforms() {
  const platforms = usePlatforms();

  const byKey = new Map<string, PlatformRow>();
  (platforms.data ?? []).forEach((p) => byKey.set(p.platform, p));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Text
          style={{
            color: TEXT_PRIMARY,
            fontFamily: "Inter_700Bold",
            fontSize: 28,
            letterSpacing: -0.5,
          }}
        >
          Platform Connections.
        </Text>
        <Text
          style={{
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            marginTop: 6,
          }}
        >
          Manage your delivery platform integrations
        </Text>
      </View>

      {/* Connected platform cards */}
      {platforms.isLoading ? (
        <View style={{ marginTop: 24 }}>
          <ListSkeleton count={3} />
        </View>
      ) : (
        <View style={{ gap: 12, marginTop: 24 }}>
          {PLATFORMS.map((p) => (
            <PlatformCard key={p.key} meta={p} row={byKey.get(p.key)} />
          ))}
        </View>
      )}

      {/* Add platform */}
      <Text
        style={{
          color: TEXT_SECONDARY,
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          letterSpacing: 1.8,
          textTransform: "uppercase",
          marginTop: 32,
          marginBottom: 12,
        }}
      >
        Add platform
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {COMING_SOON.map((p) => (
          <View
            key={p.name}
            style={{
              flex: 1,
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: BORDER,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{
                color: TEXT_SECONDARY,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
              }}
            >
              {p.name}
            </Text>
            <Text
              style={{
                color: AMBER,
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Coming soon
            </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  `We'll notify you when ${p.name} integration is available.`
                )
              }
              activeOpacity={0.85}
              style={{
                backgroundColor: SURFACE_ACTIVE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 32,
                alignSelf: "flex-start",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  color: TEXT_SECONDARY,
                  fontFamily: "Inter_500Medium",
                  fontSize: 12,
                }}
              >
                Notify me
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Security info */}
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <Feather name="lock" size={16} color={TEXT_SECONDARY} style={{ marginRight: 12 }} />
        <Text
          style={{
            flex: 1,
            color: TEXT_SECONDARY,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          All credentials are encrypted with AES-256 and stored securely. Once never shares your data
          with third parties.
        </Text>
      </View>
    </ScrollView>
  );
}

function PlatformCard({ meta, row }: { meta: PlatformMeta; row?: PlatformRow }) {
  const connected = row?.status === "connected";
  const missing = !row;
  const hasIssue = !connected;

  const accent = hasIssue ? URGENT : SUCCESS;
  const commissionRate = row?.commission_rate ?? 0;
  const lastSync = row?.updated_at;

  const onDisconnect = () => {
    Alert.alert(
      `Disconnect ${meta.name}?`,
      "Orders will stop flowing immediately.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Disconnect", style: "destructive", onPress: () => undefined },
      ],
      { cancelable: true }
    );
  };

  const onManage = () => undefined;
  const onReconnect = () => undefined;

  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderLeftWidth: 3,
        borderLeftColor: accent,
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: meta.color,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>
            {meta.initial}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{ color: TEXT_PRIMARY, fontFamily: "Inter_600SemiBold", fontSize: 15 }}
          >
            {meta.name}
          </Text>
          <Text
            style={{
              color: TEXT_SECONDARY,
              fontFamily: meta.methodItalic ? "Inter_400Regular" : "Inter_400Regular",
              fontStyle: meta.methodItalic ? "italic" : "normal",
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {meta.method}
          </Text>
        </View>
        <View
          style={{
            height: 28,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: accent + "22",
            borderWidth: 1,
            borderColor: accent + "44",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: accent,
              fontFamily: "Inter_600SemiBold",
              fontSize: 12,
            }}
          >
            {connected ? "Connected" : missing ? "Not connected" : "Issue"}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: BORDER, marginTop: 12, marginBottom: 12 }} />

      {/* Info row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: connected ? SUCCESS : URGENT,
              marginRight: 8,
            }}
          />
          <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            {connected ? `Last sync: ${relativeTime(lastSync)}` : "Auth expired"}
          </Text>
        </View>
        <Text style={{ color: TEXT_SECONDARY, fontFamily: "Inter_400Regular", fontSize: 12 }}>
          Commission rate: {Math.round(commissionRate * 100)}%
        </Text>
      </View>

      {/* Action row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 12,
        }}
      >
        {connected ? (
          <TouchableOpacity
            onPress={onManage}
            activeOpacity={0.85}
            style={{
              backgroundColor: SURFACE_ACTIVE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
              }}
            >
              Manage
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onReconnect}
            activeOpacity={0.85}
            style={{
              backgroundColor: AMBER,
              borderRadius: 10,
              paddingHorizontal: 14,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#000",
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
              }}
            >
              Reconnect
            </Text>
          </TouchableOpacity>
        )}

        {!missing ? (
          <TouchableOpacity
            onPress={onDisconnect}
            activeOpacity={0.85}
            style={{
              backgroundColor: URGENT + "22",
              borderWidth: 1,
              borderColor: URGENT + "44",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: URGENT,
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
              }}
            >
              Disconnect
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default OwnerPlatforms;
