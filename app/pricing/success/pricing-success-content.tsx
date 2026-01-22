"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function PricingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const { data: session, update: updateSession } = useSession();
  const [isVerifying, setIsVerifying] = useState(true);
  const sessionId = searchParams.get("session_id");
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    // Wait a bit for webhook to process, then refresh session
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerifying(false);
        hasProcessed.current = true;
        return;
      }

      hasProcessed.current = true;

      // Wait 3 seconds for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Refresh session to get updated coin balance
      if (updateSession) {
        await updateSession({});
      }

      // Dispatch session update event
      window.dispatchEvent(new Event("session:update"));

      setIsVerifying(false);

      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    };

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Only depend on sessionId, not updateSession

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {isVerifying ? (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>{t(locale, "pricing.verifying")}</CardTitle>
              <CardDescription>{t(locale, "pricing.verifyingDescription")}</CardDescription>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
              <CardTitle>{t(locale, "pricing.paymentSuccess")}</CardTitle>
              <CardDescription>{t(locale, "pricing.paymentSuccessDescription")}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!isVerifying && (
            <>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t(locale, "pricing.coinsCredited")}
                </p>
                {session?.user && (
                  <p className="text-lg font-semibold">
                    {t(locale, "pricing.newBalance")}: {session.user.coinBalance} {t(locale, "pricing.coins")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/generate">
                  <Button variant="primary" className="w-full">
                    {t(locale, "pricing.startGenerating")}
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="secondary" className="w-full">
                    {t(locale, "pricing.backToPricing")}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
