import { useState } from "react";
import FinanceOverview from "@/screens/owner/tabs/finance/FinanceOverview";
import FinancePlatforms from "@/screens/owner/tabs/finance/FinancePlatforms";
import FinanceTill from "@/screens/owner/tabs/finance/FinanceTill";
import FinanceSettlements from "@/screens/owner/tabs/finance/FinanceSettlements";
import FinanceServers from "@/screens/owner/tabs/finance/FinanceServers";
import { usePinPrompt } from "@/hooks/usePinPrompt";

type SubTab = "overview" | "platforms" | "till" | "settlements" | "servers";

const SUB_TABS: { key: SubTab; label: string }[] = [
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
const isToday = (d: Date) =>
  startOfDay(d).getTime() === startOfDay(new Date()).getTime();
const formatDate = (d: Date) => {
  const today = isToday(d);
  const day = d.toLocaleDateString("en-US", { weekday: "long" });
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return today ? `Today — ${day}, ${date}` : `${day} — ${date}`;
};

export default function ManagerFinance() {
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date())
  );
  const [active, setActive] = useState<SubTab>("overview");
  const { requirePin, PinPromptModal } = usePinPrompt();

  const shift = (delta: number) =>
    setSelectedDate((d) => {
      const x = new Date(d);
      x.setDate(x.getDate() + delta);
      return startOfDay(x);
    });

  const doExport = () => alert("PDF export coming soon.");
  const onExport = () => requirePin(doExport);

  // TODO: edit actions inside FinanceTill / FinancePlatforms aren't gated
  // yet — would require a prop hook or context interceptor.

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
            aria-label="Previous day"
          >
            <ChevronLeft />
          </button>
          <p className="font-semibold text-text-primary text-sm">
            {formatDate(selectedDate)}
          </p>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={isToday(selectedDate)}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight />
          </button>
        </div>

        <button
          type="button"
          onClick={onExport}
          className="px-4 h-8 rounded-lg border border-amber text-amber text-xs font-semibold hover:bg-amber/10 transition-colors flex items-center gap-2"
        >
          <LockIcon />
          Export PDF
        </button>
      </div>

      {/* Sub-tab pills */}
      <div className="px-6 py-3 flex gap-2 border-b border-border overflow-x-auto">
        {SUB_TABS.map((t) => {
          const a = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`rounded-full px-4 h-8 text-xs font-semibold transition-colors whitespace-nowrap ${
                a
                  ? "bg-amber text-black"
                  : "bg-surface border border-border text-text-secondary hover:border-amber/50"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {active === "overview" ? (
          <FinanceOverview selectedDate={selectedDate} />
        ) : active === "platforms" ? (
          <FinancePlatforms />
        ) : active === "till" ? (
          <FinanceTill selectedDate={selectedDate} />
        ) : active === "settlements" ? (
          <FinanceSettlements />
        ) : (
          <FinanceServers />
        )}
      </div>

      <PinPromptModal />
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
