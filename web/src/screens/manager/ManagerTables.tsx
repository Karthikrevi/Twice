import { useMemo, useState } from "react";
import { useTables } from "@/hooks/useTables";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { nextStatus, minutesSince } from "@/lib/adapters";
import { theme } from "@/lib/theme";
import type { Order, OrderStatus, RestaurantTable } from "@/types";

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

export default function ManagerTables() {
  const tables = useTables();
  const orders = useOrders();
  const advance = useAdvanceOrderStatus();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ordersByTable = useMemo(() => {
    const m = new Map<string, Order>();
    (orders.data ?? []).forEach((o) => {
      if (o.tableId && o.status !== "done") m.set(o.tableId, o);
    });
    return m;
  }, [orders.data]);

  const selectedTable = useMemo(
    () => (tables.data ?? []).find((t) => t.id === selectedId) ?? null,
    [tables.data, selectedId]
  );

  const selectedOrder = selectedTable
    ? ordersByTable.get(selectedTable.id) ?? null
    : null;

  const occupiedCount = (tables.data ?? []).filter(
    (t) => t.status === "occupied"
  ).length;

  return (
    <div className="flex h-full">
      {/* Grid */}
      <div className="flex-1 overflow-auto px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-bold text-xl tracking-tight">
            Tables
          </h2>
          <p className="text-text-secondary text-xs">
            {occupiedCount}/{tables.data?.length ?? 0} occupied
          </p>
        </div>

        {tables.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl p-4 min-h-[110px] animate-pulse"
              >
                <div className="h-6 w-12 bg-surfaceActive rounded mb-2" />
                <div className="h-3 w-16 bg-surfaceActive rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(tables.data ?? []).map((t) => (
              <TableTile
                key={t.id}
                table={t}
                hasReadyOrder={
                  ordersByTable.get(t.id)?.status === "ready"
                }
                active={selectedId === t.id}
                onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right detail panel */}
      <aside className="w-80 border-l border-border bg-bg overflow-auto">
        {!selectedTable ? (
          <EmptyDetail />
        ) : selectedTable.status !== "occupied" ? (
          <AvailableDetail table={selectedTable} />
        ) : (
          <OrderDetail
            table={selectedTable}
            order={selectedOrder}
            onAdvance={(o) =>
              advance.mutate({ id: o.id, status: nextStatus(o.status) })
            }
          />
        )}
      </aside>
    </div>
  );
}

function TableTile({
  table,
  hasReadyOrder,
  active,
  onClick,
}: {
  table: RestaurantTable;
  hasReadyOrder: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const occ = table.status === "occupied";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl p-4 min-h-[110px] transition-colors relative ${
        occ
          ? "bg-surfaceActive"
          : "bg-surface hover:border-text-muted/60"
      } ${active ? "ring-2 ring-amber" : ""}`}
      style={{
        border: `1px solid ${
          hasReadyOrder
            ? "#22C55E"
            : occ
            ? "#F5A62366"
            : "#2C2F3A"
        }`,
      }}
    >
      <div className="flex items-start justify-between">
        <p
          className={`font-bold text-2xl tracking-tight ${
            occ ? "text-amber" : "text-text-primary"
          }`}
        >
          {table.name}
        </p>
        <span
          className="block w-2 h-2 rounded-full"
          style={{
            backgroundColor: hasReadyOrder
              ? "#22C55E"
              : occ
              ? "#F59E0B"
              : "#22C55E",
          }}
        />
      </div>
      {occ ? (
        <div className="mt-2">
          <p className="text-text-secondary text-xs">
            {table.guests} {table.guests === 1 ? "guest" : "guests"}
          </p>
          <p className="text-amber font-bold text-base mt-1">
            AED {table.total.toFixed(0)}
          </p>
          {hasReadyOrder ? (
            <p className="text-status-available text-xs font-semibold mt-1">
              Order ready
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-status-available text-xs mt-2 font-medium">
          Available
        </p>
      )}
    </button>
  );
}

function EmptyDetail() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-surfaceActive flex items-center justify-center mb-3">
        <span className="text-text-muted text-xl">▦</span>
      </div>
      <p className="text-text-primary text-sm font-semibold">
        Select a table
      </p>
      <p className="text-text-secondary text-xs mt-1">
        Tap any occupied tile to see its order.
      </p>
    </div>
  );
}

function AvailableDetail({ table }: { table: RestaurantTable }) {
  return (
    <div className="px-5 py-5">
      <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mb-2">
        Table
      </p>
      <h3 className="text-text-primary font-bold text-3xl tracking-tight">
        {table.name}
      </h3>
      <p className="text-status-available text-sm font-medium mt-1">
        Available
      </p>
      <p className="text-text-muted text-xs mt-5">
        No active order. A waiter can open this table from the Waiter app.
      </p>
    </div>
  );
}

function OrderDetail({
  table,
  order,
  onAdvance,
}: {
  table: RestaurantTable;
  order: Order | null;
  onAdvance: (o: Order) => void;
}) {
  return (
    <div className="px-5 py-5">
      <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mb-2">
        Table
      </p>
      <div className="flex items-center justify-between">
        <h3 className="text-amber font-bold text-3xl tracking-tight">
          {table.name}
        </h3>
        <span
          className="rounded-full px-3 h-7 text-xs font-semibold flex items-center"
          style={{
            backgroundColor: "#F59E0B33",
            color: "#F59E0B",
          }}
        >
          Occupied
        </span>
      </div>
      <p className="text-text-secondary text-sm mt-1">
        {table.guests} {table.guests === 1 ? "guest" : "guests"} · AED{" "}
        {table.total.toFixed(0)}
      </p>

      <div className="h-px bg-border my-5" />

      {order ? (
        <ActiveOrderCard order={order} onAdvance={onAdvance} />
      ) : (
        <p className="text-text-muted text-sm">
          Table is occupied but no active order is on file. Items will appear
          here once the waiter adds them.
        </p>
      )}
    </div>
  );
}

function ActiveOrderCard({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (o: Order) => void;
}) {
  const mins = minutesSince(order.placedAt);
  const urgent = mins >= 15;
  const statusColor = STATUS_COLOR[order.status];

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5"
          style={{
            backgroundColor: statusColor + "33",
            color: statusColor,
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          {STATUS_LABEL[order.status]}
        </span>
        <span
          className={`text-xs ${
            urgent ? "text-status-urgent font-semibold" : "text-text-secondary"
          }`}
        >
          {mins}m ago
        </span>
      </div>

      <p className="text-text-secondary text-[10px] uppercase tracking-widest font-semibold mb-1">
        Order {order.shortId}
      </p>

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

      {order.specialInstructions ? (
        <div
          className="bg-surfaceActive rounded-lg px-3 py-2 mb-3 border-l-2 text-xs"
          style={{ borderLeftColor: theme.amber }}
        >
          <p className="text-text-secondary text-[10px] uppercase tracking-widest font-semibold mb-0.5">
            Note
          </p>
          <p className="text-text-primary">{order.specialInstructions}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-amber font-bold text-base">
          AED {order.total.toFixed(0)}
        </span>
        {order.status === "new" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Hold to confirm — this commits you to fulfilling this order."
                  )
                ) {
                  onAdvance(order);
                }
              }}
              className="h-9 px-3 rounded-lg text-xs font-semibold bg-status-available hover:bg-status-available/80 text-black transition-colors"
            >
              CONFIRM
            </button>
          </div>
        ) : order.status === "preparing" ? (
          <button
            type="button"
            onClick={() => onAdvance(order)}
            className="h-9 px-3 rounded-lg text-xs font-semibold bg-amber hover:bg-amber-pressed text-black transition-colors"
          >
            MARK READY
          </button>
        ) : order.status === "ready" ? (
          <button
            type="button"
            onClick={() => onAdvance(order)}
            className="h-9 px-3 rounded-lg text-xs font-semibold bg-status-available hover:bg-status-available/80 text-black transition-colors"
          >
            MARK DELIVERED
          </button>
        ) : null}
      </div>
    </div>
  );
}
