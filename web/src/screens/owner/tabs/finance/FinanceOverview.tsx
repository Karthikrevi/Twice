import { useMemo } from "react";
import { useDailyReport } from "@/hooks/useReports";
import { useOrders } from "@/hooks/useOrders";
import { theme, platformLabel } from "@/lib/theme";
import type { PlatformKey } from "@/types";

const PLATFORM_KEYS: PlatformKey[] = [
  "talabat",
  "deliveroo",
  "instashop",
  "dinein",
  "takeaway",
];

const safe = (n: number | undefined | null) =>
  Number.isFinite(n) ? (n as number) : 0;

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function FinanceOverview({
  selectedDate,
}: {
  selectedDate: Date;
}) {
  const report = useDailyReport();
  const orders = useOrders();

  const byPlatform = report.data?.byPlatform ?? [];
  const tills = report.data?.tills ?? {};

  const gross = useMemo(
    () => byPlatform.reduce((s, r) => s + safe(r.gross), 0) / 100,
    [byPlatform]
  );
  const commission = useMemo(
    () => byPlatform.reduce((s, r) => s + safe(r.commission), 0) / 100,
    [byPlatform]
  );
  const net = gross - commission;

  const counts = useMemo(() => {
    const base: Record<PlatformKey, number> = {
      talabat: 0,
      deliveroo: 0,
      instashop: 0,
      dinein: 0,
      takeaway: 0,
    };
    (orders.data ?? []).forEach((o) => {
      try {
        if (sameDay(new Date(o.placedAt), selectedDate)) base[o.platform]++;
      } catch {
        /* skip */
      }
    });
    return base;
  }, [orders.data, selectedDate]);

  return (
    <div className="px-6 py-5">
      {/* Three metric cards */}
      <div className="flex gap-4 mb-6">
        <MetricCard label="Gross revenue" value={`AED ${gross.toFixed(0)}`} color="text-text-primary" />
        <MetricCard label="Commission" value={`−${commission.toFixed(0)}`} color="text-status-urgent" />
        <MetricCard label="Net revenue" value={`${net.toFixed(0)}`} color="text-amber" />
      </div>

      {/* By Channel */}
      <SectionLabel>By channel</SectionLabel>
      {byPlatform.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-5 py-6 text-center">
          <p className="text-text-muted text-sm">No channel revenue for this day.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {byPlatform.map((row, i) => {
            const key = row.platform as PlatformKey;
            const rate = safe(row.rate);
            const rowGross = safe(row.gross) / 100;
            const rowFee = safe(row.commission) / 100;
            return (
              <div
                key={key}
                className={`px-5 py-3 flex items-center ${
                  i < byPlatform.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span
                  className="block rounded-sm mr-3"
                  style={{
                    width: 8,
                    height: 28,
                    backgroundColor: theme.platform[key],
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-text-primary truncate">
                    {platformLabel[key]}
                  </p>
                  <p className="text-text-secondary text-xs mt-0.5">
                    {rate > 0 ? `${Math.round(rate * 100)}% commission` : "Direct"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-text-primary text-sm font-semibold">
                    AED {rowGross.toFixed(0)}
                  </p>
                  {rate > 0 ? (
                    <p className="text-status-urgent text-xs mt-0.5">
                      −{rowFee.toFixed(0)} fee
                    </p>
                  ) : (
                    <p className="text-text-muted text-xs mt-0.5">no fee</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Till verification */}
      <SectionLabel>Till verification</SectionLabel>
      <div className="flex gap-4">
        <TillCard label="Cash" value={safe(tills.cash) / 100} accent="#22C55E" />
        <TillCard label="Card" value={safe(tills.card) / 100} accent="#3B82F6" />
        <TillCard label="Wallet" value={safe(tills.wallet) / 100} accent="#7C6AF5" />
      </div>

      {/* Order breakdown */}
      <SectionLabel>Order breakdown</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {PLATFORM_KEYS.map((key) => {
          const c = theme.platform[key];
          const n = counts[key];
          return (
            <span
              key={key}
              className="rounded-full px-3 h-7 text-xs font-semibold flex items-center gap-1.5"
              style={{
                backgroundColor: c + "33",
                border: `1px solid ${c}66`,
                color: c,
              }}
            >
              <span>{platformLabel[key]}</span>
              <span className="text-text-secondary text-xs font-medium">
                {n} {n === 1 ? "order" : "orders"}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex-1">
      <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
        {label}
      </p>
      <p className={`font-bold text-2xl mt-1 tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function TillCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      className="bg-surface border border-border rounded-2xl p-4 flex-1 border-l-4"
      style={{ borderLeftColor: accent }}
    >
      <p className="text-text-muted uppercase text-xs font-semibold tracking-widest">
        {label}
      </p>
      <p className="font-bold text-xl text-text-primary mt-1 tracking-tight">
        {value.toFixed(0)}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mt-6 mb-3">
      {children}
    </p>
  );
}
