"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { SupportFeedbackModal } from "@/components/support/support-feedback-modal";

type SupportFeedbackContextValue = {
  openSupportFeedback: () => void;
};

const SupportFeedbackContext = createContext<SupportFeedbackContextValue | null>(
  null,
);

export function useSupportFeedback(): SupportFeedbackContextValue {
  const ctx = useContext(SupportFeedbackContext);
  if (!ctx) {
    throw new Error("useSupportFeedback must be used within SupportFeedbackProvider");
  }
  return ctx;
}

export function SupportFeedbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openSupportFeedback = useCallback(() => setIsOpen(true), []);
  const closeSupportFeedback = useCallback(() => setIsOpen(false), []);

  return (
    <SupportFeedbackContext.Provider value={{ openSupportFeedback }}>
      {children}
      <SupportFeedbackModal isOpen={isOpen} onClose={closeSupportFeedback} />
    </SupportFeedbackContext.Provider>
  );
}
