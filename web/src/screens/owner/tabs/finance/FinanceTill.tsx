import { useMemo } from "react";
import { useDailyReport } from "@/hooks/useReports";
import { useOrders } from "@/hooks/useOrders";

const safe = (n: number | undefined | null) =>
  Number.isFinite(n) ? (n as number) : 0;

const formatTime = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const formatDateLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function FinanceTill({ selectedDate }: { selectedDate: Date }) {
  const report = useDailyReport();
  const orders = useOrders();

  const tills = report.data?.tills ?? {};
  const cashCents = safe(tills.cash);
  const cardCents = safe(tills.card);
  const walletCents = safe(tills.wallet);
  const recordedCents = cashCents + cardCents + walletCents;

  const expectedCents = useMemo(() => {
    return (orders.data ?? []).reduce((s, o) => {
      try {
        if (new Date(o.placedAt).toDateString() === selectedDate.toDateString())
          return s + Math.round(o.total * 100);
      } catch {
        /* ignore */
      }
      return s;
    }, 0);
  }, [orders.data, selectedDate]);

  const discrepancyCents = recordedCents - expectedCents;
  const matches = Math.abs(discrepancyCents) < 1;

  const takeawayRows = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) => o.platform === "takeaway" && o.status === "done"
      ),
    [orders.data]
  );

  const onMarkDayComplete = () => {
    if (
      window.confirm(
        "Mark this day as complete? This will lock today's records."
      )
    ) {
      // TODO: wire to backend close-day endpoint.
    }
  };

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
          Till reconciliation
        </p>
        <p className="text-text-secondary text-xs">{formatDateLabel(selectedDate)}</p>
      </div>

      {/* Payment cards */}
      <div className="flex gap-4 mb-6">
        <PaymentCard label="Cash" accent="#22C55E" value={cashCents / 100} />
        <PaymentCard label="Card" accent="#3B82F6" value={cardCents / 100} />
        <PaymentCard label="Wallet" accent="#7C6AF5" value={walletCents / 100} />
      </div>

      {/* Dine-in breakdown */}
      <SectionCard title="Dine-in breakdown">
        <ColumnRow>
          <Col flex={0.9}>Table</Col>
          <Col flex={0.7}>Guests</Col>
          <Col flex={1}>Total</Col>
          <Col flex={0.9}>Method</Col>
          <Col flex={0.8}>Time</Col>
          <Col flex={1}>Closed by</Col>
        </ColumnRow>
        <EmptyTable label="No closed sessions today" />
      </SectionCard>

      {/* Takeaway breakdown */}
      <SectionCard title="Takeaway breakdown">
        <ColumnRow>
          <Col flex={1.1}>Order ID</Col>
          <Col flex={0.7}>Items</Col>
          <Col flex={1}>Total</Col>
          <Col flex={0.9}>Method</Col>
          <Col flex={0.8}>Time</Col>
        </ColumnRow>
        {takeawayRows.length === 0 ? (
          <EmptyTable label="No takeaway orders today" />
        ) : (
          takeawayRows.map((o, i, arr) => {
            const itemCount = o.items.reduce((s, it) => s + it.qty, 0);
            return (
              <div
                key={o.id}
                className={`flex items-center px-4 py-3 ${
                  i < arr.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <Cell flex={1.1} text={o.shortId} muted />
                <Cell flex={0.7} text={String(itemCount)} muted />
                <Cell flex={1} text={`AED ${o.total.toFixed(0)}`} amber />
                <Cell flex={0.9} text="—" muted />
                <Cell flex={0.8} text={formatTime(o.placedAt)} muted />
              </div>
            );
          })
        )}
      </SectionCard>

      {/* End of day summary */}
      <div className="bg-surface border border-border rounded-2xl p-5 mt-6">
        <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mb-4">
          End of day summary
        </p>
        <div className="flex gap-6">
          <SummaryColumn label="Expected total" value={`AED ${(expectedCents / 100).toFixed(0)}`} color="text-text-primary" />
          <SummaryColumn
            label="Recorded total"
            value={`AED ${(recordedCents / 100).toFixed(0)}`}
            color={matches ? "text-status-available" : "text-status-urgent"}
            icon={matches ? <CheckIcon /> : undefined}
          />
          <SummaryColumn
            label="Discrepancy"
            value={`${discrepancyCents >= 0 ? "+" : "−"}${Math.abs(
              discrepancyCents / 100
            ).toFixed(0)}`}
            color={matches ? "text-status-available" : "text-status-urgent"}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onMarkDayComplete}
        className="mt-4 w-full h-[52px] bg-amber rounded-xl text-black font-semibold text-sm hover:bg-amber-pressed transition-colors"
      >
        Mark day complete
      </button>
    </div>
  );
}

function PaymentCard({
  label,
  accent,
  value,
}: {
  label: string;
  accent: string;
  value: number;
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
        AED {value.toFixed(0)}
      </p>
      <p className="text-text-secondary text-xs mt-1">— transactions</p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden mt-6">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-amber font-semibold text-xs uppercase tracking-widest">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function ColumnRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex px-4 py-2 border-b border-border">{children}</div>
  );
}

function Col({ flex, children }: { flex: number; children: React.ReactNode }) {
  return (
    <span
      className="text-text-secondary text-xs uppercase tracking-widest font-medium"
      style={{ flex }}
    >
      {children}
    </span>
  );
}

function Cell({
  flex,
  text,
  muted,
  amber,
}: {
  flex: number;
  text: string;
  muted?: boolean;
  amber?: boolean;
}) {
  const color = amber ? "text-amber" : muted ? "text-text-secondary" : "text-text-primary";
  const weight = amber ? "font-semibold" : "font-normal";
  return (
    <span
      className={`text-xs truncate ${color} ${weight}`}
      style={{ flex }}
    >
      {text}
    </span>
  );
}

function EmptyTable({ label }: { label: string }) {
  return (
    <div className="px-4 py-6 text-center">
      <p className="text-text-muted text-sm">{label}</p>
    </div>
  );
}

function SummaryColumn({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex-1">
      <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
        {label}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <p className={`font-bold text-2xl tracking-tight ${color}`}>{value}</p>
        {icon}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="16 10 11 15 8 12" />
    </svg>
  );
}
