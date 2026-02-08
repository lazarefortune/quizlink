"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

type ToastProps = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
};

const toastTypeConfig: Record<
  ToastType,
  { Icon: React.ComponentType<{ className?: string }>; iconWrapClass: string; borderClass: string }
> = {
  success: {
    Icon: CheckCircle2,
    iconWrapClass: "bg-primary/15 text-primary",
    borderClass: "border-primary/35 dark:border-primary/50",
  },
  error: {
    Icon: XCircle,
    iconWrapClass: "bg-destructive/15 text-destructive",
    borderClass: "border-destructive/35 dark:border-destructive/50",
  },
  info: {
    Icon: Info,
    iconWrapClass: "bg-blue/15 text-blue",
    borderClass: "border-blue/35 dark:border-blue/50",
  },
  warning: {
    Icon: AlertTriangle,
    iconWrapClass: "bg-warning/15 text-warning",
    borderClass: "border-warning/40 dark:border-warning/50",
  },
};

const TOAST_EXIT_MS = 300;

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [phase, setPhase] = React.useState<"entering" | "visible" | "exiting">("entering");

  React.useEffect(() => {
    const toVisible = window.setTimeout(() => setPhase("visible"), TOAST_EXIT_MS);
    return () => clearTimeout(toVisible);
  }, []);

  React.useEffect(() => {
    if (duration <= 0) return;
    const timer = window.setTimeout(() => setPhase("exiting"), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  React.useEffect(() => {
    if (phase !== "exiting") return;
    const timer = window.setTimeout(onClose, TOAST_EXIT_MS);
    return () => clearTimeout(timer);
  }, [phase, onClose]);

  const handleClose = () => {
    if (phase === "exiting") return;
    setPhase("exiting");
  };

  const config = toastTypeConfig[type];
  const Icon = config.Icon;

  const animationClass =
    phase === "entering"
      ? "animate-toast-enter"
      : phase === "exiting"
        ? "animate-toast-exit"
        : "translate-x-0 opacity-100";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 bg-card p-4 shadow-[var(--shadow-outline-subtle),var(--shadow-outline-depth)] transition-none",
        config.borderClass,
        animationClass
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
          config.iconWrapClass
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium text-card-foreground">{message}</p>
      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [toasts, setToasts] = React.useState<
    Array<{ id: string; message: string; type: ToastType; duration: number }>
  >([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info", duration: number = 3000) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const container =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed top-4 right-4 z-9999 flex min-w-[320px] max-w-[420px] flex-col gap-2"
            aria-label="Notifications"
          >
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={() => removeToast(toast.id)}
              />
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {container}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
