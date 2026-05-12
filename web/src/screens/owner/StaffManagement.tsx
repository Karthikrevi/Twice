import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useStaff, useCreateStaff, useDeleteStaff, type StaffRow } from "@/hooks/useStaff";

type Role = "manager" | "waiter" | "kitchen";
type Filter = "all" | Role;

const ROLE_COLOR: Record<Role, string> = {
  manager: "#22C55E",
  waiter: "#7C6AF5",
  kitchen: "#FF6D00",
};

// TODO: replace with GET /staff/invites when available.
const PLACEHOLDER_INVITES: {
  id: string;
  email: string;
  role: Role;
  daysAgo: number;
}[] = [
  { id: "i1", email: "sara@almandi.ae", role: "waiter", daysAgo: 2 },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StaffManagement() {
  const navigate = useNavigate();
  const staff = useStaff();
  const remove = useDeleteStaff();

  const [filter, setFilter] = useState<Filter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const visible = useMemo(() => {
    const rows = (staff.data ?? []).filter((r) => r.role !== "owner");
    if (filter === "all") return rows;
    return rows.filter((r) => r.role === filter);
  }, [staff.data, filter]);

  const onRemove = (row: StaffRow) => {
    if (
      window.confirm(`Remove ${row.name}? They'll lose access immediately.`)
    ) {
      remove.mutate(row.id);
    }
  };

  return (
    <div className="bg-bg min-h-screen">
      {/* Top bar */}
      <header className="border-b border-border px-6 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/owner")}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-text-primary font-bold text-xl tracking-tight">
          Staff Management
        </h1>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="bg-amber hover:bg-amber-pressed text-black rounded-lg px-3 h-9 text-xs font-semibold transition-colors"
        >
          Add Staff Member +
        </button>
      </header>

      <div className="px-6 py-5 max-w-3xl">
        {/* Filter pills */}
        <div className="flex gap-2 mb-5">
          {(["all", "manager", "waiter", "kitchen"] as Filter[]).map((f) => {
            const active = filter === f;
            const label = f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1);
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
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

        {/* List */}
        {staff.isLoading ? (
          <SkeletonList />
        ) : visible.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-16">
            No staff yet
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((row) => (
              <StaffCard
                key={row.id}
                row={row}
                onEdit={() => alert("Edit staff coming soon.")}
                onReset={() => alert("Reset password coming soon.")}
                onRemove={() => onRemove(row)}
              />
            ))}
          </div>
        )}

        {/* Pending invitations */}
        <PendingInvites />
      </div>

      {addOpen ? (
        <AddStaffModal onClose={() => setAddOpen(false)} />
      ) : null}
    </div>
  );
}

function StaffCard({
  row,
  onEdit,
  onReset,
  onRemove,
}: {
  row: StaffRow;
  onEdit: () => void;
  onReset: () => void;
  onRemove: () => void;
}) {
  if (row.role === "owner") return null;
  const role = row.role as Role;
  const c = ROLE_COLOR[role];
  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-3 flex items-center">
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center text-amber font-bold text-sm"
        style={{ backgroundColor: "#1E2128", border: "1px solid #2C2F3A" }}
      >
        {initialsOf(row.name)}
      </span>

      <div className="flex-1 min-w-0 ml-3">
        <div className="flex items-center gap-2">
          <p className="text-text-primary font-semibold text-sm truncate">
            {row.name}
          </p>
          <span
            className="rounded-full px-2 h-5 text-[10px] font-semibold capitalize flex items-center"
            style={{
              backgroundColor: c + "33",
              border: `1px solid ${c}66`,
              color: c,
            }}
          >
            {role}
          </span>
        </div>
        <p className="text-text-secondary text-xs mt-0.5 truncate">
          {row.email}
        </p>
      </div>

      <div className="flex gap-2">
        <SmallButton label="Edit" tone="amber" onClick={onEdit} />
        <SmallButton label="Reset Password" tone="grey" onClick={onReset} />
        <SmallButton label="Remove" tone="red" onClick={onRemove} />
      </div>
    </div>
  );
}

function SmallButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "amber" | "grey" | "red";
  onClick: () => void;
}) {
  const styles =
    tone === "amber"
      ? { backgroundColor: "#F5A62322", color: "#F5A623" }
      : tone === "red"
      ? { backgroundColor: "#EF444422", color: "#EF4444" }
      : {
          backgroundColor: "#1E2128",
          color: "#8B90A0",
          border: "1px solid #2C2F3A",
        };
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 h-8 text-xs font-semibold hover:opacity-80 transition-opacity"
      style={styles}
    >
      {label}
    </button>
  );
}

function PendingInvites() {
  const invites = PLACEHOLDER_INVITES;
  if (invites.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="text-amber text-xs uppercase tracking-widest font-semibold mb-3">
        Pending invitations ({invites.length})
      </p>
      <div className="flex flex-col gap-2">
        {invites.map((i) => (
          <div
            key={i.id}
            className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center"
          >
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium text-sm truncate">
                {i.email}
              </p>
              <p className="text-text-secondary text-xs mt-0.5 capitalize truncate">
                {i.role} · Sent {i.daysAgo} {i.daysAgo === 1 ? "day" : "days"} ago
              </p>
            </div>
            <div className="flex gap-2">
              <SmallButton
                label="Resend"
                tone="amber"
                onClick={() => alert("Resend invite coming soon.")}
              />
              <SmallButton
                label="Cancel"
                tone="red"
                onClick={() => alert("Cancel invite coming soon.")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddStaffModal({ onClose }: { onClose: () => void }) {
  const create = useCreateStaff();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("waiter");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const valid =
    name.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    create.reset();
    create.mutate(
      { name: name.trim(), email: email.trim(), password, role },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full bg-surface rounded-2xl p-6 border border-border"
        noValidate
      >
        <h2 className="text-text-primary font-bold text-xl">Add Staff</h2>
        <p className="text-text-secondary text-sm mt-1 mb-5">
          They'll receive an invitation to sign in.
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoCapitalize="words"
            className="w-full h-[52px] bg-bg border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoCapitalize="none"
            className="w-full h-[52px] bg-bg border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary password"
            autoCapitalize="none"
            className="w-full h-[52px] bg-bg border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
          />

          <div>
            <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-medium">
              Role
            </p>
            <div className="flex gap-2">
              {(["manager", "waiter", "kitchen"] as Role[]).map((r) => {
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 h-12 rounded-xl text-sm font-semibold capitalize transition-colors ${
                      active
                        ? "bg-amber text-black"
                        : "bg-bg border border-border text-text-primary hover:border-text-muted/60"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {create.isError ? (
          <p className="text-status-urgent text-xs mt-3">
            We couldn't send the invitation. Please try again.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!valid || create.isPending}
          className="mt-5 w-full h-[52px] bg-amber rounded-xl text-black font-semibold text-sm hover:bg-amber-pressed transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {create.isPending ? "Sending…" : "Send invitation"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="block w-full text-text-secondary text-sm text-center mt-3 hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-2xl px-4 py-3 flex items-center animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-surfaceActive" />
          <div className="flex-1 ml-3">
            <div className="h-4 w-32 bg-surfaceActive rounded mb-2" />
            <div className="h-3 w-48 bg-surfaceActive rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
