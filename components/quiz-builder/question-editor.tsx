"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import {
  Trash2,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Pen,
  List,
  ListOrdered,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import type { Question, QuestionType, QuestionOption } from "@/types/quiz-builder";
import { cn } from "@/lib/utils";

type QuestionEditorProps = {
  question: Question;
  index: number;
  totalQuestions: number;
  onChange: (question: Question) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  errors?: string[];
};

export function QuestionEditor({
  question,
  index,
  totalQuestions,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  errors = [],
}: QuestionEditorProps) {
  const { locale } = useLocale();
  const [imagePreview, setImagePreview] = useState<string | null>(
    question.image || null
  );
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });
  const editorRef = useRef<HTMLDivElement>(null);

  const updateFormatState = useCallback(() => {
    const sel = document.getSelection();
    const inEditor = editorRef.current && sel?.anchorNode && editorRef.current.contains(sel.anchorNode);
    if (!inEditor) {
      setActiveFormats({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false,
        insertOrderedList: false,
      });
      return;
    }
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.textContent !== question.label) {
      editorRef.current.textContent = question.label;
    }
  }, [question.label]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateFormatState();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [updateFormatState]);

  const handleTypeChange = (newType: QuestionType) => {
    let newOptions = [...question.options];

    if (newType === "TRUE_FALSE") {
      newOptions = [
        { id: `opt-${Date.now()}-1`, label: locale === "fr" ? "Vrai" : "True", isCorrect: false },
        { id: `opt-${Date.now()}-2`, label: locale === "fr" ? "Faux" : "False", isCorrect: false },
      ];
    } else if (newType === "MULTIPLE_CHOICE" && newOptions.length > 0) {
      const firstCorrect = newOptions.findIndex((opt) => opt.isCorrect);
      newOptions = newOptions.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === firstCorrect && firstCorrect >= 0,
      }));
    }

    onChange({
      ...question,
      type: newType,
      options: newOptions,
    });
  };

  const handleLabelChange = () => {
    if (editorRef.current) {
      const newLabel = editorRef.current.textContent || "";
      onChange({
        ...question,
        label: newLabel,
      });
    }
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleLabelChange();
    requestAnimationFrame(updateFormatState);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        onChange({
          ...question,
          image: imageUrl,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    onChange({
      ...question,
      image: undefined,
    });
  };

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      label: "",
      isCorrect: false,
    };
    onChange({
      ...question,
      options: [...question.options, newOption],
    });
  };

  const handleOptionChange = (optionId: string, updates: Partial<QuestionOption>) => {
    const newOptions = question.options.map((opt) =>
      opt.id === optionId ? { ...opt, ...updates } : opt
    );

    if (question.type === "MULTIPLE_CHOICE" && updates.isCorrect) {
      const correctedOptions = newOptions.map((opt) => ({
        ...opt,
        isCorrect: opt.id === optionId,
      }));
      onChange({
        ...question,
        options: correctedOptions,
      });
    } else {
      onChange({
        ...question,
        options: newOptions,
      });
    }
  };

  const handleDeleteOption = (optionId: string) => {
    if (question.options.length <= 2) {
      return;
    }
    onChange({
      ...question,
      options: question.options.filter((opt) => opt.id !== optionId),
    });
  };

  return (
    <Card className="border-2 border-border shadow-sm bg-card">
      <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {errors.length > 0 && (
          <Alert variant="error" title={t(locale, "builder.validationErrors")}>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, idx) => (
                <li key={idx} className="text-xs sm:text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-primary">
            {t(locale, "builder.questionNumber", { number: (index + 1).toString() })}
          </h3>
          <div className="flex gap-2 shrink-0">
            {/*<Button*/}
            {/*  variant="ghost"*/}
            {/*  size="icon"*/}
            {/*  className="h-8 w-8 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-400"*/}
            {/*  title="AI"*/}
            {/*>*/}
            {/*  <Sparkles className="h-4 w-4" />*/}
            {/*</Button>*/}
            <Button
              variant="destructive"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Question Type */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-base font-medium">{t(locale, "builder.questionType")}</label>
          <Select value={question.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="text-sm max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MULTIPLE_CHOICE">{t(locale, "builder.questionTypeMultipleChoice")}</SelectItem>
              <SelectItem value="CHECKBOX">{t(locale, "builder.questionTypeCheckbox")}</SelectItem>
              <SelectItem value="TRUE_FALSE">{t(locale, "builder.questionTypeTrueFalse")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question with formatting toolbar */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-base font-medium">{t(locale, "builder.questionLabel")}</label>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 space-y-2 min-w-0">
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 border rounded-md bg-muted/30 overflow-x-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                  onClick={() => handleFormat("undo")}
                  type="button"
                >
                  <Undo2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                  onClick={() => handleFormat("redo")}
                  type="button"
                >
                  <Redo2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <div className="h-4 w-px bg-border mx-0.5 sm:mx-1 shrink-0" />
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 shrink-0",
                    activeFormats.bold && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleFormat("bold")}
                  type="button"
                >
                  <Bold className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 shrink-0",
                    activeFormats.italic && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleFormat("italic")}
                  type="button"
                >
                  <Italic className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 shrink-0",
                    activeFormats.underline && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleFormat("underline")}
                  type="button"
                >
                  <Underline className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 shrink-0",
                    activeFormats.strikeThrough && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleFormat("strikeThrough")}
                  type="button"
                >
                  <Strikethrough className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <div className="h-4 w-px bg-border mx-0.5 sm:mx-1 shrink-0" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                  onClick={() => {
                    editorRef.current?.focus();
                    document.execCommand("formatBlock", false, "code");
                    handleLabelChange();
                    requestAnimationFrame(updateFormatState);
                  }}
                  type="button"
                >
                  <Code className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 shrink-0",
                    (activeFormats.bold || activeFormats.italic || activeFormats.underline ||
                     activeFormats.strikeThrough || activeFormats.insertUnorderedList ||
                     activeFormats.insertOrderedList) && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => {
                    handleFormat("removeFormat");
                  }}
                  type="button"
                >
                  <Pen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <div className="h-4 w-px bg-border mx-0.5 sm:mx-1 shrink-0" />
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 shrink-0",
                    activeFormats.insertUnorderedList && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => {
                    editorRef.current?.focus();
                    document.execCommand("insertUnorderedList", false);
                    handleLabelChange();
                    requestAnimationFrame(updateFormatState);
                  }}
                  type="button"
                >
                  <List className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 shrink-0",
                    activeFormats.insertOrderedList && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => {
                    editorRef.current?.focus();
                    document.execCommand("insertOrderedList", false);
                    handleLabelChange();
                    requestAnimationFrame(updateFormatState);
                  }}
                  type="button"
                >
                  <ListOrdered className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              </div>
              {/* Question Editor (contentEditable) */}
              <div className="relative">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleLabelChange}
                  onBlur={handleLabelChange}
                  onFocus={updateFormatState}
                  onKeyUp={updateFormatState}
                  onMouseUp={updateFormatState}
                  className="min-h-[100px] sm:min-h-[120px] w-full rounded-md border-2 border-input bg-background px-3 py-2 text-base outline-none transition-colors focus:!border-primary focus-visible:!border-primary resize-none overflow-y-auto"
                  style={{ whiteSpace: "pre-wrap" }}
                  suppressContentEditableWarning
                />
                {!question.label && (
                  <div className="absolute top-2 left-3 text-base text-muted-foreground pointer-events-none select-none">
                    {t(locale, "builder.questionLabelPlaceholder")}
                  </div>
                )}
              </div>
            </div>
            {/* Image Placeholder */}
            <div className="w-full sm:w-32 md:w-40 shrink-0">
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Question preview"
                    className="w-full h-24 sm:h-32 md:h-40 object-cover rounded-md border"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="w-full text-xs"
                  >
                    {t(locale, "builder.removeImage")}
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 sm:h-32 md:h-40 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-1 sm:mb-2" />
                  <span className="text-xs text-muted-foreground text-center px-2">
                    {locale === "fr" ? "Image" : "Image"}
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2 sm:space-y-3">
          <label className="text-base font-medium">{t(locale, "builder.answerOptions")}</label>
          <div className="space-y-2">
            {question.options.map((option, optIndex) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-pointer",
                  option.isCorrect && "border-primary bg-primary/5"
                )}
                onClick={() => {
                  if (question.type === "TRUE_FALSE") {
                    const newOptions = question.options.map((opt) => ({
                      ...opt,
                      isCorrect: opt.id === option.id,
                    }));
                    onChange({
                      ...question,
                      options: newOptions,
                    });
                  } else if (question.type === "MULTIPLE_CHOICE") {
                    handleOptionChange(option.id, { isCorrect: !option.isCorrect });
                  } else {
                    handleOptionChange(option.id, { isCorrect: !option.isCorrect });
                  }
                }}
              >
                <input
                  type={question.type === "CHECKBOX" ? "checkbox" : "radio"}
                  checked={option.isCorrect}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (question.type === "TRUE_FALSE") {
                      const newOptions = question.options.map((opt) => ({
                        ...opt,
                        isCorrect: opt.id === option.id,
                      }));
                      onChange({
                        ...question,
                        options: newOptions,
                      });
                    } else {
                      handleOptionChange(option.id, { isCorrect: e.target.checked });
                    }
                  }}
                  className="h-4 w-4 shrink-0 cursor-pointer"
                />
                <Input
                  value={option.label}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleOptionChange(option.id, { label: e.target.value });
                  }}
                  placeholder={t(locale, "builder.answerOptionPlaceholder", {
                    number: (optIndex + 1).toString(),
                  })}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto min-w-0"
                />
                {question.options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOption(option.id);
                    }}
                    className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-white hover:bg-destructive"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {question.type !== "TRUE_FALSE" && (
            <button
              onClick={handleAddOption}
              className="text-base text-primary hover:cursor-pointer hover:underline font-medium"
            >
              {t(locale, "builder.addOption")}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
