import { PDFParse } from "pdf-parse";

/**
 * PDF validation and extraction constants
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PAGES = 20;
const MIN_TEXT_LENGTH = 100; // Minimum characters after extraction
const MAX_TEXT_LENGTH = 500000; // Maximum characters (safety limit)

/**
 * Result of PDF text extraction
 */
export type PdfExtractionResult =
  | { success: true; text: string; pageCount: number }
  | { success: false; error: string };

/**
 * Extract text from PDF buffer
 *
 * SECURITY RULES:
 * - Never extract text client-side
 * - Validate file size and page count server-side
 * - Reject scanned PDFs (no extractable text)
 * - Trim and normalize extracted text
 *
 * @param pdfBuffer - PDF file as Buffer
 * @returns Extracted text or error
 */
export async function extractTextFromPdf(
  pdfBuffer: Buffer
): Promise<PdfExtractionResult> {
  try {
    // Step 1: Validate file size
    if (pdfBuffer.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "errors.pdfTooLarge",
      };
    }

    // Step 2: Parse PDF using PDFParse
    let parser: PDFParse | null = null;
    try {
      parser = new PDFParse({ data: pdfBuffer });
      const pdfData = await parser.getText();
      const pdfInfo = await parser.getInfo();

      // Step 3: Validate page count
      const pageCount = pdfInfo?.pages || 0;
      if (pageCount > MAX_PAGES) {
        await parser.destroy();
        return {
          success: false,
          error: "errors.pdfTooManyPages",
        };
      }

      // Step 4: Extract and normalize text
      let extractedText = pdfData?.text || "";

      // Trim whitespace and normalize
      extractedText = extractedText
        .replace(/\s+/g, " ") // Replace multiple whitespace with single space
        .trim();

      // Step 5: Validate extracted text length
      if (extractedText.length < MIN_TEXT_LENGTH) {
        // Likely a scanned PDF or image-based PDF
        await parser.destroy();
        return {
          success: false,
          error: "errors.pdfNoText",
        };
      }

      if (extractedText.length > MAX_TEXT_LENGTH) {
        // Truncate to max length (keep first part)
        const originalLength = extractedText.length;
        extractedText = extractedText.substring(0, MAX_TEXT_LENGTH);
        console.warn(
          `[extractTextFromPdf] Extracted text truncated from ${originalLength} to ${MAX_TEXT_LENGTH} characters`
        );
      }

      // Clean up parser
      await parser.destroy();

      return {
        success: true,
        text: extractedText,
        pageCount,
      };
    } catch (parseError) {
      // Clean up parser if it was created
      if (parser) {
        try {
          await parser.destroy();
        } catch {
          // Ignore cleanup errors
        }
      }
      console.error("[extractTextFromPdf] PDF parse error:", parseError);
      return {
        success: false,
        error: "errors.pdfInvalid",
      };
    }
  } catch (error) {
    console.error("[extractTextFromPdf] Unexpected error:", error);
    return {
      success: false,
      error: "errors.pdfExtractionFailed",
    };
  }
}

/**
 * Validate PDF file type from buffer
 * Checks PDF magic bytes: %PDF-
 *
 * @param buffer - File buffer
 * @returns true if valid PDF
 */
export function validatePdfFileType(buffer: Buffer): boolean {
  // Check PDF magic bytes
  const pdfMagicBytes = Buffer.from("%PDF-");
  const fileStart = buffer.slice(0, 5);

  return fileStart.equals(pdfMagicBytes);
}
