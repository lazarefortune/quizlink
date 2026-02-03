import { getOpenAIClient } from "./openai-client";
import { participantReportOutputSchema } from "./participant-report-schema";
import type { ParticipantReportOutput } from "./participant-report-schema";
import type { ParticipantReportPayload } from "@/lib/analytics/quiz-participant-aggregator";

const SYSTEM_PROMPT = `Tu es un analyste pédagogique. Tu reçois des données agrégées et anonymisées sur les résultats d'un participant à un quiz (pas les réponses correctes complètes, seulement des statistiques et libellés courts).
Ta tâche : produire un rapport d'analyse en JSON strict, en français.

Structure OBLIGATOIRE de l'objet racine (utilise exactement ces clés en anglais) :
- summary: { overallLevel: "beginner"|"intermediate"|"advanced", oneSentence: string, keyNumbers: string[] }
- strengths: array de { title, evidence, metric }
- weaknesses: array de { title, evidence, metric }
- recurringMistakes: array de { pattern, whyLikely, howToFix }
- mostImportantQuestionsToReview: array de { question, whyMissed, whatToRemember }
- studyPlan7Days: array de { day: 1..7, focus: string, tasks: string[] }
- tips: string[]
- warnings: string[]

Règles : cite les chiffres du payload dans evidence/metric, reste actionnable et bienveillant.
Retourne UNIQUEMENT cet objet JSON à la racine, sans wrapper, sans markdown, sans commentaire.`;

export async function generateParticipantReportFromPayload(
  payload: ParticipantReportPayload
): Promise<ParticipantReportOutput> {
  const client = getOpenAIClient();
  const userContent = JSON.stringify(payload, null, 2);

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 4096,
  });

  let raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response from OpenAI");
  }

  raw = raw.trim();
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    raw = codeBlockMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON from OpenAI");
  }

  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
    parsed = parsed[0];
  }

  const normalized = normalizeReportResponse(parsed);
  const result = participantReportOutputSchema.safeParse(normalized);
  if (!result.success) {
    throw new Error(`Report schema validation failed: ${result.error.message}`);
  }

  return result.data;
}

const KEY_ALIASES: Record<string, string> = {
  résumé: "summary",
  resume: "summary",
  forces: "strengths",
  faiblesses: "weaknesses",
  erreursRecurrentes: "recurringMistakes",
  questionsARevoir: "mostImportantQuestionsToReview",
  planEtude: "studyPlan7Days",
  planEtude7Jours: "studyPlan7Days",
  conseils: "tips",
  avertissements: "warnings",
};

/**
 * Extract report object from API response. OpenAI sometimes wraps in a key,
 * returns nested structure, or uses French keys. Normalize to expected schema.
 * Exported for tests.
 */
export function normalizeReportResponse(parsed: unknown): unknown {
  if (parsed === null || typeof parsed !== "object") {
    return parsed;
  }
  const obj = parsed as Record<string, unknown>;

  const toNormalized = (o: Record<string, unknown>) => {
    const get = (en: string, fr?: string) => {
      const v = o[en] ?? (fr ? o[fr] : undefined);
      return v;
    };
    const summary = get("summary", "résumé") ?? get("summary", "resume");
    const hasSummary = summary && typeof summary === "object" && summary !== null;
    return {
      summary: hasSummary ? summary : { overallLevel: "intermediate", oneSentence: "", keyNumbers: [] },
      strengths: Array.isArray(get("strengths", "forces")) ? get("strengths", "forces") : [],
      weaknesses: Array.isArray(get("weaknesses", "faiblesses")) ? get("weaknesses", "faiblesses") : [],
      recurringMistakes: Array.isArray(get("recurringMistakes", "erreursRecurrentes"))
        ? get("recurringMistakes", "erreursRecurrentes")
        : [],
      mostImportantQuestionsToReview: Array.isArray(
        get("mostImportantQuestionsToReview", "questionsARevoir")
      )
        ? get("mostImportantQuestionsToReview", "questionsARevoir")
        : [],
      studyPlan7Days: Array.isArray(get("studyPlan7Days", "planEtude7Jours") ?? get("studyPlan7Days", "planEtude"))
        ? (get("studyPlan7Days", "planEtude7Jours") ?? get("studyPlan7Days", "planEtude"))
        : [],
      tips: Array.isArray(get("tips", "conseils")) ? get("tips", "conseils") : [],
      warnings: Array.isArray(get("warnings", "avertissements")) ? get("warnings", "avertissements") : [],
    };
  };

  if (typeof obj.summary === "object" && obj.summary !== null) {
    return toNormalized(obj);
  }

  const aliased = { ...obj };
  for (const [fr, en] of Object.entries(KEY_ALIASES)) {
    if (aliased[en] === undefined && aliased[fr] !== undefined) {
      aliased[en] = aliased[fr];
    }
  }
  if (typeof aliased.summary === "object" && aliased.summary !== null) {
    return toNormalized(aliased);
  }

  const candidates = [obj.report, obj.data, obj.result, obj.analysis];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      const inner = candidate as Record<string, unknown>;
      if (typeof (inner.summary ?? inner.résumé) === "object") {
        return toNormalized(inner);
      }
    }
  }

  return toNormalized(obj);
}
