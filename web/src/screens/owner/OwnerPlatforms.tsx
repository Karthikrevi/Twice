import { usePlatforms, type PlatformRow } from "@/hooks/usePlatforms";

interface PlatformMeta {
  key: "talabat" | "deliveroo" | "instashop";
  name: string;
  method: string;
  methodItalic?: boolean;
  color: string;
  initial: string;
}

const PLATFORMS: PlatformMeta[] = [
  {
    key: "talabat",
    name: "Talabat + InstaShop",
    method: "Connected via Delivery Hero",
    color: "#FF6D00",
    initial: "T",
  },
  {
    key: "deliveroo",
    name: "Deliveroo",
    method: "Connected via OAuth",
    color: "#00CCBC",
    initial: "D",
  },
  {
    key: "instashop",
    name: "InstaShop",
    method: "Shares Delivery Hero token with Talabat",
    methodItalic: true,
    color: "#43A047",
    initial: "I",
  },
];

const COMING_SOON = [
  { name: "Careem Food" },
  { name: "Noon Food" },
];

function relativeTime(iso?: string) {
  if (!iso) return "—";
  try {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const min = Math.floor(diff / 60_000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  } catch {
    return "—";
  }
}

export default function OwnerPlatforms() {
  const platforms = usePlatforms();

  const byKey = new Map<string, PlatformRow>();
  (platforms.data ?? []).forEach((p) => byKey.set(p.platform, p));

  return (
    <div className="px-6 py-5 max-w-3xl">
      {/* Header */}
      <h1 className="text-text-primary font-bold text-3xl tracking-tight">
        Platform Connections.
      </h1>
      <p className="text-text-secondary text-sm mt-1.5">
        Manage your delivery platform integrations
      </p>

      {/* Cards */}
      <div className="flex flex-col gap-3 mt-6">
        {platforms.isLoading ? (
          <SkeletonList />
        ) : (
          PLATFORMS.map((meta) => (
            <PlatformCard key={meta.key} meta={meta} row={byKey.get(meta.key)} />
          ))
        )}
      </div>

      {/* Add platform */}
      <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mt-8 mb-3">
        Add platform
      </p>
      <div className="grid grid-cols-2 gap-3">
        {COMING_SOON.map((p) => (
          <div
            key={p.name}
            className="bg-surface border border-dashed border-border rounded-2xl p-4"
          >
            <p className="text-text-secondary font-semibold text-sm">{p.name}</p>
            <p className="text-amber text-xs mt-1 font-medium">Coming soon</p>
            <button
              type="button"
              onClick={() =>
                alert(
                  `We'll notify you when ${p.name} integration is available.`
                )
              }
              className="mt-3 bg-surfaceActive border border-border rounded-lg px-3 h-8 text-text-secondary text-xs font-medium hover:border-amber/50 transition-colors"
            >
              Notify me
            </button>
          </div>
        ))}
      </div>

      {/* Security info */}
      <div className="bg-surface border border-border rounded-xl px-4 py-3 mt-6 flex items-center gap-3">
        <LockIcon />
        <p className="text-text-secondary text-xs leading-relaxed">
          All credentials are encrypted with AES-256 and stored securely. Once
          never shares your data with third parties.
        </p>
      </div>
    </div>
  );
}

function PlatformCard({
  meta,
  row,
}: {
  meta: PlatformMeta;
  row?: PlatformRow;
}) {
  const connected = row?.status === "connected";
  const missing = !row;
  const accent = connected ? "#22C55E" : "#EF4444";
  const rate = row?.commission_rate ?? 0;

  const onDisconnect = () => {
    if (
      window.confirm(
        `Disconnect ${meta.name}? Orders will stop flowing immediately.`
      )
    ) {
      // TODO: useDisconnectPlatform().mutate(meta.key)
    }
  };

  return (
    <div
      className="bg-surface border border-border rounded-2xl p-4 border-l-[3px]"
      style={{ borderLeftColor: accent }}
    >
      {/* Top row */}
      <div className="flex items-center gap-3">
        <span
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base"
          style={{ backgroundColor: meta.color }}
        >
          {meta.initial}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-semibold text-sm truncate">
            {meta.name}
          </p>
          <p
            className={`text-text-secondary text-xs mt-0.5 truncate ${
              meta.methodItalic ? "italic" : ""
            }`}
          >
            {meta.method}
          </p>
        </div>
        <span
          className="rounded-full px-3 h-7 text-xs font-semibold flex items-center"
          style={{
            backgroundColor: accent + "33",
            border: `1px solid ${accent}66`,
            color: accent,
          }}
        >
          {connected ? "Connected" : missing ? "Not connected" : "Issue"}
        </span>
      </div>

      <div className="h-px bg-border mt-3 mb-3" />

      {/* Info row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="block w-2 h-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span className="text-text-secondary text-xs">
            {connected
              ? `Last sync: ${relativeTime(row?.updated_at)}`
              : "Auth expired"}
          </span>
        </div>
        <span className="text-text-secondary text-xs">
          Commission rate: {Math.round(rate * 100)}%
        </span>
      </div>

      {/* Action row */}
      <div className="flex justify-end gap-2 mt-3">
        {connected ? (
          <button
            type="button"
            className="bg-surfaceActive border border-border rounded-lg px-3 h-9 text-text-primary text-xs font-semibold hover:border-text-muted/60 transition-colors"
          >
            Manage
          </button>
        ) : (
          <button
            type="button"
            className="bg-amber hover:bg-amber-pressed text-black rounded-lg px-3 h-9 text-xs font-semibold transition-colors"
          >
            Reconnect
          </button>
        )}
        {!missing ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="rounded-lg px-3 h-9 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: "#EF444422",
              border: "1px solid #EF444466",
              color: "#EF4444",
            }}
          >
            Disconnect
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-2xl p-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surfaceActive" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-surfaceActive rounded mb-2" />
              <div className="h-3 w-48 bg-surfaceActive rounded" />
            </div>
            <div className="h-6 w-20 bg-surfaceActive rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}

function LockIcon() {
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
      className="text-text-secondary flex-shrink-0"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
