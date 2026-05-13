import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { api } from "@/lib/api";
import { storage } from "@/lib/storage";
import { connectSocket } from "@/lib/socket";
import { useSession, type Role, type User } from "@/store/session";

const ROLE_HOME: Record<Role, string> = {
  owner: "/owner",
  manager: "/manager",
  waiter: "/waiter",
  kitchen: "/kitchen",
};

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  restaurantName?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;
  const restaurantName = useSession((s) => s.restaurantName);
  const setUser = useSession((s) => s.setUser);
  const setRestaurantName = useSession((s) => s.setRestaurantName);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Shared session-bootstrap used by both email and Google login flows.
  const completeLogin = (
    data: LoginResponse,
    options: { keepLoggedIn: boolean }
  ) => {
    storage.setAccess(data.accessToken);
    storage.setRefresh(data.refreshToken);
    storage.setUser(data.user);
    storage.setKeepLoggedIn(options.keepLoggedIn);
    if (data.restaurantName) storage.setRestaurantName(data.restaurantName);
    connectSocket(data.accessToken);
    setUser(data.user);
    if (data.restaurantName) setRestaurantName(data.restaurantName);
    navigate(ROLE_HOME[data.user.role], { replace: true });
  };

  const login = useMutation({
    mutationFn: async (input: { email: string; password: string; keepLoggedIn: boolean }) => {
      const { data } = await api.post<LoginResponse>("/auth/login", input);
      return { ...data, keepLoggedIn: input.keepLoggedIn };
    },
    onSuccess: (data) => {
      completeLogin(data, { keepLoggedIn: data.keepLoggedIn });
    },
  });

  const googleMut = useMutation({
    mutationFn: async (access_token: string) => {
      const { data } = await api.post<LoginResponse>("/auth/google", { access_token });
      return data;
    },
    onSuccess: (data) => {
      completeLogin(data, { keepLoggedIn });
    },
  });

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      googleMut.reset();
      googleMut.mutate(tokenResponse.access_token);
    },
    onError: () => {
      // user cancelled or Google popup blocked — handled inline below
    },
  });

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;
  const disabled = !valid || login.isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    login.reset();
    login.mutate({ email: email.trim(), password, keepLoggedIn });
  };

  const errorMessage = login.isError
    ? axios.isAxiosError(login.error) && login.error.response?.status === 401
      ? "Email or password is incorrect."
      : "We couldn't sign you in. Try again."
    : undefined;

  const googleErrorMessage = googleMut.isError
    ? axios.isAxiosError(googleMut.error) && googleMut.error.response?.status === 404
      ? (googleMut.error.response.data as { message?: string } | undefined)?.message ??
        "No Once account found for this Google account. Please register first."
      : "We couldn't sign you in with Google. Try again."
    : undefined;

  return (
    <div className="bg-bg min-h-screen flex items-center justify-center">
      <form
        onSubmit={submit}
        className="max-w-sm w-full mx-auto px-8 py-12"
        noValidate
      >
        {/* Wordmark */}
        <p className="text-amber font-semibold text-sm tracking-[10px] text-center mb-8">
          O N C E
        </p>

        {/* Heading */}
        <h1 className="font-bold text-3xl text-text-primary text-left tracking-tight">
          Welcome back.
        </h1>
        <p className="text-text-secondary text-sm mt-1 mb-6 text-left">
          {(restaurantName ?? "Once") + " · sign in to continue"}
        </p>

        {successMessage ? (
          <div className="mb-5 rounded-xl border border-status-available/40 bg-status-available/10 px-4 py-3">
            <p className="text-status-available text-sm font-medium">
              {successMessage}
            </p>
          </div>
        ) : null}

        {/* Google sign-in */}
        <button
          type="button"
          onClick={() => {
            googleMut.reset();
            googleLogin();
          }}
          disabled={googleMut.isPending}
          className="w-full h-[52px] bg-surface border border-border rounded-xl flex items-center justify-center gap-3 hover:border-amber/50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleMut.isPending ? <Spinner /> : <GoogleIcon />}
          <span className="text-text-primary font-semibold text-sm">
            {googleMut.isPending ? "Signing in…" : "Continue with Google"}
          </span>
        </button>

        {googleErrorMessage ? (
          <p className="text-status-urgent text-xs mt-2">{googleErrorMessage}</p>
        ) : null}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-xs uppercase tracking-widest">
            or
          </span>
          <span className="flex-1 h-px bg-border" />
        </div>

        {/* Email */}
        <label className="block">
          <span className="block text-text-secondary text-xs uppercase tracking-widest mb-1 font-medium">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@restaurant.ae"
            className="w-full h-[52px] bg-surface border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
          />
        </label>

        <div className="h-3" />

        {/* Password + eye toggle */}
        <label className="block">
          <div className="flex items-center justify-between mb-1">
            <span className="block text-text-secondary text-xs uppercase tracking-widest font-medium">
              Password
            </span>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-amber text-sm hover:opacity-80 cursor-pointer transition-opacity"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-[52px] bg-surface border border-border rounded-xl pl-4 pr-12 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon open={!showPassword} />
            </button>
          </div>
        </label>

        {errorMessage ? (
          <p className="text-status-urgent text-xs mt-2">{errorMessage}</p>
        ) : null}

        {/* Keep me logged in */}
        <label className="flex items-center mt-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
            className="sr-only"
          />
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded border mr-2 transition-colors ${
              keepLoggedIn
                ? "bg-amber border-amber"
                : "bg-surface border-border"
            }`}
          >
            {keepLoggedIn ? <CheckIcon /> : null}
          </span>
          <span className="text-text-secondary text-sm">Keep me logged in</span>
        </label>

        {/* Sign in */}
        <button
          type="submit"
          disabled={disabled}
          className="mt-6 w-full h-[52px] bg-amber rounded-xl font-semibold text-sm text-black hover:bg-amber-pressed transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {login.isPending ? <Spinner /> : "Sign in"}
        </button>

        <p className="text-center text-sm mt-4">
          <Link
            to="/register"
            className="text-amber hover:opacity-80 cursor-pointer transition-opacity font-medium"
          >
            Register your restaurant
          </Link>
        </p>

        <p className="text-text-muted text-xs text-center mt-6">
          Sessions expire after 15 minutes of inactivity.
        </p>
        <p className="text-text-muted text-xs text-center mt-4">
          Trouble signing in? Contact your restaurant owner.
        </p>
        <p className="text-text-muted text-xs text-center mt-4">
          <Link to="/privacy" className="hover:text-text-secondary transition-colors">
            Privacy Policy
          </Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="hover:text-text-secondary transition-colors">
            Terms
          </Link>
        </p>
      </form>

      {forgotOpen ? (
        <ForgotPasswordModal
          initialEmail={email}
          onClose={() => setForgotOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ForgotPasswordModal({
  initialEmail,
  onClose,
}: {
  initialEmail: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);

  const forgot = useMutation({
    mutationFn: async (target: string) => {
      await api.post("/auth/forgot-password", { email: target });
    },
  });

  const valid = /\S+@\S+\.\S+/.test(email);
  const errorMessage = forgot.isError
    ? "We couldn't send a reset link. Check your connection and try again."
    : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || forgot.isPending || forgot.isSuccess) return;
    forgot.reset();
    forgot.mutate(email.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-w-sm w-full bg-surface rounded-2xl p-6 border border-border"
        noValidate
      >
        <h2 className="font-bold text-xl text-text-primary">Reset password</h2>
        <p className="text-text-secondary text-sm mt-1 mb-4">
          Enter your email and we'll send a reset link.
        </p>

        <label className="block">
          <span className="block text-text-secondary text-xs uppercase tracking-widest mb-1 font-medium">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={forgot.isSuccess}
            placeholder="you@restaurant.ae"
            className="w-full h-[52px] bg-bg border border-border rounded-xl px-4 text-text-primary text-sm placeholder-text-muted focus:border-amber focus:outline-none transition-colors disabled:opacity-60"
          />
        </label>

        {forgot.isSuccess ? (
          <div className="mt-4 rounded-xl border border-status-available/40 bg-status-available/10 px-4 py-3">
            <p className="text-status-available text-sm font-medium">
              Check your email for a reset link.
            </p>
          </div>
        ) : errorMessage ? (
          <p className="text-status-urgent text-xs mt-3">{errorMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={!valid || forgot.isPending || forgot.isSuccess}
          className="mt-5 w-full h-[52px] bg-amber rounded-xl font-semibold text-sm text-black hover:bg-amber-pressed transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {forgot.isPending ? <Spinner /> : forgot.isSuccess ? "Sent" : "Send reset link"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="block w-full text-text-secondary text-sm text-center mt-3 cursor-pointer hover:text-text-primary transition-colors"
        >
          Back to sign in
        </button>
      </form>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.45c-.28 1.45-1.12 2.68-2.39 3.51v2.92h3.86c2.26-2.08 3.57-5.15 3.57-8.67z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-2.92c-1.07.72-2.44 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.12C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.37A7.187 7.187 0 0 1 4.87 12c0-.82.14-1.62.4-2.37V6.51H1.29A11.98 11.98 0 0 0 0 12c0 1.94.47 3.77 1.29 5.39l3.98-3.02z"
      />
      <path
        fill="#EA4335"
        d="M12 4.74c1.77 0 3.35.61 4.6 1.81l3.42-3.42C17.95 1.18 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.98 3.02C6.22 6.85 8.87 4.74 12 4.74z"
      />
    </svg>
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
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
