"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "quizsnap-dashboard-sidebar-collapsed";

type DashboardSidebarLayoutContextValue = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

const DashboardSidebarLayoutContext = createContext<DashboardSidebarLayoutContextValue | null>(
  null,
);

function readStoredCollapsed(): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  return null;
}

export function DashboardSidebarLayoutProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [isCollapsed, setIsCollapsed] = useState(() => pathname.startsWith("/builder"));

  useEffect(() => {
    const stored = readStoredCollapsed();
    if (stored !== null) {
      setIsCollapsed(stored);
      return;
    }
    setIsCollapsed(pathname.startsWith("/builder"));
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      return next;
    });
  }, []);

  return (
    <DashboardSidebarLayoutContext.Provider value={{ isCollapsed, toggleCollapsed }}>
      {children}
    </DashboardSidebarLayoutContext.Provider>
  );
}

export function useDashboardSidebarLayout(): DashboardSidebarLayoutContextValue {
  const ctx = useContext(DashboardSidebarLayoutContext);
  if (!ctx) {
    throw new Error("useDashboardSidebarLayout must be used within DashboardSidebarLayoutProvider");
  }
  return ctx;
}
