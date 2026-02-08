"use client";

import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  authPanelContainerVariants,
  authPanelItemVariants,
  panelIconFloat,
  panelShapeDrift1,
  panelShapeDrift2,
} from "@/lib/auth-motion-variants";

export function ResetPasswordSidePanel() {
  const { locale } = useLocale();

  return (
    <div className="auth-side-panel-bg relative flex h-full min-h-[280px] flex-col items-center justify-center overflow-hidden px-8 py-14 lg:min-h-0">
      <div className="absolute inset-0 opacity-[0.06]" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="reset-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#reset-dots)" />
        </svg>
      </div>
      <motion.div
        className="absolute top-12 -right-8 h-40 w-40 rounded-full bg-black/15"
        aria-hidden
        animate={panelShapeDrift1}
      />
      <motion.div
        className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/8"
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
            <KeyRound className="h-10 w-10 text-primary-foreground" />
          </motion.div>
        </motion.div>
        <div className="flex flex-col gap-4">
          <motion.h2
            variants={authPanelItemVariants}
            className="font-heading text-3xl font-bold tracking-tight text-primary-foreground text-balance sm:text-4xl"
          >
            {t(locale, "auth.sidePanelReset.title")}
          </motion.h2>
          <motion.p
            variants={authPanelItemVariants}
            className="text-base leading-relaxed text-primary-foreground/90 sm:text-lg"
          >
            {t(locale, "auth.sidePanelReset.description")}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
