import { Text, View } from "react-native";
import { colors, platformLabel, type PlatformKey } from "@/theme/colors";

export function PlatformBadge({ platform }: { platform: PlatformKey }) {
  return (
    <View
      className="px-2.5 rounded-full"
      style={{ backgroundColor: colors.platform[platform] + "33", height: 24, justifyContent: "center" }}
    >
      <Text style={{ color: colors.platform[platform] }} className="font-semibold text-[11px] uppercase tracking-wider">
        {platformLabel[platform]}
      </Text>
    </View>
  );
}

export function StatusDot({ color, size = 8 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />;
}

export function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View
      className="flex-row items-center px-2.5 rounded-full"
      style={{ backgroundColor: color + "22", height: 24 }}
    >
      <StatusDot color={color} />
      <Text style={{ color }} className="ml-1.5 text-[11px] font-semibold uppercase tracking-wider">
        {label}
      </Text>
    </View>
  );
}
