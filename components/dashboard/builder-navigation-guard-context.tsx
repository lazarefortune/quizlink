"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { shouldInterceptNavigation } from "@/lib/should-intercept-builder-navigation";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuilderNavigationGuardContextValue = {
  setBuilderHasUnsavedChanges: (dirty: boolean) => void;
  interceptLinkClick: (event: MouseEvent, href: string) => boolean;
  requestNavigate: (href: string) => void;
  requestAction: (action: () => void | Promise<void>) => void;
  runNavigationBypass: (fn: () => void) => void;
};

const defaultContext: BuilderNavigationGuardContextValue = {
  setBuilderHasUnsavedChanges: () => {},
  interceptLinkClick: () => false,
  requestNavigate: () => {},
  requestAction: () => {},
  runNavigationBypass: (fn) => fn(),
};

const BuilderNavigationGuardContext =
  createContext<BuilderNavigationGuardContextValue>(defaultContext);

export function useBuilderNavigationGuard() {
  return useContext(BuilderNavigationGuardContext);
}

export function BuilderNavigationGuardProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { locale } = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const builderDirtyRef = useRef(false);
  const bypassRef = useRef(0);
  const pendingRef = useRef<(() => void | Promise<void>) | null>(null);

  const setBuilderHasUnsavedChanges = useCallback((dirty: boolean) => {
    builderDirtyRef.current = dirty;
  }, []);

  const runNavigationBypass = useCallback((fn: () => void) => {
    bypassRef.current += 1;
    try {
      fn();
    } finally {
      queueMicrotask(() => {
        bypassRef.current -= 1;
      });
    }
  }, []);

  const shouldBlockNavigation = useCallback(
    (href: string) => {
      if (bypassRef.current > 0) {
        return false;
      }
      return shouldInterceptNavigation(pathname, href, builderDirtyRef.current);
    },
    [pathname],
  );

  const openConfirm = useCallback((action: () => void | Promise<void>) => {
    pendingRef.current = action;
    setDialogOpen(true);
  }, []);

  const requestNavigate = useCallback(
    (href: string) => {
      if (!shouldBlockNavigation(href)) {
        router.push(href);
        return;
      }
      openConfirm(() => {
        router.push(href);
      });
    },
    [openConfirm, router, shouldBlockNavigation],
  );

  const requestAction = useCallback(
    (action: () => void | Promise<void>) => {
      if (!pathname.startsWith("/builder") || !builderDirtyRef.current || bypassRef.current > 0) {
        void Promise.resolve(action());
        return;
      }
      openConfirm(action);
    },
    [openConfirm, pathname],
  );

  const interceptLinkClick = useCallback(
    (event: MouseEvent, href: string) => {
      if (!shouldBlockNavigation(href)) {
        return false;
      }
      event.preventDefault();
      openConfirm(() => {
        router.push(href);
      });
      return true;
    },
    [openConfirm, router, shouldBlockNavigation],
  );

  const handleStayEditing = useCallback(() => {
    pendingRef.current = null;
    setDialogOpen(false);
  }, []);

  const handleLeaveWithoutSaving = useCallback(() => {
    const next = pendingRef.current;
    pendingRef.current = null;
    setDialogOpen(false);
    if (next) {
      void Promise.resolve(next());
    }
  }, []);

  const value: BuilderNavigationGuardContextValue = useMemo(
    () => ({
      setBuilderHasUnsavedChanges,
      interceptLinkClick,
      requestNavigate,
      requestAction,
      runNavigationBypass,
    }),
    [
      interceptLinkClick,
      requestAction,
      requestNavigate,
      runNavigationBypass,
      setBuilderHasUnsavedChanges,
    ],
  );

  return (
    <BuilderNavigationGuardContext.Provider value={value}>
      {children}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleStayEditing();
          }
        }}
      >
        <DialogContent className="sm:max-w-md gap-0 overflow-hidden border-2 p-0 shadow-xl">
          <div className="px-6 pb-4 pt-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
                aria-hidden
              >
                <AlertTriangle className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <DialogHeader className="flex-1 space-y-2 text-left sm:space-y-2">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {t(locale, "builder.unsavedNavigation.title")}
                </DialogTitle>
                <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                  {t(locale, "builder.unsavedNavigation.description")}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 border-t border-border/80 bg-muted/30 px-6 py-4 sm:flex-col-reverse sm:gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outlineBlue"
              className="h-11 w-full font-semibold"
              onClick={handleStayEditing}
            >
              {t(locale, "builder.unsavedNavigation.continueEditing")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-11 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
              )}
              onClick={handleLeaveWithoutSaving}
            >
              {t(locale, "builder.unsavedNavigation.leaveWithoutSaving")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BuilderNavigationGuardContext.Provider>
  );
}
