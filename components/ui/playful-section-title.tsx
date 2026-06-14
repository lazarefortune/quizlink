"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type PlayfulSectionTitleProps = {
  children: React.ReactNode;
  as?: "h2" | "h3";
  className?: string;
  id?: string;
};

export function PlayfulSectionTitle({
  children,
  as: Tag = "h2",
  className,
  id,
}: PlayfulSectionTitleProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[Tag];

  return (
    <MotionTag
      id={id}
      initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}
