"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

type InfoTooltipProps = {
  content: string;
  className?: string;
};

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  }, [isVisible]);

  const tooltipContent = isVisible && typeof window !== "undefined" ? (
    createPortal(
      <div
        ref={tooltipRef}
        className="fixed z-[9999] w-64 p-2 text-xs text-popover-foreground bg-popover border rounded-md shadow-lg pointer-events-none"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: "translateX(-50%)",
        }}
      >
        {content}
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "ml-2 inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label={content}
      >
        <Info className="h-4 w-4" />
      </button>
      {tooltipContent}
    </>
  );
}
