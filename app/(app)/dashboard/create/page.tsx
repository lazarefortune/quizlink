"use client";

import Link from "next/link";
import { Sparkles, PenLine } from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardCreatePage() {
  const { locale } = useLocale();
  const isFrench = locale === "fr";

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {isFrench ? "Créer un quiz" : "Create a quiz"}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {isFrench
              ? "Choisis comment tu veux créer ton quiz."
              : "Choose how you want to create your quiz."}
          </p>
          <p className="text-sm text-muted-foreground">
            {isFrench
              ? "Utilise tes coins pour générer avec l'IA."
              : "Use your coins to generate with AI."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card variant="playful" className="border-2">
            <CardContent className="space-y-4 p-5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue/10 text-blue">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  {isFrench ? "Créer avec l'IA" : "Create with AI"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isFrench
                    ? "Colle un texte ou donne un sujet, QuizLink génère les questions."
                    : "Paste text or give a topic, QuizLink generates the questions."}
                </p>
              </div>
              <Button variant="blue" asChild className="w-full">
                <Link href="/generate">{isFrench ? "Continuer" : "Continue"}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="playful" className="border-2">
            <CardContent className="space-y-4 p-5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PenLine className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  {isFrench ? "Créer manuellement" : "Create manually"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isFrench
                    ? "Ajoute tes questions une par une."
                    : "Add your questions one by one."}
                </p>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link href="/builder">{isFrench ? "Continuer" : "Continue"}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
