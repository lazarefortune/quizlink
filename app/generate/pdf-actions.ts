"use server";

import { extractTextFromPdf, validatePdfFileType } from "@/lib/pdf/pdf-text-extractor";
import { auth } from "@/lib/auth";
import { generateQuizAction } from "./actions";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

type PdfUploadResult =
  | { success: true; text: string }
  | { success: false; error: string };

/**
 * Server Action: Upload and extract text from PDF
 *
 * SECURITY RULES:
 * - Only authenticated users can upload
 * - Validate file type server-side
 * - Validate file size server-side
 * - Extract text server-side only
 * - Never send PDF binary to client or OpenAI
 */
export async function uploadPdfAndExtractText(
  formData: FormData
): Promise<PdfUploadResult> {
  try {
    // Step 1: Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "errors.unauthorized",
      };
    }

    // Step 2: Get file from form data
    const file = formData.get("pdf") as File | null;
    if (!file) {
      return {
        success: false,
        error: "errors.noFile",
      };
    }

    // Step 3: Validate file type (client-side check, but verify server-side)
    if (file.type !== "application/pdf") {
      return {
        success: false,
        error: "errors.invalidFileType",
      };
    }

    // Step 4: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "errors.pdfTooLarge",
      };
    }

    // Step 5: Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 6: Validate PDF file type from buffer (security check)
    if (!validatePdfFileType(buffer)) {
      return {
        success: false,
        error: "errors.invalidFileType",
      };
    }

    // Step 7: Extract text from PDF
    const extractionResult = await extractTextFromPdf(buffer);

    if (!extractionResult.success) {
      return {
        success: false,
        error: extractionResult.error,
      };
    }

    // Step 8: Return extracted text
    return {
      success: true,
      text: extractionResult.text,
    };
  } catch (error) {
    console.error("[uploadPdfAndExtractText] Error:", error);
    return {
      success: false,
      error: "errors.pdfExtractionFailed",
    };
  }
}

/**
 * Server Action: Generate quiz from PDF
 *
 * This combines PDF upload, extraction, and AI generation in one flow.
 * Coins are handled by generateQuizAction.
 */
export async function generateQuizFromPdf(
  formData: FormData,
  options: {
    questionType: string;
    maxQuestions: number;
    language: string;
  }
): Promise<
  | { success: true; title: string; questions: any[] }
  | { success: false; error: string }
> {
  // Step 1: Extract text from PDF
  const extractionResult = await uploadPdfAndExtractText(formData);

  if (!extractionResult.success) {
    return {
      success: false,
      error: extractionResult.error,
    };
  }

  // Step 2: Generate quiz using existing AI generation logic
  // This will handle coin deduction automatically
  return await generateQuizAction(extractionResult.text, options);
}
