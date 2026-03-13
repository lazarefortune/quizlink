"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Bird, ArrowRight, Sparkles, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics/track";
import { LANDING_VIEW, CTA_CLICK } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function HeroSection() {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const [mascotError, setMascotError] = useState(false);

  useEffect(() => {
    track(LANDING_VIEW, {
      ...buildCommonEventProps({
        page: "landing",
        isLoggedIn: !!session?.user,
        preferredLanguage: locale,
      }),
      page: "landing",
    });
  }, [session?.user, locale]);

  return (
    <section className="relative overflow-hidden pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-36 md:pb-20">
      {/* Floating shapes */}
      <div className="absolute top-20 left-10 h-20 w-20 rounded-full bg-warning/20 animate-float z-0" aria-hidden />
      <div className="absolute top-40 right-16 h-14 w-14 rounded-2xl bg-blue/20 animate-float z-0" style={{ animationDelay: "1s" }} aria-hidden />
      <div className="absolute bottom-20 left-1/4 h-10 w-10 rounded-full bg-primary/15 animate-float z-0" style={{ animationDelay: "2s" }} aria-hidden />
      <div className="absolute top-32 right-1/3 h-6 w-6 rounded-lg bg-highlight/20 animate-float z-0" style={{ animationDelay: "0.5s" }} aria-hidden />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-6 text-center lg:text-left"
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold card-playful"
            >
              <Sparkles className="h-4 w-4 text-warning" />
              <span>{t(locale, "landing.hero.badge")} ✨</span>
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="text-4xl font-black leading-tight text-foreground md:text-5xl lg:text-6xl"
            >
              {t(locale, "landing.hero.titleBefore1")}
              <span className="text-primary">{t(locale, "landing.hero.titleHighlight1")}</span>
              {t(locale, "landing.hero.titleMid")}
              <span className="text-blue">{t(locale, "landing.hero.titleHighlight2")}</span>
              {t(locale, "landing.hero.titleAfter")}
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {t(locale, "landing.hero.subtitle")}
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href="/builder/preview"
                onClick={() =>
                  track(CTA_CLICK, {
                    ...buildCommonEventProps({
                      page: "landing",
                      isLoggedIn: !!session?.user,
                      preferredLanguage: locale,
                    }),
                    cta_type: "create_quiz",
                    page: "landing",
                  })
                }
              >
                <Button variant="hero" size="xl" className="text-lg w-full sm:w-auto">
                  <Zap className="h-5 w-5" />
                  {t(locale, "landing.hero.createButton")}
                </Button>
              </Link>
              <Link href="/quizzes">
                <Button variant="outline" size="xl" className="text-lg normal-case tracking-normal w-full sm:w-auto">
                  {t(locale, "landing.hero.exploreButton")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div custom={4} variants={fadeUp} className="flex items-center gap-2 justify-center lg:justify-start pt-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>
              <span className="text-sm font-bold text-muted-foreground">
                {t(locale, "landing.hero.lovedBy")} <span className="text-foreground">{t(locale, "landing.hero.lovedByCount")}</span> {t(locale, "landing.hero.lovedBySuffix")}
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-72 md:w-96 aspect-square flex items-center justify-center">
              {!mascotError ? (
                <Image
                  src="/mascot.jpg"
                  alt="QuizLink mascotte"
                  width={384}
                  height={384}
                  className="w-full h-full object-contain animate-float drop-shadow-2xl"
                  unoptimized
                  onError={() => setMascotError(true)}
                />
              ) : (
                <div
                  className="w-full h-full rounded-3xl bg-primary/10 flex items-center justify-center animate-float"
                  aria-hidden
                >
                  <Bird className="h-24 w-24 text-primary" />
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                className="absolute -top-2 -right-2 md:top-4 md:right-4 bg-warning text-warning-foreground rounded-2xl px-4 py-2 font-extrabold text-sm rotate-6"
                style={{ boxShadow: "0 3px 0 hsl(38 95% 40%)" }}
              >
                {t(locale, "landing.hero.mascotBadge1")}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
                className="absolute -bottom-2 -left-2 md:bottom-8 md:left-4 bg-blue text-blue-foreground rounded-2xl px-4 py-2 font-extrabold text-sm -rotate-3"
                style={{ boxShadow: "0 3px 0 hsl(199 90% 40%)" }}
              >
                {t(locale, "landing.hero.mascotBadge2")}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
