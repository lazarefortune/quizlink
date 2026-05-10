"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

type AnonymousQuizFinishingScreenProps = {
  stage: "scoring" | "preparing";
  reducedMotion: boolean;
};

export function AnonymousQuizFinishingScreen({
  stage,
  reducedMotion,
}: AnonymousQuizFinishingScreenProps) {
  const { locale } = useLocale();
  const stageText =
    stage === "scoring"
      ? t(locale, "quiz.calculatingScore")
      : t(locale, "quiz.preparingCorrections");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.24 }}
        className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-xl"
      >
        <motion.div
          animate={
            reducedMotion
              ? { rotate: 0 }
              : { rotate: [0, -8, 8, -8, 0], scale: [1, 1.06, 1] }
          }
          transition={{
            duration: reducedMotion ? 0 : 1.2,
            repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue/10 text-blue"
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>

        <p className="text-lg font-semibold">{stageText}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t(locale, "quiz.pleaseWait")}</p>
      </motion.div>
    </div>
  );
}
