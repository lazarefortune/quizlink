"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
};

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const Icon = type === "success" ? CheckCircle2 : type === "error" ? XCircle : Info;

  const toastContent = typeof window !== "undefined" && isVisible ? (
    createPortal(
      <div
        className={cn(
          "fixed bottom-4 right-4 z-[9999] flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg transition-all duration-300",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            type === "success" && "text-green-600",
            type === "error" && "text-red-600",
            type === "info" && "text-blue-600"
          )}
        />
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>,
      document.body
    )
  ) : null;

  return toastContent;
}

type ToastContextType = {
  showToast: (message: string, type?: "success" | "error" | "info", duration?: number) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; type: "success" | "error" | "info"; duration: number }>>([]);

  const showToast = React.useCallback(
    (message: string, type: "success" | "error" | "info" = "info", duration: number = 3000) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
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
