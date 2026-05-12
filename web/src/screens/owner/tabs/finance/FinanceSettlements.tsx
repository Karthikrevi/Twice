import { useMemo, useState } from "react";
import { theme, platformLabel } from "@/lib/theme";
import type { PlatformKey } from "@/types";

type Filter = "all" | "talabat" | "deliveroo" | "instashop";
type Status = "Paid" | "Pending" | "Overdue";

interface SettlementRow {
  id: string;
  platform: "talabat" | "deliveroo" | "instashop";
  period: string;
  gross: number;
  commission: number;
  net: number;
  expected: string;
  received: string | null;
  status: Status;
  pendingDays?: number;
}

// TODO: replace with GET /reports/settlements once exposed.
const PLACEHOLDER: SettlementRow[] = [
  { id: "s1", platform: "talabat", period: "Apr 22–28", gross: 8420, commission: 2105, net: 6315, expected: "May 5", received: "May 5", status: "Paid" },
  { id: "s2", platform: "deliveroo", period: "Apr 22–28", gross: 5912, commission: 1656, net: 4256, expected: "May 5", received: "May 6", status: "Paid" },
  { id: "s3", platform: "instashop", period: "Apr 22–28", gross: 2104, commission: 463, net: 1641, expected: "May 5", received: "May 5", status: "Paid" },
  { id: "s4", platform: "talabat", period: "Apr 29 – May 5", gross: 9120, commission: 2280, net: 6840, expected: "May 12", received: null, status: "Pending", pendingDays: 3 },
  { id: "s5", platform: "deliveroo", period: "Apr 29 – May 5", gross: 6440, commission: 1803, net: 4637, expected: "May 12", received: null, status: "Pending", pendingDays: 3 },
  { id: "s6", platform: "instashop", period: "Apr 15–21", gross: 1820, commission: 400, net: 1420, expected: "Apr 28", received: null, status: "Overdue", pendingDays: 8 },
];

const STATUS_COLOR: Record<Status, string> = {
  Paid: "#22C55E",
  Pending: "#F5A623",
  Overdue: "#EF4444",
};

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: "all", label: "All Platforms", color: "#F5A623" },
  { key: "talabat", label: "Talabat", color: theme.platform.talabat },
  { key: "deliveroo", label: "Deliveroo", color: theme.platform.deliveroo },
  { key: "instashop", label: "InstaShop", color: theme.platform.instashop },
];

export default function FinanceSettlements() {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () => (filter === "all" ? PLACEHOLDER : PLACEHOLDER.filter((r) => r.platform === filter)),
    [filter]
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          gross: acc.gross + r.gross,
          commission: acc.commission + r.commission,
          net: acc.net + r.net,
        }),
        { gross: 0, commission: 0, net: 0 }
      ),
    [rows]
  );

  const outstanding = useMemo(() => {
    const pending = PLACEHOLDER.filter((r) => r.status !== "Paid");
    const total = pending.reduce((s, r) => s + r.net, 0);
    const oldest = pending.reduce((d, r) => Math.max(d, r.pendingDays ?? 0), 0);
    const platforms = Array.from(new Set(pending.map((p) => p.platform)));
    const byPlatform = platforms.map((p) => ({
      platform: p,
      total: pending.filter((r) => r.platform === p).reduce((s, r) => s + r.net, 0),
    }));
    return { total, oldest, platforms: platforms.length, byPlatform };
  }, []);

  return (
    <div className="flex h-full">
      {/* LEFT */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-bold text-xl">Settlement history</h2>
          <div className="bg-surface border border-border rounded-lg px-3 h-9 flex items-center gap-2 text-text-secondary text-xs cursor-pointer hover:border-amber/50 transition-colors">
            Apr 2026 — May 2026
            <CalendarIcon />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map((f) => {
            const a = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="rounded-full px-4 h-9 text-xs font-semibold transition-colors"
                style={
                  a
                    ? { backgroundColor: f.color, color: "#000" }
                    : {
                        backgroundColor: "#161920",
                        border: "1px solid #2C2F3A",
                        color: "#8B90A0",
                      }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Table card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex px-4 py-2 border-b border-border">
            <Hd flex={1.1}>Platform</Hd>
            <Hd flex={1.1}>Period</Hd>
            <Hd flex={0.9}>Gross</Hd>
            <Hd flex={1}>Commission</Hd>
            <Hd flex={0.9}>Net</Hd>
            <Hd flex={0.9}>Expected</Hd>
            <Hd flex={0.9}>Received</Hd>
            <Hd flex={0.9}>Status</Hd>
            <Hd flex={0.9} align="right">Action</Hd>
          </div>

          {rows.map((row, i) => {
            const overdue = row.status === "Overdue";
            const platformColor = theme.platform[row.platform as PlatformKey];
            const statusColor = STATUS_COLOR[row.status];
            return (
              <div
                key={row.id}
                className={`flex items-center px-4 py-3 ${
                  i < rows.length - 1 ? "border-b border-border" : ""
                } ${overdue ? "border-l-4" : ""}`}
                style={{
                  borderLeftColor: overdue ? "#EF4444" : undefined,
                  backgroundColor: overdue ? "#EF44440F" : undefined,
                }}
              >
                <div style={{ flex: 1.1 }}>
                  <span
                    className="rounded-full px-2 h-5 text-[10px] font-semibold uppercase tracking-wider inline-flex items-center"
                    style={{
                      backgroundColor: platformColor + "33",
                      color: platformColor,
                    }}
                  >
                    {platformLabel[row.platform as PlatformKey]}
                  </span>
                </div>
                <Cell flex={1.1} text={row.period} muted />
                <Cell flex={0.9} text={`AED ${row.gross.toLocaleString()}`} />
                <span className="text-status-urgent text-xs font-medium" style={{ flex: 1 }}>
                  −AED {row.commission.toLocaleString()}
                </span>
                <span className="text-amber text-xs font-semibold" style={{ flex: 0.9 }}>
                  AED {row.net.toLocaleString()}
                </span>
                <Cell flex={0.9} text={row.expected} muted />
                <Cell flex={0.9} text={row.received ?? "—"} muted />
                <div style={{ flex: 0.9 }}>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: statusColor + "33",
                      color: statusColor,
                    }}
                  >
                    {row.status}
                  </span>
                </div>
                <div style={{ flex: 0.9 }} className="text-right">
                  <button
                    type="button"
                    onClick={() => alert("Settlement detail coming soon.")}
                    className="text-amber text-xs font-semibold hover:opacity-80 transition-opacity"
                  >
                    View details
                  </button>
                </div>
              </div>
            );
          })}

          {/* Footer totals */}
          <div className="flex items-center px-4 py-3 border-t border-border bg-bg">
            <div style={{ flex: 2.2 }} />
            <FooterCell flex={0.9} label="Total Gross" value={`AED ${totals.gross.toLocaleString()}`} color="text-text-primary" />
            <FooterCell flex={1} label="Total Commission" value={`−${totals.commission.toLocaleString()}`} color="text-status-urgent" />
            <FooterCell flex={0.9} label="Total Net" value={`AED ${totals.net.toLocaleString()}`} color="text-amber" bold />
            <div style={{ flex: 2.7 }} />
          </div>
        </div>
      </div>

      {/* RIGHT — Outstanding */}
      <div className="w-64 px-4 py-5 border-l border-border">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
            Outstanding settlements
          </p>
          <p className="text-amber font-bold text-2xl tracking-tight mt-2">
            AED {outstanding.total.toLocaleString()}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            across {outstanding.platforms} {outstanding.platforms === 1 ? "platform" : "platforms"}
          </p>

          <div className="h-px bg-border my-4" />

          <p className="text-text-secondary text-xs">Oldest pending</p>
          <p
            className={`font-semibold text-sm mt-1 ${
              outstanding.oldest >= 7 ? "text-status-urgent" : "text-amber"
            }`}
          >
            {outstanding.oldest} {outstanding.oldest === 1 ? "day" : "days"}
          </p>

          <div className="h-px bg-border my-4" />

          <div className="flex flex-col gap-2.5">
            {outstanding.byPlatform.map((p) => {
              const c = theme.platform[p.platform as PlatformKey];
              return (
                <div key={p.platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="block w-2 h-2 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                    <span className="text-text-secondary text-xs font-medium">
                      {platformLabel[p.platform as PlatformKey]}
                    </span>
                  </div>
                  <span className="text-amber text-xs font-semibold">
                    AED {p.total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hd({
  children,
  flex,
  align = "left",
}: {
  children: React.ReactNode;
  flex: number;
  align?: "left" | "right";
}) {
  return (
    <span
      className="text-text-secondary text-[10px] uppercase tracking-widest font-medium"
      style={{ flex, textAlign: align }}
    >
      {children}
    </span>
  );
}

function Cell({
  flex,
  text,
  muted,
}: {
  flex: number;
  text: string;
  muted?: boolean;
}) {
  return (
    <span
      className={`text-xs truncate ${
        muted ? "text-text-secondary font-normal" : "text-text-primary font-medium"
      }`}
      style={{ flex }}
    >
      {text}
    </span>
  );
}

function FooterCell({
  label,
  value,
  color,
  flex,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  flex: number;
  bold?: boolean;
}) {
  return (
    <div style={{ flex }}>
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold">
        {label}
      </p>
      <p className={`mt-1 ${bold ? "font-bold text-sm" : "font-semibold text-xs"} ${color}`}>
        {value}
      </p>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
