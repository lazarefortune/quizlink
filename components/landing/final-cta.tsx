"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function FinalCTA() {
  const { locale } = useLocale();

  return (
    <section className="py-16 px-4 sm:py-20 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-4xl">
        <AnimateOnScroll>
          <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl sm:text-4xl md:text-5xl">
              {t(locale, "landing.finalCta.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-lg text-muted-foreground sm:text-xl">
              {t(locale, "landing.finalCta.subtitle")}
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/builder/preview">
              <Button
                variant="primary"
                size="lg"
                className="group h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {t(locale, "landing.finalCta.button")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
