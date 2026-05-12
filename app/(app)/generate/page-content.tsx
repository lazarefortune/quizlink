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
import { Zap } from "lucide-react";
import { ContentDropzone } from "@/components/generate/content-dropzone";
import { GenerationOptionsModal } from "@/components/generate/generation-options-modal";
import { getAiLimits, validateTextLength, validateQuestionCount } from "@/lib/ai/ai-limits";
import { generateQuizAction } from "@/app/(app)/generate/actions";
import { generateQuizFromPdf } from "@/app/(app)/generate/pdf-actions";
import { createQuizBuilderFromAiQuestions } from "@/lib/ai-quiz-adapter";
import { saveQuiz } from "@/app/(app)/builder/actions";
import { track } from "@/lib/analytics/track";
import { AI_GENERATION_USED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { Alert } from "@/components/ui/alert";
import { CoinsRequiredOverlay } from "@/components/coins-required-overlay";
import type { Question } from "@/types/quiz-builder";
import { buildQuizSuccessPath } from "@/lib/quiz-success";
import { isSaveQuizPayloadTooLargeError } from "@/lib/builder/isSaveQuizPayloadTooLargeError";

type GenerationOptions = {
  questionType: string;
  maxQuestions: number;
  language: string;
  showAnswerImmediately: boolean;
  randomizeQuestions: boolean;
  timeLimitPerQuestion: number | null;
};

export function GeneratePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<"TEXT" | "DOCUMENT">("TEXT");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    questionType: "MIXED",
    maxQuestions: 5,
    language: "fr",
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

    // Handle PDF generation
    if (activeTab === "DOCUMENT") {
      if (!file) {
        setError(t(locale, "errors.noFile"));
        return;
      }

      if (file.type !== "application/pdf") {
        setError(t(locale, "errors.invalidFileType"));
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
        // Create FormData for PDF upload
        const formData = new FormData();
        formData.append("pdf", file);

        const result = await generateQuizFromPdf(formData, {
          questionType: options.questionType,
          maxQuestions: options.maxQuestions,
          language: options.language,
        });

        if (!result.success) {
          const errorMessage = result.error.startsWith("errors.")
            ? t(locale, result.error as string)
            : result.error;
          setError(errorMessage);
          return;
        }

        const quizBuilder = createQuizBuilderFromAiQuestions(result.questions as Question[], {
          name: result.title || t(locale, "generate.title"),
          visibility: "PRIVATE",
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
        // Force session update to get latest coin balance from database
        try {
          console.log("[GeneratePage] Updating session after quiz generation...");
          // Call updateSession with empty object to trigger JWT callback refresh
          await updateSession({});
          // Wait a bit for session to propagate
          await new Promise((resolve) => setTimeout(resolve, 500));
          // Trigger custom event to force header update
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("session:update"));
          }
        } catch (error) {
          console.error("Error updating session:", error);
        }

        // Force router refresh to get new session data
        router.refresh();

        // Show success message
        showToast(t(locale, "builder.quizCreated"), "success");

        track(AI_GENERATION_USED, {
          ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
          generation_type: "pdf",
          question_count: quizBuilder.questions.length,
          coins_spent: 2,
          language: locale === "fr" || locale === "en" ? locale : "fr",
          quiz_id: saveResult.quizId ?? undefined,
        });

        // Small delay before redirecting to ensure session is updated
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Redirect to success page after creation
        if (saveResult.quizId) {
          window.location.href = buildQuizSuccessPath(saveResult.quizId);
        } else {
          window.location.href = "/builder";
        }
      } catch (err) {
        if (isSaveQuizPayloadTooLargeError(err)) {
          setError(t(locale, "builder.saveErrorPayloadTooLarge"));
        } else {
          setError(
            err instanceof Error
              ? err.message
              : t(locale, "errors.generationFailed")
          );
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle text generation (existing logic)
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

      const quizBuilder = createQuizBuilderFromAiQuestions(result.questions as Question[], {
        name: result.title || t(locale, "generate.title"),
        visibility: "PRIVATE",
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
      // Force session update to get latest coin balance from database
      try {
        console.log("[GeneratePage] Updating session after quiz generation (text)...");
        // Call updateSession with empty object to trigger JWT callback refresh
        await updateSession({});
        // Wait a bit for session to propagate
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Trigger custom event to force header update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("session:update"));
        }
      } catch (error) {
        console.error("Error updating session:", error);
      }

      // Force router refresh to get new session data
      router.refresh();

      // Show success message
      showToast(t(locale, "builder.quizCreated"), "success");

      track(AI_GENERATION_USED, {
        ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
        generation_type: "text",
        question_count: quizBuilder.questions.length,
        coins_spent: 2,
        text_length: textContent.trim().length,
        language: locale === "fr" || locale === "en" ? locale : "fr",
        quiz_id: saveResult.quizId ?? undefined,
      });

      // Small delay before redirecting to ensure session is updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to success page after creation
      if (saveResult.quizId) {
        window.location.href = buildQuizSuccessPath(saveResult.quizId);
      } else {
        window.location.href = "/builder";
      }
    } catch (err) {
      if (isSaveQuizPayloadTooLargeError(err)) {
        setError(t(locale, "builder.saveErrorPayloadTooLarge"));
      } else {
        setError(
          err instanceof Error
            ? err.message
            : t(locale, "errors.generationFailed")
        );
      }
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
            <h1 className="text-2xl sm:text-4xl font-bold">
              {t(locale, "generate.title")}
            </h1>
            <p className="text-base text-muted-foreground">
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
                <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <TabsTrigger value="TEXT" className="whitespace-nowrap">
                    {t(locale, "generate.tabs.text")}
                  </TabsTrigger>
                  <TabsTrigger value="DOCUMENT" className="whitespace-nowrap">
                    {t(locale, "generate.tabs.document")}
                  </TabsTrigger>
                </TabsList>
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
              </Tabs>
              <div className="flex flex-col items-center gap-4 mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={true}
                  className="w-full sm:w-auto"
                >
                  <Zap className="h-4 w-4" />
                  {t(locale, "generate.generateButton")}
                </Button>
                <p className="text-base text-muted-foreground text-center">
                  {t(locale, "generate.noContent")}
                </p>
                <Link
                  href="/builder"
                  className="text-base text-primary hover:underline transition-colors"
                >
                  {t(locale, "generate.noContentDescription")}
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
              <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <TabsTrigger
                  value="TEXT"
                  className="whitespace-nowrap font-fredoka text-base font-black"
                >
                  {t(locale, "generate.tabs.text")}
                </TabsTrigger>
                <TabsTrigger
                  value="DOCUMENT"
                  className="whitespace-nowrap font-fredoka text-base font-black"
                >
                  {t(locale, "generate.tabs.document")}
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
                    {textContent.length} / {limits.maxTextLength || "∞"}{" "}
                    {t(locale, "generate.characterCount")}
                    {textContent.length < limits.minTextLength && (
                      <span className="text-muted-foreground ml-2">
                        ({t(locale, "generate.minimumRequired")}{" "}
                        {limits.minTextLength})
                      </span>
                    )}
                  </div>
                )}
              </TabsContent>

            </Tabs>

            {error && (
              <Alert variant="error">
                <div>
                  <p>{error}</p>
                  {error === t(locale, "errors.insufficientCoins") && (
                    <Link href="/account/coins" className="mt-3 inline-block">
                      <Button variant="primary" size="sm">
                        {t(locale, "pricing.title")}
                      </Button>
                    </Link>
                  )}
                </div>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={
                    isLoading ||
                    (session?.user &&
                      (session.user.coinBalance || 0) < 2 &&
                      session.user.role !== "ADMIN") ||
                    (activeTab === "DOCUMENT" && !file) ||
                    (activeTab === "TEXT" && !textContent.trim())
                  }
                  isLoading={isLoading}
                  className="w-full sm:w-auto rounded-xl font-bold"
                >
                  <Zap className="h-4 w-4" />
                  {isLoading
                    ? t(locale, "generate.generating")
                    : t(locale, "generate.generateButton")} {" "} ( {t(locale, "generate.costPerGeneration")} )
                </Button>
              </div>
              {session?.user && session.user.role !== "ADMIN" && (
                <p className="text-sm text-muted-foreground text-center">
                  {hasEnoughCoins ? (
                    t(locale, "generate.yourBalance", {
                      balance: (session.user.coinBalance || 0).toString(),
                    })
                  ) : (
                    <>
                      {t(locale, "generate.notEnoughCoins")}
                      {" · "}
                      <Link
                        href="/account/coins"
                        className="font-semibold text-primary hover:underline"
                      >
                        {t(locale, "generate.viewOffers")}
                      </Link>
                    </>
                  )}
                </p>
              )}
              <p className="text-base text-muted-foreground text-center">
                {t(locale, "generate.noContent")}{" "}
                <Link
                  href="/builder"
                  className="text-base text-primary hover:underline transition-colors"
                >
                  {t(locale, "generate.noContentDescription")}
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
