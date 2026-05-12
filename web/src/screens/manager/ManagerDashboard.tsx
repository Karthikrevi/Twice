import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { useDailyReport } from "@/hooks/useReports";
import { useSocketSync } from "@/hooks/useSocketSync";
import { useSession } from "@/store/session";
import { logout } from "@/hooks/useAuth";
import OwnerOrders from "@/screens/owner/tabs/OwnerOrders";
import OwnerDinein from "@/screens/owner/tabs/OwnerDinein";
import ManagerFinance from "@/screens/manager/ManagerFinance";
import ManagerTables from "@/screens/manager/ManagerTables";

type TabKey = "orders" | "dinein" | "finance" | "tables";

interface NavItem {
  key: TabKey;
  label: string;
  icon: ReactNode;
  locked?: boolean;
}

const NAV: NavItem[] = [
  { key: "orders", label: "Orders", icon: <IconOrders /> },
  { key: "dinein", label: "Dine-in", icon: <IconDinein /> },
  { key: "finance", label: "Finance", icon: <IconFinance />, locked: true },
  { key: "tables", label: "Tables", icon: <IconTables /> },
];

function initialsOf(name: string | undefined) {
  if (!name) return "··";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const restaurantName = useSession((s) => s.restaurantName);
  const [active, setActive] = useState<TabKey>("orders");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useSocketSync();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const orders = useOrders();
  const tables = useTables();
  const report = useDailyReport();

  const ordersToday = orders.data?.length ?? 0;
  const occupied = (tables.data ?? []).filter(
    (t) => t.status === "occupied"
  ).length;
  const totalTables = tables.data?.length ?? 0;

  const netRevenue = useMemo(() => {
    const rows = report.data?.byPlatform ?? [];
    const gross = rows.reduce((s, r) => s + (r.gross ?? 0), 0);
    const commission = rows.reduce((s, r) => s + (r.commission ?? 0), 0);
    return (gross - commission) / 100;
  }, [report.data]);

  const awaiting = (orders.data ?? []).filter((o) => o.status === "new").length;

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg border-b border-border px-6 h-14 flex items-center justify-between">
        <p className="text-amber font-semibold text-sm tracking-[10px]">
          O N C E
        </p>

        <div className="flex items-center gap-3">
          <StatPill>
            <span className="w-1.5 h-1.5 rounded-full bg-status-available" />
            <span className="text-text-primary font-semibold">
              {ordersToday} orders
            </span>
          </StatPill>
          <StatPill>
            <span className="text-text-primary">
              {occupied}/{totalTables}{" "}
              <span className="text-text-secondary">tables</span>
            </span>
          </StatPill>
          <StatPill>
            <span className="text-amber font-semibold">
              AED {netRevenue.toFixed(0)}
            </span>
          </StatPill>
          {awaiting > 0 ? (
            <StatPill>
              <span className="w-1.5 h-1.5 rounded-full bg-status-urgent animate-pulse" />
              <span className="text-status-urgent font-semibold">
                {awaiting} pending
              </span>
            </StatPill>
          ) : null}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-surface border border-border text-text-secondary text-xs font-bold flex items-center justify-center hover:text-text-primary hover:border-text-muted/50 transition-colors"
            aria-label="Account menu"
          >
            {initialsOf(user?.name)}
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 pt-3 pb-2">
                <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mb-0.5">
                  Restaurant
                </p>
                <p className="text-text-primary text-sm font-semibold truncate">
                  {restaurantName ?? "Once"}
                </p>
                <p className="text-text-secondary text-xs truncate mt-0.5">
                  {user?.email}
                </p>
              </div>
              <div className="border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout(navigate);
                }}
                className="block w-full text-left px-4 py-2.5 text-sm text-status-urgent hover:bg-surfaceActive transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-14 bottom-0 w-48 bg-surface border-r border-border flex flex-col pt-4">
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={`mx-2 px-4 py-2.5 flex items-center gap-3 cursor-pointer rounded-lg text-sm transition-colors text-left ${
                  isActive
                    ? "bg-amber/10 text-amber font-semibold border-l-2 border-amber"
                    : "text-text-secondary hover:text-text-primary hover:bg-surfaceActive"
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.locked ? <LockIcon /> : null}
              </button>
            );
          })}
        </nav>
        <p className="text-text-muted text-xs px-4 pb-4 mt-auto">
          Once · v1.0.0
        </p>
      </aside>

      {/* Main content */}
      <main className="ml-48 mt-14 flex-1 overflow-auto bg-bg">
        {active === "orders" ? (
          <OwnerOrders />
        ) : active === "dinein" ? (
          <OwnerDinein />
        ) : active === "finance" ? (
          <ManagerFinance />
        ) : (
          <ManagerTables />
        )}
      </main>
    </div>
  );
}

function StatPill({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-full px-4 h-8 flex items-center gap-2 text-sm">
      {children}
    </div>
  );
}

// Icons

function IconOrders() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}
function IconDinein() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}
function IconFinance() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  );
}
function IconTables() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-amber"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
