import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { api } from "@/lib/api";

type Digits = [string, string, string, string];
const EMPTY: Digits = ["", "", "", ""];

export function usePinPrompt() {
  const [visible, setVisible] = useState(false);
  const [pin, setPin] = useState<Digits>(EMPTY);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionRef = useRef<(() => void) | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    setPin(EMPTY);
    setError(null);
    setVerifying(false);
  }, []);

  const requirePin = useCallback(
    (action: () => void) => {
      actionRef.current = action;
      reset();
      setVisible(true);
      setTimeout(() => inputRefs.current[0]?.focus(), 60);
    },
    [reset]
  );

  const close = useCallback(() => {
    setVisible(false);
    actionRef.current = null;
    reset();
  }, [reset]);

  // Escape to close
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible, close]);

  const runShake = () => {
    const el = panelRef.current;
    if (!el) return;
    const seq = [10, -10, 8, -8, 5, -5, 0];
    let i = 0;
    const id = setInterval(() => {
      if (!panelRef.current) return clearInterval(id);
      panelRef.current.style.transform = `translateX(${seq[i] ?? 0}px)`;
      i++;
      if (i >= seq.length) {
        clearInterval(id);
      }
    }, 60);
  };

  const submit = useCallback(
    async (pinStr: string) => {
      setVerifying(true);
      setError(null);
      try {
        await api.post("/auth/verify-pin", { pin: pinStr });
        const action = actionRef.current;
        actionRef.current = null;
        setVisible(false);
        reset();
        action?.();
      } catch {
        setError("Incorrect PIN");
        runShake();
        setPin(EMPTY);
        setTimeout(() => inputRefs.current[0]?.focus(), 30);
      } finally {
        setVerifying(false);
      }
    },
    [reset]
  );

  const onDigit = (i: number, value: string) => {
    const ch = value.replace(/\D/g, "").slice(-1);
    setPin((prev) => {
      const next = [...prev] as Digits;
      next[i] = ch;
      if (ch && i < 3) {
        setTimeout(() => inputRefs.current[i + 1]?.focus(), 0);
      }
      if (next.every((c) => c.length === 1)) {
        const pinStr = next.join("");
        setTimeout(() => submit(pinStr), 80);
      }
      return next;
    });
    setError(null);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  function PinPromptModal() {
    if (!visible) return null;
    return (
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-7"
        onClick={close}
      >
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full"
          style={{ transition: "transform 60ms linear" }}
        >
          <h2 className="text-text-primary font-bold text-xl tracking-tight">
            Owner PIN Required
          </h2>
          <p className="text-text-secondary text-sm mt-1.5 mb-5">
            Enter the 4-digit owner PIN to continue.
          </p>

          <div className="flex gap-3 justify-between">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={pin[i]}
                onChange={(e) => onDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                disabled={verifying}
                className="flex-1 h-[60px] bg-bg rounded-xl text-center text-amber font-bold text-2xl focus:outline-none transition-colors"
                style={{
                  border: `1px solid ${error ? "#EF4444" : "#2C2F3A"}`,
                }}
              />
            ))}
          </div>

          {error ? (
            <p className="text-status-urgent text-xs font-medium text-center mt-3.5">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={close}
            className="block w-full text-text-secondary text-sm text-center mt-5 hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return { requirePin, PinPromptModal };
}
