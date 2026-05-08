"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Brain, Gamepad2, PartyPopper, Star, Target, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics/track";
import { CTA_CLICK } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";

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
  const { data: session } = useSession();

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
          <span className="absolute top-6 left-8 opacity-30 animate-wiggle" aria-hidden>
            <Target className="h-8 w-8 text-primary-foreground" />
          </span>
          <span
            className="absolute bottom-8 right-10 opacity-30 animate-wiggle"
            style={{ animationDelay: "0.5s" }}
            aria-hidden
          >
            <Brain className="h-8 w-8 text-primary-foreground" />
          </span>
          <span className="absolute top-10 right-1/4 opacity-20 animate-float" aria-hidden>
            <Star className="h-7 w-7 text-primary-foreground" />
          </span>
          <span
            className="absolute bottom-10 left-1/4 opacity-20 animate-float"
            style={{ animationDelay: "1s" }}
            aria-hidden
          >
            <PartyPopper className="h-7 w-7 text-primary-foreground" />
          </span>

          <div className="relative z-10">
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl font-black text-primary-foreground mb-4 md:text-4xl">
              <span className="inline-flex items-center gap-2">
                {t(locale, "landing.finalCta.title")}
                <Gamepad2 className="h-8 w-8" />
              </span>
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-primary-foreground/80 mb-8 max-w-md mx-auto text-lg">
              {t(locale, "landing.finalCta.subtitle")}
            </motion.p>
            <motion.div custom={2} variants={fadeUp}>
              <Link
                href="/auth/signup"
                onClick={() =>
                  track(CTA_CLICK, {
                    ...buildCommonEventProps({
                      page: "landing",
                      isLoggedIn: !!session?.user,
                      preferredLanguage: locale,
                    }),
                    cta_type: "register",
                    page: "landing",
                  })
                }
              >
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
