import { NextRequest, NextResponse } from "next/server";
import {
  getQuestionImageContentTypeFromKey,
  isSafeQuestionImageStorageKey,
  readQuestionImageBuffer,
} from "@/lib/storage/question-image-storage";

/**
 * Serves a stored question image by storage key (path segments).
 *
 * Access model (step 1): capability URL — the key ends with 128-bit random hex, so the URL
 * is not guessable and is not directory-listable. Anonymous play can use `<img src>` without
 * cookies. Tighten later with signed URLs or quiz-link token checks if needed.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key: segments } = await context.params;
  if (!segments?.length) {
    return new NextResponse(null, { status: 400 });
  }

  const storageKey = segments.join("/");
  if (!isSafeQuestionImageStorageKey(storageKey)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const buffer = await readQuestionImageBuffer(storageKey);
    const contentType = getQuestionImageContentTypeFromKey(storageKey);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return new NextResponse(null, { status: 404 });
    }
    console.error("[question-images] read failed", err);
    return new NextResponse(null, { status: 500 });
  }
}
