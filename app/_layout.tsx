import "../global.css";
import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View } from "react-native";
import { secureStorage } from "@/lib/secureStorage";
import { setSessionExpiredHandler } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useSession } from "@/store/session";
import type { User } from "@/types";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular: require("../assets/fonts/Inter-Regular.ttf"),
    Inter_500Medium: require("../assets/fonts/Inter-Medium.ttf"),
    Inter_600SemiBold: require("../assets/fonts/Inter-SemiBold.ttf"),
    Inter_700Bold: require("../assets/fonts/Inter-Bold.ttf"),
  });
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      disconnectSocket();
      useSession.getState().signOut();
      router.replace("/login");
    });

    (async () => {
      const [access, user, setupDone, keepLoggedIn, restaurantName] = await Promise.all([
        secureStorage.getAccess(),
        secureStorage.getUser<User>(),
        secureStorage.isSetupDone(),
        secureStorage.isKeepLoggedIn(),
        secureStorage.getRestaurantName(),
      ]);
      const s = useSession.getState();
      s.setSetupDone(setupDone);
      s.setRestaurantName(restaurantName);
      if (keepLoggedIn && user) {
        s.setUser(user);
        if (access) connectSocket(access);
      } else if (!keepLoggedIn) {
        // Don't auto-restore — force a fresh sign-in but preserve setup + restaurant name
        await secureStorage.clearSession();
        s.setUser(null);
      }
      s.setBootstrapped(true);
      setBootstrapped(true);
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded && bootstrapped) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, bootstrapped]);

  if (!fontsLoaded || !bootstrapped) {
    return <View style={{ flex: 1, backgroundColor: "#0D0F14" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0D0F14" }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0D0F14" },
              animation: "fade",
            }}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
