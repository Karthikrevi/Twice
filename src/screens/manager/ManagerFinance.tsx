import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { FinanceOverview } from "@/screens/owner/tabs/finance/FinanceOverview";
import { FinancePlatforms } from "@/screens/owner/tabs/finance/FinancePlatforms";
import { FinanceTill } from "@/screens/owner/tabs/finance/FinanceTill";
import { FinanceSettlements } from "@/screens/owner/tabs/finance/FinanceSettlements";
import { FinanceServers } from "@/screens/owner/tabs/finance/FinanceServers";
import { usePinPrompt } from "@/hooks/usePinPrompt";

const BG = "#0D0F14";
const SURFACE = "#161920";
const BORDER = "#2C2F3A";
const TEXT_PRIMARY = "#F1F3F7";
const TEXT_SECONDARY = "#8B90A0";
const AMBER = "#F5A623";

type SubTab = "overview" | "platforms" | "till" | "settlements" | "servers";

const subTabs: { key: SubTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "platforms", label: "Platforms" },
  { key: "till", label: "Till" },
  { key: "settlements", label: "Settlements" },
  { key: "servers", label: "Servers" },
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const isToday = (d: Date) => startOfDay(d).getTime() === startOfDay(new Date()).getTime();
const formatDateLabel = (d: Date) => {
  const day = d.toLocaleDateString("en-US", { weekday: "long" });
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return isToday(d) ? `Today — ${day}, ${date}` : `${day} — ${date}`;
};

export function ManagerFinance() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [activeSub, setActiveSub] = useState<SubTab>("overview");
  const { requirePin, PinPromptModal } = usePinPrompt();

  const shiftDay = (delta: number) => {
    setSelectedDate((d) => {
      const x = new Date(d);
      x.setDate(x.getDate() + delta);
      return startOfDay(x);
    });
  };

  const onExport = () =>
    requirePin(() => Alert.alert("PDF export coming soon."));

  // TODO: edit actions inside the sub-screens (FinanceTill "Mark day
  // complete", any future Disconnect/Reconnect in FinancePlatforms) are
  // not yet gated by the PIN prompt. Adding a manager-aware prop on
  // those sub-screens or a context-based interceptor will be needed
  // when those actions go live for managers.

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Top row */}
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
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <TouchableOpacity onPress={() => shiftDay(-1)} hitSlop={10}>
            <Feather name="chevron-left" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                color: TEXT_PRIMARY,
                fontFamily: "Inter_600SemiBold",
                fontSize: 15,
              }}
            >
              {formatDateLabel(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => shiftDay(1)}
            hitSlop={10}
            disabled={isToday(selectedDate)}
            style={{ opacity: isToday(selectedDate) ? 0.3 : 1 }}
          >
            <Feather name="chevron-right" size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onExport}
          activeOpacity={0.85}
          style={{
            marginLeft: 12,
            borderWidth: 1,
            borderColor: AMBER,
            borderRadius: 8,
            paddingHorizontal: 12,
            height: 32,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Feather name="lock" size={12} color={AMBER} />
          <Text style={{ color: AMBER, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
            Export PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
      >
        {subTabs.map((t) => {
          const active = activeSub === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveSub(t.key)}
              activeOpacity={0.85}
              style={{
                paddingHorizontal: 16,
                height: 36,
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
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeSub === "overview" ? (
          <FinanceOverview selectedDate={selectedDate} />
        ) : activeSub === "platforms" ? (
          <FinancePlatforms />
        ) : activeSub === "till" ? (
          <FinanceTill selectedDate={selectedDate} />
        ) : activeSub === "settlements" ? (
          <FinanceSettlements />
        ) : (
          <FinanceServers />
        )}
      </View>

      <PinPromptModal />
    </View>
  );
}

export default ManagerFinance;
