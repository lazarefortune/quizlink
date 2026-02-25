"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics/track";
import { CTA_CLICK } from "@/lib/analytics/events";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function FinalCTA() {
  const { locale } = useLocale();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="rounded-3xl bg-primary p-10 text-center relative overflow-hidden md:p-16"
          style={{ boxShadow: "0 6px 0 hsl(var(--primary-shadow))" }}
        >
          <span className="absolute top-6 left-8 text-4xl opacity-30 animate-wiggle" aria-hidden>🎯</span>
          <span className="absolute bottom-8 right-10 text-4xl opacity-30 animate-wiggle" style={{ animationDelay: "0.5s" }} aria-hidden>🧠</span>
          <span className="absolute top-10 right-1/4 text-3xl opacity-20 animate-float" aria-hidden>⭐</span>
          <span className="absolute bottom-10 left-1/4 text-3xl opacity-20 animate-float" style={{ animationDelay: "1s" }} aria-hidden>🎉</span>

          <div className="relative z-10">
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl font-black text-primary-foreground mb-4 md:text-4xl">
              {t(locale, "landing.finalCta.title")} 🎮
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-primary-foreground/80 mb-8 max-w-md mx-auto text-lg">
              {t(locale, "landing.finalCta.subtitle")}
            </motion.p>
            <motion.div custom={2} variants={fadeUp}>
              <Link href="/builder/preview" onClick={() => track(CTA_CLICK, { cta: "create_quiz" })}>
                <Button
                  variant="outline"
                  size="xl"
                  className="bg-card text-foreground border-none text-lg normal-case tracking-normal font-extrabold"
                >
                  <Zap className="h-5 w-5" />
                  {t(locale, "landing.finalCta.button")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
