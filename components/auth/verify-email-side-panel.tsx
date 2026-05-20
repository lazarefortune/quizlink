"use client";

import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  authPanelContainerVariants,
  authPanelItemVariants,
  panelIconFloat,
  panelShapeDrift1,
  panelShapeDrift2,
} from "@/lib/auth-motion-variants";

export function VerifyEmailSidePanel() {
  const { locale } = useLocale();

  return (
    <div className="auth-side-panel-bg relative flex h-full min-h-[280px] flex-col items-center justify-center overflow-hidden px-8 py-14 lg:min-h-0">
      <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="verify-email-diag"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="2" height="20" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#verify-email-diag)" />
        </svg>
      </div>
      <motion.div
        className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10"
        aria-hidden
        animate={panelShapeDrift1}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10"
        aria-hidden
        animate={panelShapeDrift2}
      />

      <motion.div
        className="relative z-10 flex max-w-md flex-col items-center gap-10 text-center"
        variants={authPanelContainerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={authPanelItemVariants}>
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm"
            animate={panelIconFloat}
          >
            <MailCheck className="h-10 w-10 text-primary-foreground" />
          </motion.div>
        </motion.div>
        <div className="flex flex-col gap-4">
          <motion.h2
            variants={authPanelItemVariants}
            className="font-heading text-3xl font-bold tracking-tight text-primary-foreground text-balance sm:text-4xl"
          >
            {t(locale, "auth.sidePanelVerifyEmail.title")}
          </motion.h2>
          <motion.p
            variants={authPanelItemVariants}
            className="text-base leading-relaxed text-primary-foreground/90 sm:text-lg"
          >
            {t(locale, "auth.sidePanelVerifyEmail.description")}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
