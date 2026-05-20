"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { SupportFeedbackModal } from "@/components/support/support-feedback-modal";
import { UserFeedbackModal } from "@/components/user-feedback/user-feedback-modal";

type FeedbackHubContextValue = {
  openUserFeedback: () => void;
  openSupportFeedback: () => void;
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

  const openSupportFeedback = useCallback(() => setIsSupportOpen(true), []);
  const closeSupportFeedback = useCallback(() => setIsSupportOpen(false), []);

  const openUserFeedback = useCallback(() => setIsUserFeedbackOpen(true), []);
  const closeUserFeedback = useCallback(() => setIsUserFeedbackOpen(false), []);

  return (
    <FeedbackHubContext.Provider value={{ openUserFeedback, openSupportFeedback }}>
      {children}
      <SupportFeedbackModal isOpen={isSupportOpen} onClose={closeSupportFeedback} />
      <UserFeedbackModal isOpen={isUserFeedbackOpen} onClose={closeUserFeedback} />
    </FeedbackHubContext.Provider>
  );
}
