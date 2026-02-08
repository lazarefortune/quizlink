"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, Share2, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  authPanelItemVariants,
  authPanelSignupContainerVariants,
  panelIconFloat,
  panelShapeDrift1,
  panelShapeDrift2,
  panelShapeRotate,
} from "@/lib/auth-motion-variants";

function FeatureItem({
  icon: Icon,
  titleKey,
  descriptionKey,
}: {
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
}) {
  const { locale } = useLocale();
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-primary-foreground">{t(locale, titleKey)}</p>
        <p className="text-sm leading-relaxed text-primary-foreground/90">
          {t(locale, descriptionKey)}
        </p>
      </div>
    </div>
  );
}

export function SignupSidePanel() {
  const { locale } = useLocale();

  return (
    <div className="auth-side-panel-bg relative flex h-full min-h-[280px] flex-col items-center justify-center overflow-hidden px-8 py-14 lg:min-h-0">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.06]" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="signup-dots"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#signup-dots)" />
        </svg>
      </div>

      {/* Decorative shapes — boucles infinies */}
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
      <div
        className="absolute bottom-1/3 right-8 h-14 w-14 rounded-xl bg-white/5"
        style={{ rotate: -12 }}
        aria-hidden
      >
        <motion.div
          className="h-full w-full rounded-xl bg-white/5"
          animate={panelShapeRotate}
        />
      </div>

      <motion.div
        className="relative z-10 flex max-w-md flex-col items-start gap-10"
        variants={authPanelSignupContainerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="flex flex-col gap-4">
          <motion.div variants={authPanelItemVariants}>
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm"
              animate={panelIconFloat}
            >
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </motion.div>
          </motion.div>
          <motion.h2
            variants={authPanelItemVariants}
            className="font-heading text-3xl font-bold tracking-tight text-primary-foreground text-balance sm:text-4xl"
          >
            {t(locale, "auth.sidePanel.signup.title")}
          </motion.h2>
          <motion.p
            variants={authPanelItemVariants}
            className="text-base leading-relaxed text-primary-foreground/90 sm:text-lg"
          >
            {t(locale, "auth.sidePanel.signup.description")}
          </motion.p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <motion.div variants={authPanelItemVariants}>
            <FeatureItem
              icon={Target}
              titleKey="auth.sidePanel.signup.feature1Title"
              descriptionKey="auth.sidePanel.signup.feature1Desc"
            />
          </motion.div>
          <motion.div variants={authPanelItemVariants}>
            <FeatureItem
              icon={Share2}
              titleKey="auth.sidePanel.signup.feature2Title"
              descriptionKey="auth.sidePanel.signup.feature2Desc"
            />
          </motion.div>
          <motion.div variants={authPanelItemVariants}>
            <FeatureItem
              icon={CheckCircle2}
              titleKey="auth.sidePanel.signup.feature3Title"
              descriptionKey="auth.sidePanel.signup.feature3Desc"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
