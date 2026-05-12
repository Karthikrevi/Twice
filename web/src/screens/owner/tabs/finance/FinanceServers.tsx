import { useMemo, useState } from "react";

interface TableServed {
  table: string;
  guests: number;
  items: number;
  total: number;
  duration: string;
  avgPerCover: number;
}
interface Waiter {
  id: string;
  name: string;
  initials: string;
  tables: number;
  covers: number;
  total: number;
  itemsPerCover: number;
  sparkline: number[];
  breakdown: TableServed[];
}

// TODO: replace with GET /reports/servers once available.
const PLACEHOLDER: Waiter[] = [
  {
    id: "w1",
    name: "Layla Hassan",
    initials: "LH",
    tables: 12,
    covers: 36,
    total: 2412,
    itemsPerCover: 4.2,
    sparkline: [180, 220, 140, 260, 200, 240],
    breakdown: [
      { table: "T3", guests: 4, items: 18, total: 312, duration: "1h 04m", avgPerCover: 78 },
      { table: "T7", guests: 2, items: 9, total: 186, duration: "0h 42m", avgPerCover: 93 },
      { table: "T9", guests: 3, items: 13, total: 244, duration: "0h 58m", avgPerCover: 81 },
      { table: "T11", guests: 5, items: 22, total: 412, duration: "1h 22m", avgPerCover: 82 },
    ],
  },
  {
    id: "w2",
    name: "Omar Karim",
    initials: "OK",
    tables: 10,
    covers: 28,
    total: 1820,
    itemsPerCover: 3.6,
    sparkline: [120, 160, 180, 110, 200, 140],
    breakdown: [
      { table: "T2", guests: 2, items: 7, total: 142, duration: "0h 38m", avgPerCover: 71 },
      { table: "T5", guests: 4, items: 14, total: 268, duration: "1h 05m", avgPerCover: 67 },
      { table: "T8", guests: 3, items: 10, total: 198, duration: "0h 49m", avgPerCover: 66 },
    ],
  },
  {
    id: "w3",
    name: "Yasmin Ali",
    initials: "YA",
    tables: 9,
    covers: 25,
    total: 1380,
    itemsPerCover: 2.9,
    sparkline: [110, 140, 90, 120, 150, 100],
    breakdown: [
      { table: "T1", guests: 2, items: 5, total: 112, duration: "0h 33m", avgPerCover: 56 },
      { table: "T6", guests: 3, items: 8, total: 168, duration: "0h 47m", avgPerCover: 56 },
      { table: "T10", guests: 4, items: 11, total: 224, duration: "1h 11m", avgPerCover: 56 },
    ],
  },
  {
    id: "w4",
    name: "Faisal Reza",
    initials: "FR",
    tables: 7,
    covers: 18,
    total: 820,
    itemsPerCover: 2.1,
    sparkline: [80, 100, 70, 90, 110, 60],
    breakdown: [
      { table: "T4", guests: 2, items: 3, total: 78, duration: "0h 26m", avgPerCover: 39 },
      { table: "T12", guests: 3, items: 6, total: 144, duration: "0h 41m", avgPerCover: 48 },
    ],
  },
];

const TARGET_COVER = 65;
const ITEMS_HIGH = 3.5;
const ITEMS_LOW = 2.5;

const perfColor = (itemsPerCover: number) =>
  itemsPerCover > ITEMS_HIGH
    ? "#22C55E"
    : itemsPerCover >= ITEMS_LOW
    ? "#F5A623"
    : "#EF4444";

const RANK = (i: number) =>
  i === 0
    ? { bg: "#F5A623", color: "#000" }
    : i === 1
    ? { bg: "#8B90A0", color: "#FFF" }
    : i === 2
    ? { bg: "#CD7F32", color: "#FFF" }
    : { bg: "#2C2F3A", color: "#8B90A0" };

type Shift = "all" | "lunch" | "dinner";

export default function FinanceServers() {
  const [shift, setShift] = useState<Shift>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const waiters = useMemo(() => {
    const ranked = [...PLACEHOLDER].sort((a, b) => b.total - a.total);
    if (shift === "lunch") return ranked.slice(0, 2);
    if (shift === "dinner") return ranked.slice(2);
    return ranked;
  }, [shift]);

  const totalRevenue = waiters.reduce((s, w) => s + w.total, 0);
  const totalCovers = waiters.reduce((s, w) => s + w.covers, 0);
  const avgPerCover = totalCovers ? totalRevenue / totalCovers : 0;
  const belowTarget = avgPerCover > 0 && avgPerCover < TARGET_COVER;
  const top = waiters[0];

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-text-primary font-bold text-xl">Server performance</h2>
        <div className="flex gap-2">
          {(["all", "lunch", "dinner"] as Shift[]).map((s) => {
            const active = shift === s;
            const label = s === "all" ? "All Shifts" : s === "lunch" ? "Lunch" : "Dinner";
            return (
              <button
                key={s}
                type="button"
                onClick={() => setShift(s)}
                className={`rounded-full px-3 h-8 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-amber text-black"
                    : "bg-surface border border-border text-text-secondary hover:border-amber/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4 mb-6">
        <SummaryCard label="Total dine-in revenue" value={`AED ${totalRevenue.toLocaleString()}`} color="text-amber" caption={`across ${waiters.length} active servers`} />
        <SummaryCard
          label="Average per cover"
          value={`AED ${avgPerCover.toFixed(0)}`}
          color={belowTarget ? "text-status-urgent" : "text-text-primary"}
          caption={`target AED ${TARGET_COVER}`}
        />
        <SummaryCard
          label="Best performer"
          value={top?.name ?? "—"}
          color="text-amber"
          large={false}
          caption={top ? `AED ${(top.total / top.tables).toFixed(0)} avg per table` : ""}
        />
      </div>

      <SectionLabel>Leaderboard</SectionLabel>
      <div className="flex flex-col gap-3 mb-6">
        {waiters.map((w, i) => {
          const c = perfColor(w.itemsPerCover);
          const rs = RANK(i);
          const avgPerTable = w.total / w.tables;
          const topPerformer = i === 0;
          const underperformer = i === waiters.length - 1 && w.itemsPerCover < ITEMS_LOW;
          return (
            <div
              key={w.id}
              className={`bg-surface border border-border rounded-2xl p-4 flex items-center ${
                topPerformer || underperformer ? "border-l-[3px]" : ""
              }`}
              style={{
                borderLeftColor: topPerformer ? "#F5A623" : underperformer ? "#EF4444" : undefined,
              }}
            >
              {/* Rank */}
              <span
                className="w-6 h-6 rounded-full text-[13px] font-bold flex items-center justify-center"
                style={{ backgroundColor: rs.bg, color: rs.color }}
              >
                {i + 1}
              </span>

              {/* Initials */}
              <span
                className="w-10 h-10 rounded-full ml-3 flex items-center justify-center text-amber font-bold text-sm"
                style={{ backgroundColor: "#1E2128", border: "1px solid #2C2F3A" }}
              >
                {w.initials}
              </span>

              {/* Stats */}
              <div className="flex-1 ml-3 min-w-0">
                <p className="text-text-primary font-semibold text-base truncate">{w.name}</p>
                <div className="flex flex-wrap gap-x-3 mt-1">
                  <span className="text-text-secondary text-xs">{w.tables} tables</span>
                  <span className="text-amber text-xs font-semibold">
                    AED {w.total.toLocaleString()} total
                  </span>
                  <span className="text-text-primary text-xs">
                    AED {avgPerTable.toFixed(0)} avg per table
                  </span>
                  <span className="text-xs font-semibold" style={{ color: c }}>
                    {w.itemsPerCover.toFixed(1)} items per cover
                  </span>
                </div>
              </div>

              {/* Sparkline */}
              <Sparkline data={w.sparkline} color={c} />
            </div>
          );
        })}
      </div>

      {/* Breakdown */}
      <SectionLabel>Table by table breakdown</SectionLabel>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {waiters.map((w, i) => {
          const open = expanded === w.id;
          return (
            <div key={w.id}>
              <button
                type="button"
                onClick={() => setExpanded(open ? null : w.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-surfaceActive ${
                  i < waiters.length - 1 && !open ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Chevron open={open} />
                  <span className="text-text-primary font-semibold text-sm">{w.name}</span>
                </div>
                <span className="text-amber font-bold text-sm">
                  AED {w.total.toLocaleString()}
                </span>
              </button>
              {open ? (
                <div className="bg-surfaceActive">
                  <div className="flex px-4 py-2 border-b border-border">
                    <Hd flex={0.7}>Table</Hd>
                    <Hd flex={0.7}>Guests</Hd>
                    <Hd flex={0.7}>Items</Hd>
                    <Hd flex={1}>Total</Hd>
                    <Hd flex={0.9}>Duration</Hd>
                    <Hd flex={1}>Avg / cover</Hd>
                  </div>
                  {w.breakdown.map((row, j) => (
                    <div
                      key={`${w.id}-${j}`}
                      className={`flex items-center px-4 py-2.5 ${
                        j < w.breakdown.length - 1 || i < waiters.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <SubCell flex={0.7} text={row.table} />
                      <SubCell flex={0.7} text={String(row.guests)} />
                      <SubCell flex={0.7} text={String(row.items)} />
                      <SubCell flex={1} text={`AED ${row.total}`} amber />
                      <SubCell flex={0.9} text={row.duration} />
                      <SubCell flex={1} text={`AED ${row.avgPerCover}`} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Info card */}
      <div className="bg-surface border border-border rounded-xl px-4 py-3 mt-4 flex items-center gap-3">
        <InfoIcon />
        <p className="text-text-secondary text-xs">Items per cover target: {ITEMS_HIGH}+</p>
        <span className="flex-1" />
        <span className="text-amber text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity">
          Set in Settings
        </span>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  caption,
  large = true,
}: {
  label: string;
  value: string;
  color: string;
  caption?: string;
  large?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex-1">
      <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
        {label}
      </p>
      <p
        className={`font-bold tracking-tight mt-1 truncate ${
          large ? "text-2xl" : "text-lg"
        } ${color}`}
      >
        {value}
      </p>
      {caption ? (
        <p className="text-text-secondary text-xs mt-1">{caption}</p>
      ) : null}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
      {children}
    </p>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 60;
  const H = 32;
  const max = Math.max(1, ...data);
  const slot = W / data.length;
  const barW = Math.max(2, slot * 0.6);
  return (
    <svg width={W} height={H} className="ml-3">
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * (H - 4));
        const x = i * slot + (slot - barW) / 2;
        const y = H - h;
        return <rect key={i} x={x} y={y} width={barW} height={h} rx={1} fill={color} />;
      })}
    </svg>
  );
}

function Hd({ children, flex }: { children: React.ReactNode; flex: number }) {
  return (
    <span
      className="text-text-secondary text-[10px] uppercase tracking-widest font-medium"
      style={{ flex }}
    >
      {children}
    </span>
  );
}

function SubCell({
  flex,
  text,
  amber,
}: {
  flex: number;
  text: string;
  amber?: boolean;
}) {
  return (
    <span
      className={`text-xs truncate ${
        amber ? "text-amber font-semibold" : "text-text-primary font-normal"
      }`}
      style={{ flex }}
    >
      {text}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
