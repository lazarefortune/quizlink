"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/feedback-modal";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("feedback:open", handleOpen);
    return () => window.removeEventListener("feedback:open", handleOpen);
  }, []);

  // Only show feedback button for authenticated users
  if (!session?.user) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Envoyer un feedback"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
