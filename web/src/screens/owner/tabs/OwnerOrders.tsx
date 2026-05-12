import { useEffect, useMemo, useRef, useState } from "react";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { nextStatus, minutesSince } from "@/lib/adapters";
import { theme, platformLabel } from "@/lib/theme";
import type { Order, OrderStatus, PlatformKey } from "@/types";

const STATUS_COLOR: Record<OrderStatus, string> = {
  new: "#F5A623",
  preparing: "#7C6AF5",
  ready: "#22C55E",
  done: "#6B7280",
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  done: "Done",
};

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "done", label: "Done" },
];

const REJECT_REASONS = ["Out of stock", "Too busy", "Other"] as const;

export default function OwnerOrders() {
  const { data, isLoading, isError, refetch } = useOrders();
  const advance = useAdvanceOrderStatus();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const base = { all: data?.length ?? 0, new: 0, preparing: 0, ready: 0, done: 0 };
    (data ?? []).forEach((o) => {
      if (o.status in base) (base as any)[o.status]++;
    });
    return base;
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data;
    return data.filter((o) => o.status === filter);
  }, [data, filter]);

  const onConfirm = (order: Order) => {
    const ok = window.confirm(
      "Hold to confirm — this commits you to fulfilling this order."
    );
    if (!ok) return;
    advance.mutate({ id: order.id, status: nextStatus(order.status) });
  };

  const onReject = (order: Order, reason: string) => {
    // TODO: wire reject mutation when backend endpoint exists. For now
    // close the dropdown — the order stays in 'new' until handled.
    void reason;
    setRejectingId(null);
    void order;
  };

  const onAdvance = (order: Order) => {
    advance.mutate({ id: order.id, status: nextStatus(order.status) });
  };

  return (
    <div className="px-6 py-5">
      {/* Filter pills */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = (counts as any)[f.key] ?? 0;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 h-7 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                active
                  ? "bg-amber text-black"
                  : "bg-surface border border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              <span>{f.label}</span>
              <span className={active ? "text-black/60" : "text-text-muted"}>
                {count}
              </span>
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => refetch()}
          className="text-text-secondary hover:text-text-primary text-xs font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              rejectOpen={rejectingId === order.id}
              onRequestReject={() =>
                setRejectingId((cur) => (cur === order.id ? null : order.id))
              }
              onPickReason={(reason) => onReject(order, reason)}
              onConfirm={() => onConfirm(order)}
              onAdvance={() => onAdvance(order)}
              onCloseReject={() => setRejectingId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  rejectOpen,
  onRequestReject,
  onPickReason,
  onConfirm,
  onAdvance,
  onCloseReject,
}: {
  order: Order;
  rejectOpen: boolean;
  onRequestReject: () => void;
  onPickReason: (reason: string) => void;
  onConfirm: () => void;
  onAdvance: () => void;
  onCloseReject: () => void;
}) {
  const mins = minutesSince(order.placedAt);
  const urgent = mins >= 15;
  const platformColor = theme.platform[order.platform as PlatformKey];
  const isDinein = order.platform === "dinein";
  const isDelivery =
    order.platform === "talabat" ||
    order.platform === "deliveroo" ||
    order.platform === "instashop";

  return (
    <article className="bg-surface border border-border rounded-2xl p-4 transition-colors hover:border-text-muted/50">
      {/* Top row */}
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
          style={{
            backgroundColor: platformColor + "33",
            border: `1px solid ${platformColor}66`,
            color: platformColor,
          }}
        >
          {platformLabel[order.platform as PlatformKey]}
        </span>
        <span
          className={`text-xs ${
            urgent
              ? "text-status-urgent font-semibold"
              : "text-text-secondary"
          }`}
        >
          {mins}m ago
        </span>
      </div>

      {/* Customer or table */}
      {(order.tableId || order.customerName) && (
        <p className="font-semibold text-text-primary text-sm mb-2">
          {order.tableId ? `Table ${order.tableId.toUpperCase()}` : order.customerName}
        </p>
      )}

      {/* Items */}
      <ul className="mb-3 space-y-1">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between text-sm">
            <span className="text-text-primary">
              <span className="text-text-secondary">{it.qty}× </span>
              {it.name}
            </span>
            <span className="text-text-secondary">
              AED {(it.price * it.qty).toFixed(0)}
            </span>
          </li>
        ))}
      </ul>

      {/* Special instructions */}
      {order.specialInstructions ? (
        <div className="bg-surfaceActive rounded-lg px-3 py-2 mb-3 border-l-2 border-amber">
          <p className="text-text-secondary text-[10px] uppercase tracking-widest font-semibold mb-0.5">
            Note
          </p>
          <p className="text-text-primary text-xs">{order.specialInstructions}</p>
        </div>
      ) : null}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5"
          style={{
            backgroundColor: STATUS_COLOR[order.status] + "33",
            color: STATUS_COLOR[order.status],
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: STATUS_COLOR[order.status] }}
          />
          {STATUS_LABEL[order.status]}
        </span>

        {order.status === "new" ? (
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={onConfirm}
              className="h-8 px-3 rounded-lg text-xs font-semibold transition-colors bg-status-available hover:bg-status-available/80 text-black"
            >
              CONFIRM
            </button>
            <button
              type="button"
              onClick={onRequestReject}
              className="h-8 px-3 rounded-lg text-xs font-semibold transition-colors bg-status-urgent hover:bg-status-urgent/80 text-white"
            >
              REJECT
            </button>
            {rejectOpen ? (
              <RejectDropdown
                onPick={onPickReason}
                onClose={onCloseReject}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-text-primary font-bold text-sm">
              AED {order.total.toFixed(0)}
            </span>
            {order.status === "preparing" ? (
              <ActionButton label="MARK READY" tone="amber" onClick={onAdvance} />
            ) : order.status === "ready" && isDinein ? (
              <ActionButton
                label="MARK DELIVERED"
                tone="green"
                onClick={onAdvance}
              />
            ) : order.status === "ready" && isDelivery ? (
              <ActionButton label="PACK" tone="amber" onClick={onAdvance} />
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "amber" | "green";
  onClick: () => void;
}) {
  const bg =
    tone === "amber"
      ? "bg-amber hover:bg-amber-pressed text-black"
      : "bg-status-available hover:bg-status-available/80 text-black";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${bg}`}
    >
      {label}
    </button>
  );
}

function RejectDropdown({
  onPick,
  onClose,
}: {
  onPick: (reason: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-44 bg-surfaceActive border border-border rounded-xl shadow-2xl z-30 overflow-hidden"
    >
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold px-3 pt-3 pb-1">
        Reject — pick a reason
      </p>
      {REJECT_REASONS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onPick(r)}
          className="block w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-surface transition-colors"
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-2xl p-4 animate-pulse"
        >
          <div className="flex justify-between mb-3">
            <div className="h-5 w-20 bg-surfaceActive rounded-full" />
            <div className="h-3 w-12 bg-surfaceActive rounded" />
          </div>
          <div className="h-4 w-2/3 bg-surfaceActive rounded mb-3" />
          <div className="h-3 w-full bg-surfaceActive rounded mb-2" />
          <div className="h-3 w-5/6 bg-surfaceActive rounded mb-2" />
          <div className="h-3 w-2/3 bg-surfaceActive rounded mb-4" />
          <div className="flex justify-between border-t border-border pt-3">
            <div className="h-5 w-16 bg-surfaceActive rounded-full" />
            <div className="h-5 w-16 bg-surfaceActive rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: OrderStatus | "all" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-surfaceActive flex items-center justify-center mb-3">
        <span className="text-text-muted text-xl">○</span>
      </div>
      <p className="text-text-primary text-sm font-semibold">
        No orders right now
      </p>
      <p className="text-text-secondary text-xs mt-1">
        {filter === "all"
          ? "New orders will appear here in real time."
          : "Try a different filter."}
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-status-urgent text-sm font-medium mb-3">
        We couldn't load orders.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-amber hover:bg-amber-pressed text-black h-9 px-4 rounded-lg text-xs font-semibold transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
