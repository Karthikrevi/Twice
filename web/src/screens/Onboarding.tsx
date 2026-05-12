import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";

// ---------- Types ----------

type Step = 0 | 1 | 2 | 3 | 4;
type Role = "manager" | "waiter" | "kitchen";
type KitchenOutput = "screen" | "printer";

interface MenuDraft {
  id: string;
  name: string;
  price: number;
  stock: number;
}
interface StaffDraft {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface WizardState {
  restaurantName: string;
  location: string;
  ownerEmail: string;
  ownerPassword: string;
  tableCount: number;
  kitchenOutput: KitchenOutput;
  menu: MenuDraft[];
  deliveryHeroToken: string;
  deliverooConnected: boolean;
  staff: StaffDraft[];
}

const INITIAL: WizardState = {
  restaurantName: "",
  location: "",
  ownerEmail: "",
  ownerPassword: "",
  tableCount: 8,
  kitchenOutput: "screen",
  menu: [],
  deliveryHeroToken: "",
  deliverooConnected: false,
  staff: [],
};

const TOTAL_STEPS = 5;

// ---------- Page ----------

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [state, setState] = useState<WizardState>(INITIAL);

  const submit = useMutation({
    mutationFn: async (payload: WizardState) => {
      const body = {
        restaurant: {
          name: payload.restaurantName.trim(),
          location: payload.location.trim(),
          kitchenOutput: payload.kitchenOutput,
          tableCount: payload.tableCount,
        },
        owner: {
          name: payload.ownerEmail.split("@")[0] || "Owner",
          email: payload.ownerEmail.trim(),
          password: payload.ownerPassword,
        },
        menu: payload.menu.map((m) => ({
          name: m.name,
          priceCents: Math.round(m.price * 100),
          stock: m.stock,
        })),
        staff: payload.staff.map((s) => ({
          name: s.name,
          email: s.email,
          password: s.password,
          role: s.role,
        })),
        platforms: {
          deliveryHeroToken: payload.deliveryHeroToken || undefined,
          deliverooToken: payload.deliverooConnected ? "deliveroo-oauth-pending" : undefined,
        },
      };
      const { data } = await api.post<{ restaurantId: string }>("/setup", body);
      return data;
    },
    onSuccess: async () => {
      storage.markSetupDone();
      if (state.restaurantName.trim()) storage.setRestaurantName(state.restaurantName.trim());
      navigate("/login", {
        replace: true,
        state: { successMessage: "Restaurant created! Sign in to continue." },
      });
    },
  });

  const setField = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const next = () => setStep((s) => (Math.min(s + 1, TOTAL_STEPS - 1) as Step));
  const prev = () => setStep((s) => (Math.max(s - 1, 0) as Step));

  // ---------- validation ----------
  const step1Valid =
    state.restaurantName.trim().length >= 2 &&
    state.location.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(state.ownerEmail) &&
    state.ownerPassword.length >= 6;
  const step3Valid = state.menu.length > 0;

  const onFinish = () => {
    submit.reset();
    submit.mutate(state);
  };

  const errorMessage = submit.isError
    ? axios.isAxiosError(submit.error) && submit.error.response?.data?.error === "bad_input"
      ? "Some details are missing or invalid. Please go back and review."
      : "We couldn't complete setup. Check your connection and try again."
    : undefined;

  // ---------- render ----------
  return (
    <div className="bg-bg min-h-screen flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto px-8 py-10 relative">
        {step > 0 ? (
          <button
            type="button"
            onClick={prev}
            className="absolute left-8 top-10 text-text-secondary text-sm cursor-pointer hover:text-text-primary transition-colors"
          >
            ← Back
          </button>
        ) : null}

        <p className="text-amber font-semibold text-sm tracking-[10px] text-center mb-8">
          O N C E
        </p>

        {/* Progress bar */}
        <div className="flex flex-row gap-1.5 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-amber" : "bg-border"
              }`}
            />
          ))}
        </div>

        <p className="text-text-secondary text-xs mb-4">
          Step {step + 1} of {TOTAL_STEPS}
        </p>

        {step === 0 && (
          <Step1Account
            state={state}
            setField={setField}
            onNext={next}
            canContinue={step1Valid}
          />
        )}
        {step === 1 && (
          <Step2Space state={state} setField={setField} onNext={next} />
        )}
        {step === 2 && (
          <Step3Menu
            state={state}
            setField={setField}
            onNext={next}
            canContinue={step3Valid}
          />
        )}
        {step === 3 && (
          <Step4Platforms state={state} setField={setField} onSkip={next} onNext={next} />
        )}
        {step === 4 && (
          <Step5Staff
            state={state}
            setField={setField}
            onFinish={onFinish}
            loading={submit.isPending}
            errorMessage={errorMessage}
          />
        )}
      </div>
    </div>
  );
}

// ---------- shared primitives ----------

interface StepProps {
  state: WizardState;
  setField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="font-bold text-3xl text-text-primary tracking-tight">{title}</h1>
      <p className="text-text-secondary text-sm mt-1 mb-6">{subtitle}</p>
    </>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="block text-text-secondary text-xs uppercase tracking-widest mb-1 font-medium">
      {children}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "password" | "tel" | "number";
  placeholder?: string;
  autoCapitalize?: "none" | "words" | "sentences";
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        className="w-full h-[52px] bg-surface border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
      />
    </label>
  );
}

function PrimaryButton({
  label,
  onClick,
  disabled,
  loading,
  type = "button",
  flex,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  flex?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${
        flex ? "flex-1" : "w-full"
      } h-[52px] bg-amber rounded-xl font-semibold text-sm text-black hover:bg-amber-pressed transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
    >
      {loading ? <Spinner /> : label}
    </button>
  );
}

function SkipButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 h-[52px] rounded-xl border border-border bg-transparent text-text-secondary hover:text-text-primary text-sm font-semibold transition-colors"
    >
      {label}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

// ---------- Step 1 — Account ----------

function Step1Account({
  state,
  setField,
  onNext,
  canContinue,
}: StepProps & { onNext: () => void; canContinue: boolean }) {
  const [showPw, setShowPw] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (canContinue) onNext();
  };
  return (
    <form onSubmit={submit} noValidate>
      <Heading
        title="Create your restaurant."
        subtitle="This will be your owner account."
      />
      <div className="flex flex-col gap-4">
        <TextField
          label="Restaurant name"
          value={state.restaurantName}
          onChange={(v) => setField("restaurantName", v)}
          placeholder="Al Mandi House"
          autoCapitalize="words"
        />
        <TextField
          label="Location"
          value={state.location}
          onChange={(v) => setField("location", v)}
          placeholder="Jumeirah, Dubai"
        />
        <TextField
          label="Owner email"
          value={state.ownerEmail}
          onChange={(v) => setField("ownerEmail", v)}
          placeholder="owner@restaurant.ae"
          type="email"
          autoCapitalize="none"
        />
        <label className="block">
          <Label>Password</Label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={state.ownerPassword}
              onChange={(e) => setField("ownerPassword", e.target.value)}
              placeholder="At least 6 characters"
              autoCapitalize="none"
              className="w-full h-[52px] bg-surface border border-border rounded-xl pl-4 pr-12 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <EyeIcon open={!showPw} />
            </button>
          </div>
        </label>
      </div>
      <p className="text-text-muted text-xs mt-2">
        You can change these later in Settings.
      </p>
      <div className="mt-8">
        <PrimaryButton type="submit" label="Continue" disabled={!canContinue} />
      </div>
    </form>
  );
}

// ---------- Step 2 — Space ----------

function Step2Space({
  state,
  setField,
  onNext,
}: StepProps & { onNext: () => void }) {
  const dec = () => setField("tableCount", Math.max(1, state.tableCount - 1));
  const inc = () => setField("tableCount", Math.min(60, state.tableCount + 1));

  return (
    <div>
      <Heading
        title="Set up your space."
        subtitle="We'll handle the naming automatically."
      />

      {/* Tables counter card */}
      <div className="bg-surface border border-border rounded-2xl p-6 text-center">
        <p className="text-text-secondary text-xs uppercase tracking-widest mb-4 font-semibold">
          How many tables?
        </p>
        <div className="flex justify-center items-center gap-6">
          <button
            type="button"
            onClick={dec}
            className="w-12 h-12 bg-surfaceActive border border-border rounded-xl text-amber text-2xl font-bold hover:border-amber transition-colors flex items-center justify-center"
          >
            −
          </button>
          <span className="font-bold text-6xl text-text-primary tabular-nums leading-none tracking-tight">
            {state.tableCount}
          </span>
          <button
            type="button"
            onClick={inc}
            className="w-12 h-12 bg-surfaceActive border border-border rounded-xl text-amber text-2xl font-bold hover:border-amber transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>
        <p className="text-text-muted text-xs mt-3">
          Tables will be named T1 through T{state.tableCount}
        </p>

        {/* Preview */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {Array.from({ length: state.tableCount }).map((_, i) => (
            <span
              key={i}
              className="bg-surfaceActive border border-border rounded-lg w-12 h-10 flex items-center justify-center text-text-secondary text-xs font-semibold"
            >
              T{i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Kitchen output */}
      <p className="text-text-secondary text-xs uppercase tracking-widest mt-6 mb-3 font-semibold">
        Kitchen Output
      </p>
      <div className="grid grid-cols-2 gap-3">
        <KitchenOption
          active={state.kitchenOutput === "screen"}
          onSelect={() => setField("kitchenOutput", "screen")}
          title="Kitchen screen"
          desc="Live tickets on a tablet."
          glyph="▢"
        />
        <KitchenOption
          active={state.kitchenOutput === "printer"}
          onSelect={() => setField("kitchenOutput", "printer")}
          title="Thermal printer"
          desc="80mm tickets auto-print."
          glyph="⎙"
        />
      </div>

      <div className="mt-8">
        <PrimaryButton label="Continue" onClick={onNext} />
      </div>
    </div>
  );
}

function KitchenOption({
  active,
  onSelect,
  title,
  desc,
  glyph,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
  glyph: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-4 cursor-pointer flex items-start gap-3 text-left transition-colors ${
        active
          ? "bg-surfaceActive border-amber"
          : "bg-surface border-border hover:border-text-muted/60"
      }`}
    >
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold ${
          active ? "bg-amber text-black" : "bg-surfaceActive text-amber"
        }`}
      >
        {glyph}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-text-primary text-sm">{title}</p>
        <p className="text-text-secondary text-xs leading-snug mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

// ---------- Step 3 — Menu ----------

function Step3Menu({
  state,
  setField,
  onNext,
  canContinue,
}: StepProps & { onNext: () => void; canContinue: boolean }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const canAdd = name.trim().length > 0 && Number(price) > 0;

  const add = () => {
    if (!canAdd) return;
    const item: MenuDraft = {
      id: Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      price: Number(price),
      stock: Number(stock) || 0,
    };
    setField("menu", [...state.menu, item]);
    setName("");
    setPrice("");
    setStock("");
  };

  const remove = (id: string) =>
    setField("menu", state.menu.filter((m) => m.id !== id));

  return (
    <div>
      <Heading
        title="Build your menu."
        subtitle="Add at least one dish to continue."
      />

      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <p className="text-text-secondary text-xs uppercase tracking-widest mb-3 font-semibold">
          New dish
        </p>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dish name"
            className="w-full h-[52px] bg-surfaceActive border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price (AED)"
              className="flex-1 h-[52px] bg-surfaceActive border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
            />
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Stock"
              className="flex-1 h-[52px] bg-surfaceActive border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className={`w-full py-2 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors ${
              canAdd
                ? "text-amber border-amber/50 hover:border-amber"
                : "text-text-muted border-border opacity-50 cursor-not-allowed"
            }`}
          >
            Add to menu +
          </button>
        </div>
      </div>

      <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">
        Menu ({state.menu.length} {state.menu.length === 1 ? "item" : "items"})
      </p>
      {state.menu.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-4">No dishes yet</p>
      ) : (
        state.menu.map((m) => (
          <div
            key={m.id}
            className="bg-surfaceActive border border-border rounded-xl px-4 py-3 flex items-center justify-between mb-2"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary text-sm truncate">{m.name}</p>
              <p className="text-text-secondary text-xs mt-0.5">
                AED {m.price} · {m.stock} in stock
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(m.id)}
              className="text-status-urgent text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity ml-3"
            >
              Remove
            </button>
          </div>
        ))
      )}

      <div className="mt-8">
        <PrimaryButton label="Continue" onClick={onNext} disabled={!canContinue} />
      </div>
    </div>
  );
}

// ---------- Step 4 — Platforms ----------

function Step4Platforms({
  state,
  setField,
  onSkip,
  onNext,
}: StepProps & { onSkip: () => void; onNext: () => void }) {
  return (
    <div>
      <Heading
        title="Connect your platforms."
        subtitle="You can skip and connect later."
      />

      <div className="flex flex-col gap-3">
        {/* Talabat + InstaShop */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: "#FF6D00" }}
            >
              T
            </span>
            <div className="flex-1">
              <p className="font-semibold text-text-primary text-sm">
                Talabat + InstaShop
              </p>
              <p className="text-text-secondary text-xs mt-0.5">
                One Delivery Hero token covers both
              </p>
            </div>
          </div>
          <input
            type="text"
            value={state.deliveryHeroToken}
            onChange={(e) => setField("deliveryHeroToken", e.target.value)}
            placeholder="dh_vendor_••••••••••••"
            autoCapitalize="none"
            className="w-full h-[52px] bg-bg border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
          />
        </div>

        {/* Deliveroo */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: "#00CCBC" }}
            >
              D
            </span>
            <div className="flex-1">
              <p className="font-semibold text-text-primary text-sm">Deliveroo</p>
              <p className="text-text-secondary text-xs mt-0.5">
                Connect via OAuth — one tap.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setField("deliverooConnected", !state.deliverooConnected)
              }
              className={`h-10 px-4 rounded-lg font-semibold text-xs transition-colors ${
                state.deliverooConnected
                  ? "bg-status-available text-white"
                  : "bg-amber hover:bg-amber-pressed text-black"
              }`}
            >
              {state.deliverooConnected ? "Connected ✓" : "Connect"}
            </button>
          </div>
        </div>
      </div>

      <p className="text-text-muted text-xs mt-4 leading-relaxed">
        Credentials are encrypted with AES-256 on Once's servers. We only ever read order
        data, never customer payment details.
      </p>

      <div className="mt-8 flex gap-3">
        <SkipButton label="Skip for now" onClick={onSkip} />
        <PrimaryButton label="Continue" onClick={onNext} flex />
      </div>
    </div>
  );
}

// ---------- Step 5 — Staff ----------

function Step5Staff({
  state,
  setField,
  onFinish,
  loading,
  errorMessage,
}: StepProps & {
  onFinish: () => void;
  loading: boolean;
  errorMessage?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("waiter");

  const canAdd =
    name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const add = () => {
    if (!canAdd) return;
    setField("staff", [
      ...state.staff,
      {
        id: Math.random().toString(36).slice(2, 9),
        name: name.trim(),
        email,
        password,
        role,
      },
    ]);
    setName("");
    setEmail("");
    setPassword("");
  };

  const remove = (id: string) =>
    setField("staff", state.staff.filter((s) => s.id !== id));

  return (
    <div>
      <Heading
        title="Add your team."
        subtitle="Skip and add staff later from Settings."
      />

      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <p className="text-text-secondary text-xs uppercase tracking-widest mb-3 font-semibold">
          New staff member
        </p>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoCapitalize="words"
            className="w-full h-[52px] bg-surfaceActive border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoCapitalize="none"
            className="w-full h-[52px] bg-surfaceActive border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary password"
            autoCapitalize="none"
            className="w-full h-[52px] bg-surfaceActive border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
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
                    className={`flex-1 h-12 rounded-xl border text-sm font-semibold capitalize transition-colors ${
                      active
                        ? "bg-amber border-amber text-black"
                        : "bg-surfaceActive border-border text-text-primary hover:border-text-muted/60"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className={`w-full py-2 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors ${
              canAdd
                ? "text-amber border-amber/50 hover:border-amber"
                : "text-text-muted border-border opacity-50 cursor-not-allowed"
            }`}
          >
            Add staff member +
          </button>
        </div>
      </div>

      <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">
        Team ({state.staff.length})
      </p>
      {state.staff.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-4">
          No staff yet — you can finish without them
        </p>
      ) : (
        state.staff.map((s) => (
          <div
            key={s.id}
            className="bg-surfaceActive border border-border rounded-xl px-4 py-3 flex items-center justify-between mb-2"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary text-sm truncate">{s.name}</p>
              <p className="text-text-secondary text-xs mt-0.5 capitalize truncate">
                {s.role} · {s.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(s.id)}
              className="text-status-urgent text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity ml-3"
            >
              Remove
            </button>
          </div>
        ))
      )}

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-status-urgent/40 bg-status-urgent/10 px-4 py-3">
          <p className="text-status-urgent text-sm font-medium">{errorMessage}</p>
        </div>
      ) : null}

      <div className="mt-8 flex gap-3">
        <SkipButton label="Skip for now" onClick={onFinish} />
        <PrimaryButton
          label={loading ? "Setting up…" : "Finish setup"}
          onClick={onFinish}
          loading={loading}
          flex
        />
      </div>
    </div>
  );
}

