"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

type ContentDropzoneProps = {
  sourceType: "DOCUMENT" | "TEXT";
  textContent: string;
  file: File | null;
  onTextChange: (text: string) => void;
  onFileChange: (file: File | null) => void;
  error: string | null;
  disabled?: boolean;
  locale: Locale;
};

export function ContentDropzone({
  sourceType,
  textContent,
  file,
  onTextChange,
  onFileChange,
  error,
  disabled = false,
  locale,
}: ContentDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    if (sourceType === "DOCUMENT") {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type === "application/pdf") {
        onFileChange(droppedFile);
      }
    } else {
      const text = e.dataTransfer.getData("text/plain");
      if (text) {
        onTextChange(text);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        return;
      }
      onFileChange(selectedFile);
    }
  };

  const handleClick = () => {
    if (sourceType === "DOCUMENT") {
      fileInputRef.current?.click();
    } else {
      textareaRef.current?.focus();
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" title={t(locale, "common.error")}>
          {error}
        </Alert>
      )}

      {sourceType === "DOCUMENT" ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />

          {file ? (
            <div className="flex flex-col items-center gap-4 p-8">
              <FileText className="h-12 w-12 text-primary" />
              <div className="text-center">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(locale, "generate.costInfo", { cost: "2" })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                {t(locale, "generate.remove")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {t(locale, "generate.dropPdf")}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t(locale, "generate.pdfFilesOnly")}
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-yellow-600 dark:text-yellow-400">
                  {t(locale, "generate.pdfScannedWarning")}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-input"
          } ${disabled ? "opacity-50" : ""}`}
        >
          <Textarea
            ref={textareaRef}
            value={textContent}
            onChange={(e) => onTextChange(e.target.value)}
            rows={12}
            disabled={disabled}
            placeholder={t(locale, "generate.pasteOrWriteText")}
            className="border-0 resize-none focus-visible:ring-0"
          />
        </div>
      )}
    </div>
  );
}
