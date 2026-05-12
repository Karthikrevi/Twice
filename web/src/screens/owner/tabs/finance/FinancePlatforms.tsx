import { useMemo, useState } from "react";
import { useDailyReport } from "@/hooks/useReports";
import { theme, platformLabel } from "@/lib/theme";
import type { PlatformKey } from "@/types";

type Filter = "all" | PlatformKey;

const PLATFORM_KEYS: PlatformKey[] = [
  "talabat",
  "deliveroo",
  "instashop",
  "dinein",
  "takeaway",
];

const safe = (n: number | undefined | null) =>
  Number.isFinite(n) ? (n as number) : 0;

// TODO: replace with /reports/weekly when the backend exposes it.
function mockWeek(key: PlatformKey): number[] {
  const base: Record<PlatformKey, number[]> = {
    talabat: [820, 940, 760, 1240, 1180, 1430, 1520],
    deliveroo: [610, 690, 720, 580, 740, 880, 950],
    instashop: [240, 310, 260, 290, 340, 410, 380],
    dinein: [1240, 1340, 1180, 1490, 2010, 2380, 2510],
    takeaway: [410, 460, 380, 520, 590, 640, 680],
  };
  return base[key];
}
function mockDay(key: PlatformKey): number[] {
  const peak = key === "dinein" ? [12, 13, 18, 19, 20] : [12, 13, 18, 19, 20, 21];
  return Array.from({ length: 24 }, (_, h) =>
    peak.includes(h) ? 4 + (h % 3) : h >= 9 && h <= 23 ? 1 + (h % 2) : 0
  );
}
const mockHistory = [
  { period: "This week", gross: 8420, rate: 0.25, commission: 2105, net: 6315, status: "Pending" as const },
  { period: "Last week", gross: 7980, rate: 0.25, commission: 1995, net: 5985, status: "Paid" as const },
  { period: "Two weeks ago", gross: 6650, rate: 0.25, commission: 1663, net: 4988, status: "Paid" as const },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function FinancePlatforms() {
  const report = useDailyReport();
  const [filter, setFilter] = useState<Filter>("all");

  const byPlatform = report.data?.byPlatform ?? [];
  const rowByPlatform = useMemo(() => {
    const m = new Map<PlatformKey, (typeof byPlatform)[number]>();
    byPlatform.forEach((r) => m.set(r.platform as PlatformKey, r));
    return m;
  }, [byPlatform]);

  return (
    <div className="px-6 py-5">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        <PillButton
          label="All"
          color="#F5A623"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {PLATFORM_KEYS.map((k) => (
          <PillButton
            key={k}
            label={platformLabel[k]}
            color={theme.platform[k]}
            active={filter === k}
            onClick={() => setFilter(k)}
          />
        ))}
      </div>

      {filter === "all" ? (
        <AllView rowByPlatform={rowByPlatform} onSelect={setFilter} />
      ) : (
        <DeepDive platform={filter} row={rowByPlatform.get(filter)} />
      )}
    </div>
  );
}

function PillButton({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 h-9 text-xs font-semibold transition-colors"
      style={
        active
          ? { backgroundColor: color, color: "#000" }
          : {
              backgroundColor: "#161920",
              border: "1px solid #2C2F3A",
              color: "#8B90A0",
            }
      }
    >
      {label}
    </button>
  );
}

function AllView({
  rowByPlatform,
  onSelect,
}: {
  rowByPlatform: Map<PlatformKey, any>;
  onSelect: (p: PlatformKey) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {PLATFORM_KEYS.map((k) => {
        const c = theme.platform[k];
        const row = rowByPlatform.get(k);
        const gross = safe(row?.gross) / 100;
        const commission = safe(row?.commission) / 100;
        const net = gross - commission;
        const isDelivery = k === "talabat" || k === "deliveroo" || k === "instashop";

        return (
          <button
            key={k}
            type="button"
            onClick={() => onSelect(k)}
            className="bg-surface border border-border rounded-2xl p-5 text-left transition-colors hover:border-text-muted/60"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base"
                style={{ backgroundColor: c }}
              >
                {platformLabel[k][0]}
              </span>
              <div className="flex-1">
                <p className="text-text-primary font-semibold text-base">
                  {platformLabel[k]}
                </p>
              </div>
              <span
                className="rounded-full px-3 h-6 text-xs font-semibold flex items-center"
                style={{
                  backgroundColor: c + "33",
                  border: `1px solid ${c}66`,
                  color: c,
                }}
              >
                {isDelivery ? "Connected" : "Direct"}
              </span>
            </div>
            <div className="flex gap-6 mt-4">
              <Stat label="Gross" value={`AED ${gross.toFixed(0)}`} color="text-text-primary" />
              <Stat label="Commission" value={`−${commission.toFixed(0)}`} color="text-status-urgent" />
              <Stat label="Net" value={`${net.toFixed(0)}`} color="text-amber" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <p className="text-text-secondary text-[10px] uppercase tracking-widest font-semibold">
        {label}
      </p>
      <p className={`font-semibold text-sm mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}

function DeepDive({
  platform,
  row,
}: {
  platform: PlatformKey;
  row: any | undefined;
}) {
  const c = theme.platform[platform];
  const gross = safe(row?.gross) / 100;
  const commission = safe(row?.commission) / 100;
  const net = gross - commission;
  const rate = safe(row?.rate);
  const week = mockWeek(platform);
  const hours = mockDay(platform);

  return (
    <div>
      {/* Metrics */}
      <div className="flex gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 flex-1">
          <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
            Gross revenue
          </p>
          <p className="font-bold text-2xl text-text-primary tracking-tight mt-1">
            AED {gross.toFixed(0)}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            Commission rate: {Math.round(rate * 100)}%
          </p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 flex-1">
          <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
            Commission
          </p>
          <p className="font-bold text-2xl text-status-urgent tracking-tight mt-1">
            −{commission.toFixed(0)}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 flex-1">
          <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
            Net revenue
          </p>
          <p className="font-bold text-2xl text-amber tracking-tight mt-1">
            {net.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      <ChartCard title="Revenue — last 7 days">
        <LineChart data={week} color={c} />
        <div className="flex justify-between mt-2">
          {DAYS.map((d) => (
            <span key={d} className="text-text-muted text-[10px] uppercase tracking-widest">
              {d}
            </span>
          ))}
        </div>
      </ChartCard>

      {/* Settlement status */}
      <ChartCard title="Settlement status">
        <div className="rounded-lg px-4 py-2.5 mb-2" style={{ backgroundColor: "#22C55E22" }}>
          <p className="text-status-available text-sm font-medium">
            Last settlement: AED 5,820 · Received May 8
          </p>
        </div>
        <div className="rounded-lg px-4 py-2.5" style={{ backgroundColor: "#F5A62322" }}>
          <p className="text-amber text-sm font-medium">
            Pending settlement: AED 2,105 · Expected May 15
          </p>
        </div>
      </ChartCard>

      {/* Order breakdown bar chart */}
      <ChartCard title="Order breakdown">
        <BarChart data={hours} color={c} />
        <div className="flex justify-between mt-2">
          {[0, 6, 12, 18, 23].map((h) => (
            <span key={h} className="text-text-muted text-[10px]">
              {h.toString().padStart(2, "0")}
            </span>
          ))}
        </div>
      </ChartCard>

      {/* Commission history */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mt-4">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
            Commission history
          </p>
        </div>
        {mockHistory.map((r, i) => (
          <div
            key={r.period}
            className={`flex items-center px-4 py-3 ${
              i < mockHistory.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div style={{ flex: 1.4 }}>
              <p className="text-text-secondary text-xs">{r.period}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p className="text-text-primary text-sm font-medium">
                AED {r.gross.toLocaleString()}
              </p>
              <p className="text-text-secondary text-[10px] mt-0.5">
                {Math.round(r.rate * 100)}%
              </p>
            </div>
            <p
              className="text-status-urgent text-sm font-medium"
              style={{ flex: 1 }}
            >
              −{r.commission.toLocaleString()}
            </p>
            <p className="text-amber text-sm font-medium" style={{ flex: 1 }}>
              {r.net.toLocaleString()}
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: (r.status === "Paid" ? "#22C55E" : "#F5A623") + "33",
                color: r.status === "Paid" ? "#22C55E" : "#F5A623",
              }}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 mt-4">
      <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function LineChart({ data, color }: { data: number[]; color: string }) {
  const W = 700;
  const H = 120;
  const padX = 12;
  const padY = 10;
  const max = Math.max(1, ...data);
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((v, i) => ({
    x: padX + i * step,
    y: padY + innerH - (v / max) * innerH,
  }));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${(padX + innerW).toFixed(1)} ${(H - padY).toFixed(1)} ` +
    `L ${padX.toFixed(1)} ${(H - padY).toFixed(1)} Z`;
  const gridY = [0.25, 0.5, 0.75].map((p) => padY + innerH * p);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {gridY.map((y, i) => (
        <line
          key={`g${i}`}
          x1={padX}
          y1={y}
          x2={W - padX}
          y2={y}
          stroke="#2C2F3A"
          strokeWidth={1}
        />
      ))}
      <path d={areaPath} fill={color} fillOpacity={0.15} />
      <path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={`d${i}`} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}
    </svg>
  );
}

function BarChart({ data, color }: { data: number[]; color: string }) {
  const W = 700;
  const H = 80;
  const padX = 8;
  const padY = 4;
  const max = Math.max(1, ...data);
  const innerW = W - padX * 2;
  const innerH = H - padY;
  const slot = innerW / data.length;
  const barW = Math.max(2, slot * 0.7);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * (innerH - padY));
        const x = padX + i * slot + (slot - barW) / 2;
        const y = H - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={2}
            fill={v > 0 ? color : "#2C2F3A"}
            opacity={v > 0 ? 1 : 0.4}
          />
        );
      })}
    </svg>
  );
}
