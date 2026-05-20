"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { SupportFeedbackModal } from "@/components/support/support-feedback-modal";
import type { SupportFeedbackPreset } from "@/components/support/support-feedback-preset";
import { UserFeedbackModal } from "@/components/user-feedback/user-feedback-modal";

type FeedbackHubContextValue = {
  openUserFeedback: () => void;
  openSupportFeedback: (preset?: SupportFeedbackPreset) => void;
};

const FeedbackHubContext = createContext<FeedbackHubContextValue | null>(null);

export function useSupportFeedback(): FeedbackHubContextValue {
  const ctx = useContext(FeedbackHubContext);
  if (!ctx) {
    throw new Error("useSupportFeedback must be used within SupportFeedbackProvider");
  }
  return ctx;
}

export function useFeedbackHub(): FeedbackHubContextValue {
  return useSupportFeedback();
}

export function SupportFeedbackProvider({ children }: { children: ReactNode }) {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isUserFeedbackOpen, setIsUserFeedbackOpen] = useState(false);
  const [supportPreset, setSupportPreset] = useState<SupportFeedbackPreset | null>(null);

  const openSupportFeedback = useCallback((preset?: SupportFeedbackPreset) => {
    setSupportPreset(preset ?? null);
    setIsSupportOpen(true);
  }, []);

  const closeSupportFeedback = useCallback(() => {
    setIsSupportOpen(false);
    setSupportPreset(null);
  }, []);

  const openUserFeedback = useCallback(() => setIsUserFeedbackOpen(true), []);
  const closeUserFeedback = useCallback(() => setIsUserFeedbackOpen(false), []);

  return (
    <FeedbackHubContext.Provider value={{ openUserFeedback, openSupportFeedback }}>
      {children}
      <SupportFeedbackModal
        isOpen={isSupportOpen}
        preset={supportPreset}
        onClose={closeSupportFeedback}
      />
      <UserFeedbackModal isOpen={isUserFeedbackOpen} onClose={closeUserFeedback} />
    </FeedbackHubContext.Provider>
  );
}
