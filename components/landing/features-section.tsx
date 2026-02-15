"use client";

import { motion } from "framer-motion";
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

const featureKeys = [
  { key: "manual" as const, emoji: "✏️", color: "bg-primary", shadow: "var(--shadow-raised-primary)" },
  { key: "ai" as const, emoji: "🤖", color: "bg-highlight", shadow: "var(--shadow-raised-highlight)" },
  { key: "shareable" as const, emoji: "🔗", color: "bg-blue", shadow: "var(--shadow-raised-blue)" },
  { key: "participants" as const, emoji: "👥", color: "bg-warning", shadow: "var(--shadow-raised-warning)" },
  { key: "statistics" as const, emoji: "📊", color: "bg-purple", shadow: "var(--shadow-raised-purple)" },
  { key: "fun" as const, emoji: "🎮", color: "bg-primary", shadow: "var(--shadow-raised-primary)" },
] as const;

export function FeaturesSection() {
  const { locale } = useLocale();

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14"
        >
          <motion.h2 custom={0} variants={fadeUp} className="text-3xl font-black text-foreground md:text-4xl">
            {t(locale, "landing.features.title")} 💚
          </motion.h2>
          <motion.p custom={1} variants={fadeUp} className="text-muted-foreground mt-3 text-lg">
            {t(locale, "landing.features.subtitle")}
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureKeys.map((f, i) => (
            <motion.div
              key={f.key}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              className="rounded-2xl border-2 border-border bg-card p-6 card-playful cursor-default"
            >
              <div
                className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 text-2xl`}
                style={{ boxShadow: f.shadow }}
              >
                {f.emoji}
              </div>
              <h3 className="font-extrabold text-lg text-foreground mb-2">
                {t(locale, `landing.features.${f.key}.title`)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(locale, `landing.features.${f.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
