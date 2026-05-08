"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Sparkles, Target, Smartphone } from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const steps = [
  { Icon: Target, bg: "bg-primary", shadow: "var(--shadow-raised-primary)" },
  { Icon: Sparkles, bg: "bg-blue", shadow: "var(--shadow-raised-blue)" },
  { Icon: Rocket, bg: "bg-warning", shadow: "var(--shadow-raised-warning)" },
] as const;

export function HowItWorksSection() {
  const { locale } = useLocale();
  const [phoneImageError, setPhoneImageError] = useState(false);

  return (
    <section id="how-it-works" className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.h2 custom={0} variants={fadeUp} className="text-3xl font-black text-foreground md:text-4xl">
            {t(locale, "landing.howItWorks.title")} 👋
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              className="text-center space-y-4"
            >
              <div
                className={`w-16 h-16 rounded-2xl ${step.bg} text-primary-foreground flex items-center justify-center mx-auto`}
                style={{ boxShadow: step.shadow }}
              >
                <step.Icon className="h-8 w-8" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">
                {t(locale, `landing.howItWorks.step${(i + 1) as 1 | 2 | 3}.title`)}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t(locale, `landing.howItWorks.step${(i + 1) as 1 | 2 | 3}.description`)}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          className="flex justify-center mt-12"
        >
          {/* {!phoneImageError ? (
            <Image
              src="/quiz-phone.png"
              alt="Quiz sur mobile"
              width={256}
              height={320}
              className="w-56 md:w-64 h-auto drop-shadow-xl object-contain"
              unoptimized
              onError={() => setPhoneImageError(true)}
            />
          ) : (
            <div className="w-56 md:w-64 h-64 rounded-2xl bg-muted/50 flex items-center justify-center" aria-hidden>
              <Smartphone className="h-10 w-10 text-muted-foreground" />
            </div>
          )} */}
        </motion.div>
      </div>
    </section>
  );
}
