import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/** How long a toast stays up before it dismisses itself. */
const TOAST_MS = 3000;

interface ToastEntry {
  id: number;
  message: string;
}

/**
 * Raising an error is a no-op until the provider is mounted, so a component
 * that ends up outside it degrades to silence rather than crashing. App.tsx
 * wraps the whole router, so in practice every call site is covered.
 */
const ToastContext = createContext<(message: string) => void>(() => {});

/** Raise a transient failure. Field-level validation stays inline — see BurialGround. */
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message }]);
      timers.current.push(window.setTimeout(() => dismiss(id), TOAST_MS));
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}

      {/*
        aria-live on the container rather than role="alert" per toast: the
        region has to already exist in the DOM when a message arrives, or
        screen readers miss it. Stays mounted and empty the rest of the time.
      */}
      <div
        aria-live="assertive"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-5 sm:pt-7"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <Slab key={toast.id} message={toast.message} onDismiss={() => dismiss(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function Slab({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.97 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
      transition={reduced ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="grave-toast pointer-events-auto relative w-full max-w-sm overflow-hidden"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
      >
        <span
          aria-hidden="true"
          className="mt-[3px] font-serif text-base leading-none text-[hsl(var(--destructive-foreground))]"
        >
          †
        </span>
        <span>
          <span className="engrave block text-[10px] uppercase tracking-[2px] text-[hsl(var(--destructive-foreground))]">
            The ground refused it
          </span>
          <span className="mt-1 block text-sm leading-snug text-foreground">{message}</span>
        </span>
      </button>

      {/* Drains over the toast's lifetime, so the countdown is visible rather than a surprise. */}
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: TOAST_MS / 1000, ease: "linear" }}
        style={{ transformOrigin: "left" }}
        className="absolute inset-x-0 bottom-0 h-px bg-[hsl(var(--destructive))]"
      />
    </motion.div>
  );
}
