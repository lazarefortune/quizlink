"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Lock } from "lucide-react";
import { ContentDropzone } from "@/components/generate/content-dropzone";
import { GenerationOptionsModal } from "@/components/generate/generation-options-modal";
import { getAiLimits, validateTextLength, validateQuestionCount } from "@/lib/ai/ai-limits";
import { generateQuizAction } from "@/app/generate/actions";
import { createQuizBuilderFromAiQuestions } from "@/lib/ai-quiz-adapter";
import { saveQuiz } from "@/app/builder/actions";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { CoinsRequiredOverlay } from "@/components/coins-required-overlay";
import type { QuizVisibility } from "@/types/quiz-builder";

type GenerationOptions = {
  questionType: string;
  maxQuestions: number;
  language: string;
  visibility: QuizVisibility;
  showAnswerImmediately: boolean;
  randomizeQuestions: boolean;
  timeLimitPerQuestion: number | null;
};

export function GeneratePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<"DOCUMENT" | "TEXT" | "IMAGE" | "VIDEO">("DOCUMENT");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    questionType: "MIXED",
    maxQuestions: 5,
    language: "fr",
    visibility: "PUBLIC",
    showAnswerImmediately: false,
    randomizeQuestions: false,
    timeLimitPerQuestion: null,
  });

  useEffect(() => {
    const limits = getAiLimits();
    setOptions((prev) => ({
      ...prev,
      maxQuestions: Math.min(prev.maxQuestions, limits.maxQuestions),
    }));
  }, []);

  const limits = getAiLimits();
  const disabledOptions: string[] = [];

  const handleGenerate = async () => {
    setError(null);

    if (activeTab === "DOCUMENT") {
      setError(t(locale, "errors.pdfNotSupported"));
      return;
    }

    if (activeTab === "TEXT" && !textContent.trim()) {
      setError(t(locale, "errors.noTextContent"));
      return;
    }

    const textToValidate = textContent.trim();
    const textValidation = validateTextLength(textToValidate, limits);
    if (!textValidation.valid) {
      const errorKey = textToValidate.length < limits.minTextLength
        ? "errors.textTooShort"
        : "errors.textTooLong";
      setError(t(locale, errorKey, {
        min: limits.minTextLength.toString(),
        max: limits.maxTextLength?.toString() || "",
      }));
      return;
    }

    const questionValidation = validateQuestionCount(options.maxQuestions, limits);
    if (!questionValidation.valid) {
      const errorKey = options.maxQuestions < 1
        ? "errors.atLeastOneQuestion"
        : "errors.invalidQuestionCount";
      setError(t(locale, errorKey, {
        max: limits.maxQuestions.toString(),
      }));
      return;
    }

    setIsLoading(true);

    try {
      const result = await generateQuizAction(textToValidate, {
        questionType: options.questionType,
        maxQuestions: options.maxQuestions,
        language: options.language,
      });

      if (!result.success) {
        const errorMessage = result.error.startsWith("errors.")
          ? t(locale, result.error as string, {
              min: limits.minTextLength.toString(),
              max: limits.maxTextLength?.toString() || "",
            })
          : result.error;
        setError(errorMessage);
        return;
      }

      const quizBuilder = createQuizBuilderFromAiQuestions(result.questions, {
        name: result.title || t(locale, "generate.title"),
        visibility: options.visibility,
        settings: {
          showAnswerImmediately: options.showAnswerImmediately,
          randomizeQuestions: options.randomizeQuestions,
          timeLimitPerQuestion: options.timeLimitPerQuestion,
        },
      });

      // Save quiz to database
      const saveResult = await saveQuiz(quizBuilder);

      if (!saveResult.success) {
        setError(saveResult.error || t(locale, "builder.saveError"));
        return;
      }

      // Update session to refresh coin balance in header
      try {
        await updateSession();
        // Small delay to ensure session update completes
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error("Error updating session:", error);
      }

      // Refresh router to get updated data
      router.refresh();

      // Show success message
      showToast(t(locale, "builder.quizCreated"), "success");

      // Redirect to builder to edit the quiz
      if (saveResult.quizId) {
        router.push(`/builder/${saveResult.quizId}`);
      } else {
        router.push("/builder");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(locale, "errors.generationFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type !== "application/pdf") {
      setError(t(locale, "errors.noPdfFile"));
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const hasEnoughCoins = session?.user ? (session.user.coinBalance || 0) >= 2 || session.user.role === "ADMIN" : false;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold">{t(locale, "generate.title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t(locale, "generate.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <GenerationOptionsModal
              options={options}
              onOptionsChange={setOptions}
              disabledOptions={disabledOptions}
              maxQuestionsLimit={limits.maxQuestions}
              locale={locale}
            />
          </div>
        </header>

        {session?.user && !hasEnoughCoins ? (
          <div className="relative">
            <div className="blur-sm pointer-events-none">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as typeof activeTab);
                  setError(null);
                }}
                className="w-full"
              >
                <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <TabsTrigger value="DOCUMENT" className="whitespace-nowrap">
                    {t(locale, "generate.tabs.document")}
                  </TabsTrigger>
                  <TabsTrigger value="TEXT" className="whitespace-nowrap">
                    {t(locale, "generate.tabs.text")}
                  </TabsTrigger>
                  <TabsTrigger value="IMAGE" disabled className="whitespace-nowrap">
                    <Lock className="h-3 w-3 mr-2" />
                    {t(locale, "generate.tabs.image")}
                  </TabsTrigger>
                  <TabsTrigger value="VIDEO" disabled className="whitespace-nowrap">
                    <Lock className="h-3 w-3 mr-2" />
                    {t(locale, "generate.tabs.video")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="DOCUMENT" className="mt-6">
                  <ContentDropzone
                    sourceType="DOCUMENT"
                    textContent=""
                    file={file}
                    onTextChange={() => {}}
                    onFileChange={handleFileChange}
                    error={error}
                    disabled={isLoading}
                    locale={locale}
                  />
                </TabsContent>
                <TabsContent value="TEXT" className="mt-6">
                  <ContentDropzone
                    sourceType="TEXT"
                    textContent={textContent}
                    file={null}
                    onTextChange={setTextContent}
                    onFileChange={() => {}}
                    error={error}
                    disabled={isLoading}
                    locale={locale}
                  />
                </TabsContent>
                <TabsContent value="IMAGE" className="mt-6">
                  <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                    <div className="text-center">
                      <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="font-medium">{t(locale, "generate.uploadComingSoon")}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t(locale, "generate.createAccountToUnlock")}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="VIDEO" className="mt-6">
                  <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                    <div className="text-center">
                      <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="font-medium">{t(locale, "generate.uploadComingSoon")}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t(locale, "generate.createAccountToUnlock")}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex flex-col items-center gap-4 mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={true}
                  className="w-full sm:w-auto"
                >
                  {t(locale, "generate.generateButton")}
                </Button>
                <Link
                  href="/builder"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t(locale, "generate.noContent")}
                </Link>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-[91]">
              <CoinsRequiredOverlay />
            </div>
          </div>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as typeof activeTab);
                setError(null);
              }}
              className="w-full"
            >
              <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <TabsTrigger value="DOCUMENT" className="whitespace-nowrap">
                  {t(locale, "generate.tabs.document")}
                </TabsTrigger>
                <TabsTrigger value="TEXT" className="whitespace-nowrap">
                  {t(locale, "generate.tabs.text")}
                </TabsTrigger>
                <TabsTrigger value="IMAGE" disabled className="whitespace-nowrap">
                  <Lock className="h-3 w-3 mr-2" />
                  {t(locale, "generate.tabs.image")}
                </TabsTrigger>
                <TabsTrigger value="VIDEO" disabled className="whitespace-nowrap">
                  <Lock className="h-3 w-3 mr-2" />
                  {t(locale, "generate.tabs.video")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="DOCUMENT" className="mt-6">
                <ContentDropzone
                  sourceType="DOCUMENT"
                  textContent=""
                  file={file}
                  onTextChange={() => {}}
                  onFileChange={handleFileChange}
                  error={error}
                  disabled={isLoading}
                  locale={locale}
                />
              </TabsContent>

              <TabsContent value="TEXT" className="mt-6">
                <ContentDropzone
                  sourceType="TEXT"
                  textContent={textContent}
                  file={null}
                  onTextChange={(text) => {
                    setTextContent(text);
                    setError(null);
                  }}
                  onFileChange={() => {}}
                  error={error}
                  disabled={isLoading}
                  locale={locale}
                />
                {textContent.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {textContent.length} / {limits.maxTextLength || "∞"} {t(locale, "generate.characterCount")}
                    {textContent.length < limits.minTextLength && (
                      <span className="text-muted-foreground ml-2">
                        ({t(locale, "generate.minimumRequired")} {limits.minTextLength})
                      </span>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="IMAGE" className="mt-6">
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                  <div className="text-center">
                    <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="font-medium">{t(locale, "generate.uploadComingSoon")}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t(locale, "generate.createAccountToUnlock")}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="VIDEO" className="mt-6">
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                  <div className="text-center">
                    <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="font-medium">{t(locale, "generate.uploadComingSoon")}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t(locale, "generate.createAccountToUnlock")}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Coin Cost Info - Only show for authenticated users */}
            {session?.user && session.user.role !== "ADMIN" && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {t(locale, "generate.costInfo", { cost: "2" })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, "generate.currentBalance", {
                        balance: (session.user.coinBalance || 0).toString(),
                      })}
                    </p>
                    {!hasEnoughCoins && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-destructive font-medium mb-2">
                          {t(locale, "generate.notEnoughCoins")}
                        </p>
                        <Link href="/pricing">
                          <Button variant="primary" size="sm">
                            {t(locale, "generate.viewOffers")}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="error">
                <div>
                  <p>{error}</p>
                  {error === t(locale, "errors.insufficientCoins") && (
                    <Link href="/pricing" className="mt-3 inline-block">
                      <Button variant="primary" size="sm">
                        {t(locale, "pricing.title")}
                      </Button>
                    </Link>
                  )}
                </div>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                disabled={
                  isLoading ||
                  (session?.user && (session.user.coinBalance || 0) < 2 && session.user.role !== "ADMIN") ||
                  (activeTab === "DOCUMENT" && !file) ||
                  (activeTab === "TEXT" && !textContent.trim())
                }
                isLoading={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? t(locale, "generate.generating") : t(locale, "generate.generateButton")}
              </Button>

              <Link
                href="/builder"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(locale, "generate.noContent")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
