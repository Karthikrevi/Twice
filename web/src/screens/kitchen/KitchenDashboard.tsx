import { useEffect, useMemo, useRef, useState } from "react";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { useSocketSync } from "@/hooks/useSocketSync";
import { nextStatus, minutesSince } from "@/lib/adapters";
import { theme, platformLabel } from "@/lib/theme";
import type { Order, OrderStatus, PlatformKey } from "@/types";

const DONE_FADE_MS = 30_000;

// TODO: read kitchen_output from /auth/me once the server returns it.
const KITCHEN_OUTPUT: "screen" | "printer" = "screen";

const STATUS_BLUE = "#2563EB";

const formatClock = (d: Date) => {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
};

export default function KitchenDashboard() {
  useSocketSync();

  const orders = useOrders();
  const tables = useTables();
  const advance = useAdvanceOrderStatus();

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const doneAtRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const t = Date.now();
    const map = doneAtRef.current;
    (orders.data ?? []).forEach((o) => {
      if (o.status === "done" && !map.has(o.id)) map.set(o.id, t);
      if (o.status !== "done" && map.has(o.id)) map.delete(o.id);
    });
  }, [orders.data]);

  const guestsByTable = useMemo(() => {
    const m = new Map<string, number>();
    (tables.data ?? []).forEach((t) => m.set(t.id, t.guests ?? 0));
    return m;
  }, [tables.data]);

  const visible = useMemo(() => {
    const list = orders.data ?? [];
    const t = now.getTime();
    return list.filter((o) => {
      if (o.status !== "done") return true;
      const doneAt = doneAtRef.current.get(o.id) ?? t;
      return t - doneAt < DONE_FADE_MS;
    });
  }, [orders.data, now]);

  if (KITCHEN_OUTPUT === "printer") {
    return <PrinterMode />;
  }

  return (
    <div className="bg-bg h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-12 border-b border-border px-6 flex items-center justify-between flex-shrink-0">
        <p className="text-amber font-semibold text-sm tracking-[1.6px]">
          Once — Kitchen
        </p>
        <p className="text-text-secondary text-sm tabular-nums">
          {formatClock(now)}
        </p>
      </header>

      {/* Tickets */}
      {orders.isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-sm">Loading tickets…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-text-primary font-semibold text-base">
            All caught up
          </p>
          <p className="text-text-muted text-sm mt-1">
            New tickets will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-row gap-4 px-6 py-4 overflow-x-auto flex-1">
          {visible.map((o) => (
            <Ticket
              key={o.id}
              order={o}
              guests={o.tableId ? guestsByTable.get(o.tableId) ?? 0 : 0}
              onAdvance={() =>
                advance.mutate({ id: o.id, status: nextStatus(o.status) })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Ticket({
  order,
  guests,
  onAdvance,
}: {
  order: Order;
  guests: number;
  onAdvance: () => void;
}) {
  const mins = minutesSince(order.placedAt);
  const elapsedClass =
    mins >= 15
      ? "text-status-urgent"
      : mins >= 10
      ? "text-amber"
      : "text-text-primary";
  const isDinein = order.platform === "dinein";
  const isDone = order.status === "done";
  const platformColor = theme.platform[order.platform as PlatformKey];

  return (
    <article
      className="relative w-64 flex-shrink-0 bg-surface rounded-2xl p-4 overflow-hidden"
      style={{
        border: `1px solid ${isDone ? "#22C55E33" : "#2C2F3A"}`,
      }}
    >
      <div className={isDone ? "opacity-40" : ""}>
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="rounded-full px-3 h-7 text-[11px] font-bold uppercase tracking-wider flex items-center text-white"
            style={{ backgroundColor: platformColor }}
          >
            {platformLabel[order.platform as PlatformKey]}
          </span>
          <span className="text-text-secondary text-xs">{order.shortId}</span>
        </div>

        {/* Guest count */}
        {isDinein ? (
          <p className="text-text-secondary text-sm mb-2">
            {guests} {guests === 1 ? "Guest" : "Guests"}
          </p>
        ) : null}

        {/* Items */}
        <ul className="space-y-1.5 mb-3">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-baseline gap-2">
              <span
                className="font-bold text-xl tabular-nums"
                style={{ color: platformColor }}
              >
                {it.qty}
              </span>
              <span className="font-semibold text-lg text-text-primary leading-tight">
                {it.name}
              </span>
            </li>
          ))}
        </ul>

        {/* Notes */}
        {order.specialInstructions ? (
          <p
            className="text-sm italic mb-3"
            style={{ color: platformColor }}
          >
            {order.specialInstructions}
          </p>
        ) : null}

        {/* Time */}
        <p className={`text-xs font-semibold mb-3 ${elapsedClass}`}>
          {mins} {mins === 1 ? "min" : "mins"} ago
        </p>

        {/* Buttons */}
        <ActionButtons status={order.status} onAdvance={onAdvance} />
      </div>

      {/* DONE stamp */}
      {isDone ? (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <span
            className="font-black text-6xl text-status-available"
            style={{
              transform: "rotate(-15deg)",
              letterSpacing: 4,
            }}
          >
            DONE
          </span>
        </div>
      ) : null}
    </article>
  );
}

function ActionButtons({
  status,
  onAdvance,
}: {
  status: OrderStatus;
  onAdvance: () => void;
}) {
  if (status === "new") {
    return (
      <button
        type="button"
        onClick={onAdvance}
        className="w-full h-10 rounded-xl text-white font-bold text-sm tracking-wide hover:brightness-110 transition-all"
        style={{ backgroundColor: STATUS_BLUE }}
      >
        PREPARING
      </button>
    );
  }
  if (status === "preparing") {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="w-full h-10 rounded-xl text-white font-bold text-sm tracking-wide cursor-default opacity-60"
          style={{ backgroundColor: STATUS_BLUE, boxShadow: "0 0 16px 0 #2563EB66" }}
        >
          PREPARING ✓
        </button>
        <button
          type="button"
          onClick={onAdvance}
          className="w-full h-10 rounded-xl bg-status-available text-white font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
        >
          READY
        </button>
      </div>
    );
  }
  if (status === "ready") {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="w-full h-10 rounded-xl text-text-muted font-bold text-sm tracking-wide cursor-default"
          style={{ backgroundColor: "#2C2F3A" }}
        >
          PREPARING ✓
        </button>
        <button
          type="button"
          disabled
          className="w-full h-10 rounded-xl bg-status-available text-white font-bold text-sm tracking-wide cursor-default"
          style={{ boxShadow: "0 0 16px 0 #22C55E66" }}
        >
          READY ✓
        </button>
      </div>
    );
  }
  return null;
}

function PrinterMode() {
  return (
    <div className="bg-bg h-screen flex flex-col items-center justify-center px-8 text-center">
      <PrinterIcon />
      <h1 className="text-text-primary font-bold text-2xl mt-4 tracking-tight">
        Printer Mode
      </h1>
      <p className="text-text-secondary text-sm mt-2">
        Orders are printing automatically
      </p>
      <p className="text-text-muted text-xs mt-1">
        Check your thermal printer for tickets
      </p>
    </div>
  );
}

function PrinterIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-secondary"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
