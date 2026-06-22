"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QuizLinkLogo } from "@/components/QuizLinkLogo";
import { Card, CardContent, type CardProps } from "@/components/ui/card";
import { AUTH_FORM_PAGE_MIN_HEIGHT_CLASS } from "@/lib/layout/public-chrome";
import { cn } from "@/lib/utils";
import {
  authFormContainerVariants,
  authFormItemVariants,
} from "@/lib/auth-motion-variants";

type AuthFormPageProps = {
  children: React.ReactNode;
  sidePanel?: React.ReactNode;
};

export function AuthFormPage({ children, sidePanel }: AuthFormPageProps) {
  return (
    <div
      className={cn(
        AUTH_FORM_PAGE_MIN_HEIGHT_CLASS,
        "overflow-x-hidden",
      )}
    >
      {children}
      {sidePanel ? (
        <div className="hidden w-full lg:flex lg:w-1/2 lg:min-h-full lg:self-stretch lg:flex-col">
          <div className="h-full min-h-full flex-1">{sidePanel}</div>
        </div>
      ) : null}
    </div>
  );
}

export function AuthFormColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-1 flex-col items-start justify-center px-5 py-6 sm:px-6 sm:py-8 lg:w-1/2 lg:min-h-full lg:items-center lg:justify-center lg:px-16 lg:py-12 xl:px-24">
      <motion.div
        className="mx-auto w-full min-w-0 max-w-none sm:max-w-md"
        variants={authFormContainerVariants}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>
    </div>
  );
}

type AuthFormCardProps = {
  children: React.ReactNode;
  variant?: CardProps["variant"];
  className?: string;
};

export function AuthFormCard({
  children,
  variant = "default",
  className,
}: AuthFormCardProps) {
  return (
    <Card
      variant={variant}
      className={cn(
        "w-full min-w-0 rounded-none border-none bg-transparent shadow-none",
        "sm:rounded-3xl sm:border sm:border-border sm:bg-card sm:text-card-foreground sm:shadow-sm",
        className,
      )}
    >
      {children}
    </Card>
  );
}

export function AuthFormCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardContent className={cn("min-w-0 p-0 pt-0 sm:p-6 sm:pt-6", className)}>
      {children}
    </CardContent>
  );
}

type AuthFormLogoProps = {
  locale: string;
  size?: "default" | "compact";
};

export function AuthFormLogo({ locale, size = "default" }: AuthFormLogoProps) {
  return (
    <motion.div
      variants={authFormItemVariants}
      className={cn(
        "mb-4 flex justify-center sm:mb-6",
        size !== "compact" && "lg:mb-8",
      )}
    >
      <Link
        href="/"
        className="inline-flex rounded-xl transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
        aria-label={locale === "fr" ? "Retour à l'accueil" : "Back to home"}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        >
          <QuizLinkLogo
            size={size === "compact" ? "authCompact" : "auth"}
            priority
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

type AuthFormHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  align?: "left" | "center-mobile";
};

export function AuthFormHeader({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
  align = "left",
}: AuthFormHeaderProps) {
  return (
    <motion.div
      variants={authFormItemVariants}
      className={cn(
        "mb-5 flex min-w-0 flex-col gap-1.5 sm:mb-6 sm:gap-2 lg:mb-8",
        align === "center-mobile" && "text-center sm:text-left",
        className,
      )}
    >
      <h1
        className={cn(
          "font-heading text-2xl tracking-tight text-foreground text-balance sm:text-3xl",
          titleClassName,
        )}
      >
        {title}
      </h1>
      {description ? (
        <div
          className={cn(
            "text-sm leading-relaxed text-muted-foreground break-words sm:text-base",
            descriptionClassName,
          )}
        >
          {description}
        </div>
      ) : null}
    </motion.div>
  );
}

export function AuthFormDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-2 flex items-center gap-3 sm:my-0 sm:mb-4">
      <div className="h-px min-w-0 flex-1 bg-border" />
      {children}
      <div className="h-px min-w-0 flex-1 bg-border" />
    </div>
  );
}

export function AuthFormFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.p
      variants={authFormItemVariants}
      className={cn(
        "mt-6 min-w-0 text-center text-sm text-muted-foreground break-words sm:mt-8 sm:text-base",
        className,
      )}
    >
      {children}
    </motion.p>
  );
}

export { authFormItemVariants };
