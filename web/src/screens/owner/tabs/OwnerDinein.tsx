import { useMemo, useRef } from "react";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { nextStatus, minutesSince } from "@/lib/adapters";
import { theme } from "@/lib/theme";
import type { Order, OrderStatus, RestaurantTable } from "@/types";

const DINEIN = theme.platform.dinein; // #7C6AF5

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

export default function OwnerDinein() {
  const orders = useOrders();
  const tables = useTables();
  const advance = useAdvanceOrderStatus();

  const cardRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  const tableById = useMemo(() => {
    const m = new Map<string, RestaurantTable>();
    (tables.data ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [tables.data]);

  const dineinOrders = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) => o.platform === "dinein" && o.status !== "done"
      ),
    [orders.data]
  );

  const openRevenue = useMemo(
    () => dineinOrders.reduce((s, o) => s + o.total, 0),
    [dineinOrders]
  );

  const scrollToTable = (tableId: string) => {
    const order = dineinOrders.find((o) => o.tableId === tableId);
    if (!order) return;
    const el = cardRefs.current.get(order.id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onConfirm = (order: Order) => {
    if (!window.confirm("Hold to confirm — this commits you to fulfilling this order.")) return;
    advance.mutate({ id: order.id, status: nextStatus(order.status) });
  };

  const onReject = (_order: Order) => {
    // TODO: wire rejection mutation when the backend endpoint exists.
    if (!window.confirm("Reject this order? The customer will be notified.")) return;
  };

  const onAdvance = (order: Order) => {
    advance.mutate({ id: order.id, status: nextStatus(order.status) });
  };

  return (
    <div className="flex flex-row h-full overflow-hidden">
      {/* LEFT — dine-in orders */}
      <section className="flex-1 overflow-auto px-6 py-5 border-r border-border">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-xl text-text-primary">Dine-in Orders</h2>
          <span className="bg-amber/20 text-amber text-xs font-bold px-2.5 py-0.5 rounded-full">
            {dineinOrders.length}
          </span>
        </header>

        {orders.isLoading ? (
          <SkeletonList />
        ) : orders.isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-status-urgent text-sm font-medium mb-3">
              We couldn't load orders.
            </p>
            <button
              type="button"
              onClick={() => orders.refetch()}
              className="bg-amber hover:bg-amber-pressed text-black h-9 px-4 rounded-lg text-xs font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        ) : dineinOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-surfaceActive flex items-center justify-center mb-3">
              <span className="text-text-muted text-xl">○</span>
            </div>
            <p className="text-text-secondary text-sm">No active dine-in orders</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {dineinOrders.map((order) => (
              <DineinCard
                key={order.id}
                order={order}
                table={order.tableId ? tableById.get(order.tableId) : undefined}
                refSetter={(el) => {
                  if (el) cardRefs.current.set(order.id, el);
                  else cardRefs.current.delete(order.id);
                }}
                onConfirm={() => onConfirm(order)}
                onReject={() => onReject(order)}
                onAdvance={() => onAdvance(order)}
              />
            ))}
          </div>
        )}
      </section>

      {/* RIGHT — tables grid + sticky open-revenue footer */}
      <aside className="w-72 bg-surface flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto px-4 py-5">
          <h3 className="text-text-secondary text-xs uppercase tracking-widest mb-3 font-semibold">
            Tables
          </h3>

          {tables.isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-bg border border-border rounded-xl p-3 min-h-[72px] animate-pulse"
                >
                  <div className="h-4 w-10 bg-surfaceActive rounded mb-2" />
                  <div className="h-3 w-16 bg-surfaceActive rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(tables.data ?? []).map((t) => {
                const occ = t.status === "occupied";
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => occ && scrollToTable(t.id)}
                    className={`relative rounded-xl border p-3 cursor-pointer min-h-[72px] flex flex-col justify-between text-left transition-colors ${
                      occ
                        ? "bg-surfaceActive border-amber/40 hover:border-amber/60"
                        : "bg-bg border-border"
                    }`}
                  >
                    {!occ ? (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-status-available" />
                    ) : null}
                    <p
                      className={`font-bold text-lg ${
                        occ ? "text-amber" : "text-text-primary"
                      }`}
                    >
                      {t.name}
                    </p>
                    {occ ? (
                      <div>
                        <p className="text-text-secondary text-xs">
                          {t.guests} {t.guests === 1 ? "guest" : "guests"}
                        </p>
                        <p className="text-amber font-bold text-sm mt-0.5">
                          AED {t.total.toFixed(0)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-status-available text-xs mt-1">Available</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-surface px-4 py-3">
          <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold">
            Open Revenue
          </p>
          <p className="text-amber font-bold text-xl mt-0.5">
            AED {openRevenue.toFixed(0)}
          </p>
        </div>
      </aside>
    </div>
  );
}

function DineinCard({
  order,
  table,
  refSetter,
  onConfirm,
  onReject,
  onAdvance,
}: {
  order: Order;
  table?: RestaurantTable;
  refSetter: (el: HTMLElement | null) => void;
  onConfirm: () => void;
  onReject: () => void;
  onAdvance: () => void;
}) {
  const mins = minutesSince(order.placedAt);
  const urgent = mins >= 15;
  const tableName = table?.name ?? order.tableId?.toUpperCase() ?? "";
  const guests = table?.guests ?? 0;

  return (
    <article
      ref={refSetter}
      className="bg-surface border border-border rounded-2xl p-4 transition-colors"
    >
      {/* Top row */}
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
          style={{
            backgroundColor: DINEIN + "33",
            border: `1px solid ${DINEIN}66`,
            color: DINEIN,
          }}
        >
          Dine-in
        </span>
        <span
          className={`text-xs ${
            urgent ? "text-status-urgent font-semibold" : "text-text-secondary"
          }`}
        >
          {mins}m ago
        </span>
      </div>

      {/* Table + guest count */}
      <p style={{ color: DINEIN }} className="font-bold text-lg tracking-tight">
        Table {tableName}
      </p>
      <p className="text-text-secondary text-xs mt-0.5 mb-3">
        {guests} {guests === 1 ? "guest" : "guests"}
      </p>

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="h-8 px-3 rounded-lg text-xs font-semibold transition-colors bg-status-available hover:bg-status-available/80 text-black"
            >
              CONFIRM
            </button>
            <button
              type="button"
              onClick={onReject}
              className="h-8 px-3 rounded-lg text-xs font-semibold transition-colors bg-status-urgent hover:bg-status-urgent/80 text-white"
            >
              REJECT
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-amber font-bold text-sm">
              AED {order.total.toFixed(0)}
            </span>
            {order.status === "preparing" ? (
              <button
                type="button"
                onClick={onAdvance}
                className="h-8 px-3 rounded-lg text-xs font-semibold transition-colors bg-amber hover:bg-amber-pressed text-black"
              >
                MARK READY
              </button>
            ) : order.status === "ready" ? (
              <button
                type="button"
                onClick={onAdvance}
                className="h-8 px-3 rounded-lg text-xs font-semibold transition-colors bg-status-available hover:bg-status-available/80 text-black"
              >
                MARK DELIVERED
              </button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-2xl p-4 animate-pulse"
        >
          <div className="flex justify-between mb-3">
            <div className="h-5 w-20 bg-surfaceActive rounded-full" />
            <div className="h-3 w-12 bg-surfaceActive rounded" />
          </div>
          <div className="h-5 w-1/3 bg-surfaceActive rounded mb-1" />
          <div className="h-3 w-1/4 bg-surfaceActive rounded mb-3" />
          <div className="h-3 w-full bg-surfaceActive rounded mb-2" />
          <div className="h-3 w-5/6 bg-surfaceActive rounded mb-4" />
          <div className="flex justify-between border-t border-border pt-3">
            <div className="h-5 w-16 bg-surfaceActive rounded-full" />
            <div className="h-5 w-24 bg-surfaceActive rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
