import { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

export function SkeletonBlock({ height = 16, width = "100%", radius = 8 }: { height?: number; width?: number | string; radius?: number }) {
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{ height, width: width as any, borderRadius: radius, backgroundColor: "#1E2128", opacity }}
    />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between mb-3">
        <SkeletonBlock width={80} height={20} radius={999} />
        <SkeletonBlock width={48} height={14} />
      </View>
      <SkeletonBlock width="60%" height={16} />
      <View className="h-3" />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className="mb-2">
          <SkeletonBlock height={14} />
        </View>
      ))}
    </View>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View className="items-center py-16 px-6">
      <View
        className="rounded-full mb-4 items-center justify-center"
        style={{ width: 56, height: 56, backgroundColor: "#EF444422" }}
      >
        <Text className="text-status-urgent text-[24px]">!</Text>
      </View>
      <Text className="text-text-primary text-[16px] font-semibold mb-1">Something went wrong</Text>
      <Text className="text-text-secondary text-[13px] text-center mb-5">
        {message ?? "We couldn't load this. Check your connection and try again."}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.85}
          className="bg-amber rounded-xl px-5"
          style={{ height: 44, justifyContent: "center" }}
        >
          <Text className="text-black font-semibold text-[13px]">Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, hint, glyph = "—" }: { title: string; hint?: string; glyph?: string }) {
  return (
    <View className="items-center py-16 px-6">
      <View
        className="rounded-full mb-4 items-center justify-center"
        style={{ width: 56, height: 56, backgroundColor: "#1E2128" }}
      >
        <Text className="text-text-muted text-[22px]">{glyph}</Text>
      </View>
      <Text className="text-text-primary text-[15px] font-semibold mb-1">{title}</Text>
      {hint ? <Text className="text-text-secondary text-[13px] text-center">{hint}</Text> : null}
    </View>
  );
}
