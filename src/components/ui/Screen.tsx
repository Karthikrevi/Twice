import { View, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  scroll?: boolean;
  noPadding?: boolean;
}

export function Screen({ children, title, subtitle, right, noPadding }: Props) {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <StatusBar barStyle="light-content" backgroundColor="#0D0F14" />
      {title ? (
        <View className="px-5 pt-2 pb-4 flex-row items-end justify-between">
          <View className="flex-1">
            <Text className="text-text-primary text-[26px] font-bold tracking-tight">{title}</Text>
            {subtitle ? <Text className="text-text-secondary text-[13px] mt-0.5">{subtitle}</Text> : null}
          </View>
          {right ?? null}
        </View>
      ) : null}
      <View className={`flex-1 ${noPadding ? "" : "px-5"}`}>{children}</View>
    </SafeAreaView>
  );
}
