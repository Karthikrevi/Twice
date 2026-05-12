import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders, useAdvanceOrderStatus } from "@/hooks/useOrders";
import { useTables, useOpenTable } from "@/hooks/useTables";
import { useSocketSync } from "@/hooks/useSocketSync";
import { useSession } from "@/store/session";
import { logout } from "@/hooks/useAuth";
import { nextStatus, minutesSince } from "@/lib/adapters";
import type { Order, OrderStatus, RestaurantTable } from "@/types";

type TabKey = "tables" | "orders";

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

const DINEIN_PURPLE = "#7C6AF5";

export default function WaiterDashboard() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const [tab, setTab] = useState<TabKey>("tables");
  useSocketSync();

  return (
    <div className="bg-bg min-h-screen">
      {/* Top bar */}
      <header className="h-14 border-b border-border px-6 flex items-center justify-between">
        <p className="text-amber font-semibold text-sm tracking-[10px]">
          O N C E
        </p>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-secondary">{user?.name ?? "Waiter"}</span>
          <span className="text-border">·</span>
          <button
            type="button"
            onClick={() => logout(navigate)}
            className="text-status-urgent hover:opacity-80 transition-opacity"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab pills */}
      <div className="px-6 py-3 flex gap-2 border-b border-border">
        {(["tables", "orders"] as TabKey[]).map((t) => {
          const a = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 h-8 text-xs font-semibold uppercase tracking-wider transition-colors ${
                a
                  ? "bg-amber text-black"
                  : "bg-surface border border-border text-text-secondary hover:border-amber/50"
              }`}
            >
              {t === "tables" ? "Tables" : "Orders"}
            </button>
          );
        })}
      </div>

      {tab === "tables" ? <WaiterTables /> : <WaiterOrders />}
    </div>
  );
}

function WaiterTables() {
  const tables = useTables();
  const orders = useOrders();
  const [openingTable, setOpeningTable] = useState<RestaurantTable | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const readyTableIds = useMemo(() => {
    const s = new Set<string>();
    (orders.data ?? []).forEach((o) => {
      if (o.tableId && o.status === "ready") s.add(o.tableId);
    });
    return s;
  }, [orders.data]);

  const orderByTable = useMemo(() => {
    const m = new Map<string, Order>();
    (orders.data ?? []).forEach((o) => {
      if (o.tableId && o.status !== "done") m.set(o.tableId, o);
    });
    return m;
  }, [orders.data]);

  const onTileClick = (t: RestaurantTable) => {
    if (t.status === "available") {
      setOpeningTable(t);
    } else {
      setSelectedId(t.id === selectedId ? null : t.id);
    }
  };

  const selectedTable = (tables.data ?? []).find((t) => t.id === selectedId) ?? null;
  const selectedOrder = selectedTable ? orderByTable.get(selectedTable.id) ?? null : null;

  return (
    <div className="px-6 py-5">
      <h2 className="text-text-primary font-bold text-2xl tracking-tight mb-4">
        My Tables
      </h2>

      {tables.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-2xl p-4 min-h-[88px] animate-pulse"
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
              ready={readyTableIds.has(t.id)}
              onClick={() => onTileClick(t)}
            />
          ))}
        </div>
      )}

      <OpenTableModal
        table={openingTable}
        onClose={() => setOpeningTable(null)}
      />

      <DetailPanel
        table={selectedTable}
        order={selectedOrder}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function TableTile({
  table,
  ready,
  onClick,
}: {
  table: RestaurantTable;
  ready: boolean;
  onClick: () => void;
}) {
  const occ = table.status === "occupied";

  if (ready) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative bg-surfaceActive rounded-2xl p-4 min-h-[88px] text-left animate-pulse"
        style={{ border: "2px solid #22C55E" }}
      >
        <p className="text-text-primary font-bold text-2xl tracking-tight">
          {table.name}
        </p>
        <p className="text-status-available text-xs font-semibold mt-1">
          Order Ready 🔔
        </p>
      </button>
    );
  }

  if (occ) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative bg-surfaceActive rounded-2xl p-4 min-h-[88px] text-left transition-colors hover:opacity-90"
        style={{ border: "1px solid #F5A62366" }}
      >
        <p className="text-amber font-bold text-2xl tracking-tight">
          {table.name}
        </p>
        <p className="text-text-secondary text-xs mt-1">
          {table.guests} {table.guests === 1 ? "guest" : "guests"}
        </p>
        <p className="text-amber font-bold text-sm mt-2">
          AED {table.total.toFixed(0)}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative bg-surface border border-border rounded-2xl p-4 min-h-[88px] cursor-pointer text-left transition-colors hover:border-text-muted/60"
    >
      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-status-available" />
      <p className="text-text-primary font-bold text-2xl tracking-tight">
        {table.name}
      </p>
      <p className="text-status-available text-xs mt-1 font-medium">
        Available
      </p>
    </button>
  );
}

function OpenTableModal({
  table,
  onClose,
}: {
  table: RestaurantTable | null;
  onClose: () => void;
}) {
  const open = !!table;
  const [guests, setGuests] = useState(2);
  const openTable = useOpenTable();

  useEffect(() => {
    if (table) setGuests(2);
  }, [table?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const close = () => {
    openTable.reset();
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!table) return;
    openTable.mutate(
      { id: table.id, guests },
      { onSuccess: () => onClose() }
    );
  };

  if (!open || !table) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={close}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-w-sm w-full bg-surface rounded-2xl p-6 border border-border"
      >
        <h2 className="text-text-primary font-bold text-xl text-center tracking-tight">
          Open Table
        </h2>
        <p className="text-amber font-bold text-3xl text-center mt-1 tracking-tight">
          {table.name}
        </p>
        <p className="text-text-secondary text-sm text-center mt-4">
          How many guests?
        </p>

        <div className="flex items-center justify-center gap-6 mt-4">
          <button
            type="button"
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            className="w-14 h-14 bg-surfaceActive border border-border rounded-xl text-amber text-2xl font-bold hover:border-amber transition-colors"
          >
            −
          </button>
          <span className="font-bold text-5xl text-text-primary tabular-nums tracking-tight w-16 text-center">
            {guests}
          </span>
          <button
            type="button"
            onClick={() => setGuests((g) => Math.min(40, g + 1))}
            className="w-14 h-14 bg-surfaceActive border border-border rounded-xl text-amber text-2xl font-bold hover:border-amber transition-colors"
          >
            +
          </button>
        </div>
        <p className="text-text-muted text-xs text-center mt-3">
          You can adjust this anytime.
        </p>

        {openTable.isError ? (
          <p className="text-status-urgent text-xs text-center mt-3">
            Couldn't open the table. Try again.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={openTable.isPending}
          className="mt-6 w-full h-[52px] bg-amber rounded-xl text-black font-bold text-base hover:bg-amber-pressed transition-colors disabled:opacity-50"
        >
          {openTable.isPending ? "Opening…" : "Open Table"}
        </button>
        <button
          type="button"
          onClick={close}
          className="block w-full text-text-secondary text-sm text-center mt-3 hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

function DetailPanel({
  table,
  order,
  onClose,
}: {
  table: RestaurantTable | null;
  order: Order | null;
  onClose: () => void;
}) {
  const advance = useAdvanceOrderStatus();
  const visible = !!table;

  return (
    <>
      {visible ? (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
      <aside
        className={`fixed top-14 right-0 bottom-0 w-96 bg-surface border-l border-border z-40 transition-transform duration-300 overflow-auto ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {table ? (
          <div className="px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-amber font-bold text-3xl tracking-tight">
                {table.name}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close panel"
              >
                <CloseIcon />
              </button>
            </div>
            <p className="text-text-secondary text-sm">
              {table.guests} {table.guests === 1 ? "guest" : "guests"} · AED{" "}
              {table.total.toFixed(0)}
            </p>

            <div className="h-px bg-border my-5" />

            {order ? (
              <article className="bg-bg border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: STATUS_COLOR[order.status] + "33",
                      color: STATUS_COLOR[order.status],
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[order.status] }}
                    />
                    {STATUS_LABEL[order.status]}
                  </span>
                  <span className="text-text-secondary text-xs">
                    {minutesSince(order.placedAt)}m ago
                  </span>
                </div>

                <ul className="space-y-1 mb-3">
                  {order.items.map((it) => (
                    <li key={it.id} className="text-sm">
                      <span className="text-text-secondary">{it.qty}× </span>
                      <span className="text-text-primary">{it.name}</span>
                    </li>
                  ))}
                </ul>

                {order.specialInstructions ? (
                  <div className="bg-surfaceActive rounded-lg px-3 py-2 mb-3 border-l-2 border-amber">
                    <p className="text-text-secondary text-[10px] uppercase tracking-widest font-semibold mb-0.5">
                      Note
                    </p>
                    <p className="text-text-primary text-xs">
                      {order.specialInstructions}
                    </p>
                  </div>
                ) : null}

                {order.status === "ready" ? (
                  <button
                    type="button"
                    onClick={() =>
                      advance.mutate({ id: order.id, status: nextStatus(order.status) })
                    }
                    className="mt-2 w-full h-11 bg-status-available rounded-xl text-black font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    MARK DELIVERED
                  </button>
                ) : null}
              </article>
            ) : (
              <p className="text-text-muted text-sm">
                No active order on file for this table yet.
              </p>
            )}
          </div>
        ) : null}
      </aside>
    </>
  );
}

function WaiterOrders() {
  const orders = useOrders();
  const tables = useTables();
  const advance = useAdvanceOrderStatus();

  const tableById = useMemo(() => {
    const m = new Map<string, RestaurantTable>();
    (tables.data ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [tables.data]);

  const visible = useMemo(() => {
    const occupied = new Set(
      (tables.data ?? []).filter((t) => t.status === "occupied").map((t) => t.id)
    );
    return (orders.data ?? []).filter(
      (o) =>
        o.platform === "dinein" &&
        o.tableId &&
        occupied.has(o.tableId) &&
        o.status !== "done"
    );
  }, [orders.data, tables.data]);

  if (orders.isLoading || tables.isLoading) {
    return (
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-2xl p-4 animate-pulse h-40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-text-muted text-sm">No active orders on your tables.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((o) => {
          const table = o.tableId ? tableById.get(o.tableId) : undefined;
          const tableName = table?.name ?? o.tableId?.toUpperCase() ?? "";
          const mins = minutesSince(o.placedAt);
          const urgent = mins >= 15;
          return (
            <article
              key={o.id}
              className="bg-surface border border-border rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="font-bold text-lg tracking-tight"
                  style={{ color: DINEIN_PURPLE }}
                >
                  Table {tableName}
                </p>
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

              <ul className="space-y-1 mb-3">
                {o.items.map((it) => (
                  <li key={it.id} className="text-sm">
                    <span className="text-text-secondary">{it.qty}× </span>
                    <span className="text-text-primary">{it.name}</span>
                  </li>
                ))}
              </ul>

              {o.specialInstructions ? (
                <div className="bg-surfaceActive rounded-lg px-3 py-2 mb-3 border-l-2 border-amber">
                  <p className="text-text-secondary text-[10px] uppercase tracking-widest font-semibold mb-0.5">
                    Note
                  </p>
                  <p className="text-text-primary text-xs">
                    {o.specialInstructions}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: STATUS_COLOR[o.status] + "33",
                    color: STATUS_COLOR[o.status],
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[o.status] }}
                  />
                  {STATUS_LABEL[o.status]}
                </span>
                {o.status === "ready" ? (
                  <button
                    type="button"
                    onClick={() =>
                      advance.mutate({ id: o.id, status: nextStatus(o.status) })
                    }
                    className="h-9 px-3 rounded-lg text-xs font-semibold bg-status-available text-black hover:opacity-90 transition-opacity"
                  >
                    MARK DELIVERED
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
