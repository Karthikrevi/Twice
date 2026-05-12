import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/store/session";
import { useStaff } from "@/hooks/useStaff";
import { logout } from "@/hooks/useAuth";

interface NotificationsState {
  newOrders: boolean;
  lowStock: boolean;
  platformIssues: boolean;
  settlementReceived: boolean;
}

export default function OwnerSettings() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const restaurantName = useSession((s) => s.restaurantName);
  const staff = useStaff();

  // TODO: surface real values once /auth/me returns location, tableCount,
  // kitchen_output. For now keep placeholders.
  const location = "—";
  const tableCount = 8;
  const [kitchenOutput, setKitchenOutput] = useState<"Screen" | "Printer">("Screen");
  const [notifications, setNotifications] = useState<NotificationsState>({
    newOrders: true,
    lowStock: true,
    platformIssues: true,
    settlementReceived: true,
  });

  const staffCount = staff.data?.length ?? 0;
  const pendingInvites = 0; // TODO: /staff/invites

  const soon = (label: string) => () => alert(`${label} coming soon.`);

  const onResetSetup = () => {
    if (window.confirm("Reset setup wizard? This will not delete your data.")) {
      // TODO: route to /register prefilled
    }
  };

  const onDeleteAccount = () => {
    if (window.confirm("Delete restaurant account? This cannot be undone.")) {
      // TODO: server delete endpoint
    }
  };

  return (
    <div className="px-6 py-5 max-w-3xl">
      {/* Header */}
      <h1 className="text-text-primary font-bold text-3xl tracking-tight">
        {restaurantName ?? "Restaurant"}
      </h1>
      <p className="text-text-secondary text-sm mt-1">{location}</p>

      {/* RESTAURANT */}
      <SectionLabel>Restaurant</SectionLabel>
      <Card>
        <Row icon={<IconHome />} label={`${restaurantName ?? "Restaurant"} · ${location}`}>
          <EditPill onClick={soon("Edit restaurant details")} />
        </Row>
        <Divider />
        <Row icon={<IconGrid />} label={`Tables: ${tableCount}`}>
          <EditPill onClick={soon("Edit table count")} />
        </Row>
        <Divider />
        <Row icon={<IconMonitor />} label={`Kitchen Output: ${kitchenOutput}`}>
          <Toggle
            on={kitchenOutput === "Screen"}
            onChange={() =>
              setKitchenOutput((v) => (v === "Screen" ? "Printer" : "Screen"))
            }
          />
        </Row>
      </Card>

      {/* OWNER ACCOUNT */}
      <SectionLabel>Owner account</SectionLabel>
      <Card>
        <Row icon={<IconMail />} label={`Owner email: ${user?.email ?? "—"}`}>
          <GreyPill label="Change" onClick={soon("Change email")} />
        </Row>
        <Divider />
        <RowClickable
          icon={<IconKey />}
          label="Change password"
          onClick={soon("Change password")}
          trailing={<ChevronRight />}
        />
        <Divider />
        <Row icon={<IconShield />} label="Owner PIN" sub="Set or change your 4 digit PIN">
          <GreyPill label="Change" onClick={soon("Change PIN")} />
        </Row>
      </Card>

      {/* STAFF */}
      <SectionLabel>Staff</SectionLabel>
      <Card>
        <RowClickable
          icon={<IconUsers />}
          label={`Manage staff (${staffCount} ${staffCount === 1 ? "member" : "members"})`}
          onClick={() => navigate("/owner/staff")}
          trailing={<ChevronRight />}
        />
        <Divider />
        <RowClickable
          icon={<IconUserPlus />}
          label={`Pending invitations (${pendingInvites})`}
          onClick={soon("Pending invitations")}
          trailing={
            <div className="flex items-center gap-2">
              {pendingInvites > 0 ? (
                <span className="bg-amber/20 text-amber text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pendingInvites}
                </span>
              ) : null}
              <ChevronRight />
            </div>
          }
        />
      </Card>

      {/* NOTIFICATIONS */}
      <SectionLabel>Notifications</SectionLabel>
      <Card>
        <Row icon={<IconBell />} label="New order alerts">
          <Toggle
            on={notifications.newOrders}
            onChange={() =>
              setNotifications((n) => ({ ...n, newOrders: !n.newOrders }))
            }
          />
        </Row>
        <Divider />
        <Row icon={<IconAlert />} label="Low stock alerts">
          <Toggle
            on={notifications.lowStock}
            onChange={() =>
              setNotifications((n) => ({ ...n, lowStock: !n.lowStock }))
            }
          />
        </Row>
        <Divider />
        <Row icon={<IconAlertOct />} label="Platform connection issues">
          <Toggle
            on={notifications.platformIssues}
            onChange={() =>
              setNotifications((n) => ({
                ...n,
                platformIssues: !n.platformIssues,
              }))
            }
          />
        </Row>
        <Divider />
        <Row icon={<IconBell />} label="Settlement received">
          <Toggle
            on={notifications.settlementReceived}
            onChange={() =>
              setNotifications((n) => ({
                ...n,
                settlementReceived: !n.settlementReceived,
              }))
            }
          />
        </Row>
      </Card>

      {/* DANGER ZONE */}
      <SectionLabel>Danger zone</SectionLabel>
      <div
        className="bg-surface rounded-2xl overflow-hidden"
        style={{ borderColor: "#EF444466", borderWidth: 1 }}
      >
        <Row
          icon={<IconReset />}
          iconColor="#EF4444"
          label="Reset setup wizard"
          sub="This will not delete your data"
        >
          <DangerPill label="Reset" onClick={onResetSetup} />
        </Row>
        <div style={{ height: 1, backgroundColor: "#EF444433" }} />
        <Row
          icon={<IconTrash />}
          iconColor="#EF4444"
          label="Delete restaurant account"
        >
          <DangerPill label="Delete" onClick={onDeleteAccount} />
        </Row>
      </div>

      {/* Sign Out */}
      <button
        type="button"
        onClick={() => logout(navigate)}
        className="mt-6 w-full h-[52px] rounded-xl bg-surface text-status-urgent font-semibold text-sm hover:bg-surfaceActive transition-colors"
        style={{ border: "1px solid #EF444466" }}
      >
        Sign out
      </button>
      <p className="text-text-muted text-xs text-center mt-4">Once · v1.0.0</p>
    </div>
  );
}

// ---------- helpers ----------

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mt-6 mb-3">
      {children}
    </p>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}

function Row({
  icon,
  iconColor,
  label,
  sub,
  children,
}: {
  icon: ReactNode;
  iconColor?: string;
  label: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center px-4 py-3.5">
      <span
        className="mr-3 flex-shrink-0"
        style={{ color: iconColor ?? "#8B90A0" }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-medium text-sm">{label}</p>
        {sub ? (
          <p className="text-text-secondary text-xs mt-0.5">{sub}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function RowClickable({
  icon,
  label,
  onClick,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center px-4 py-3.5 text-left hover:bg-surfaceActive transition-colors"
    >
      <span className="mr-3 text-text-secondary flex-shrink-0">{icon}</span>
      <p className="text-text-primary font-medium text-sm flex-1 truncate">
        {label}
      </p>
      {trailing}
    </button>
  );
}

function EditPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-amber text-xs font-semibold rounded-lg px-3 h-8 transition-colors hover:bg-amber/20"
      style={{
        backgroundColor: "#F5A62322",
        border: "1px solid #F5A62366",
      }}
    >
      Edit
    </button>
  );
}

function GreyPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surfaceActive border border-border rounded-lg px-3 h-8 text-text-secondary text-xs font-semibold hover:text-text-primary transition-colors"
    >
      {label}
    </button>
  );
}

function DangerPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-status-urgent text-white rounded-lg px-3 h-8 text-xs font-semibold hover:opacity-90 transition-opacity"
    >
      {label}
    </button>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-[52px] h-7 rounded-full p-0.5 transition-colors ${
        on ? "bg-amber" : "bg-border"
      }`}
    >
      <span
        className={`block w-6 h-6 rounded-full transition-transform ${
          on ? "translate-x-[22px] bg-black" : "translate-x-0 bg-text-muted"
        }`}
      />
    </button>
  );
}

function ChevronRight() {
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
      className="text-text-secondary"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Feather-style inline icons (kept dependency-free)

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2z" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconMonitor() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconUserPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconAlertOct() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function IconReset() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
