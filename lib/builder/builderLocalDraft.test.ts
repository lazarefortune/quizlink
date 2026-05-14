import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { QuizBuilder } from "@/types/quiz-builder";

import {
  BUILDER_DRAFT_INDEX_FORMAT_VERSION,
  BUILDER_LOCAL_DRAFT_FORMAT_VERSION,
  buildBuilderDraftIndexKey,
  buildBuilderDraftKey,
  buildBuilderDraftTargetRoute,
  createBuilderLocalDraftPayload,
  getBuilderDraftStorageScope,
  normalizeAndPruneBuilderDraftIndexEntries,
  parseBuilderDraftIndexJson,
  parseBuilderLocalDraftJson,
  saveBuilderDraft,
  shouldOfferBuilderLocalDraftRestore,
} from "./builderLocalDraft";
import { computeQuizBuilderSnapshot } from "./quizBuilderSnapshot";

const minimalQuiz: QuizBuilder = {
  id: "quiz-1",
  name: "N",
  visibility: "PRIVATE",
  settings: {
    showAnswerImmediately: true,
    randomizeQuestions: false,
    timeLimitPerQuestion: null,
  },
  questions: [
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      label: "L",
      options: [
        { id: "o1", label: "A", isCorrect: true },
        { id: "o2", label: "B", isCorrect: false },
      ],
    },
  ],
  createdBy: "USER",
  createdAt: new Date().toISOString(),
};

const timeLimitUi = { enabled: false, inputValue: "" };

describe("buildBuilderDraftKey", () => {
  it("embeds user id and new scope", () => {
    expect(buildBuilderDraftKey("user-1", "new")).toBe(
      `quizsnap:builder-draft:v${BUILDER_LOCAL_DRAFT_FORMAT_VERSION}:user-1:new`,
    );
  });

  it("embeds quiz id for existing quizzes", () => {
    expect(buildBuilderDraftKey("user-1", "clabc123")).toBe(
      `quizsnap:builder-draft:v${BUILDER_LOCAL_DRAFT_FORMAT_VERSION}:user-1:clabc123`,
    );
  });
});

describe("getBuilderDraftStorageScope", () => {
  it("prefers url quiz id over saved id", () => {
    expect(
      getBuilderDraftStorageScope({ urlQuizId: "cl-url", savedQuizId: "cl-saved" }),
    ).toBe("cl-url");
  });

  it("falls back to saved id", () => {
    expect(getBuilderDraftStorageScope({ urlQuizId: null, savedQuizId: "cl-saved" })).toBe(
      "cl-saved",
    );
  });

  it("uses new when neither is set", () => {
    expect(getBuilderDraftStorageScope({ urlQuizId: null, savedQuizId: null })).toBe("new");
  });
});

describe("parseBuilderLocalDraftJson", () => {
  it("parses a valid payload", () => {
    const payload = createBuilderLocalDraftPayload({
      quiz: minimalQuiz,
      timeLimitUi,
      sourceRoute: "/builder",
    });
    const parsed = parseBuilderLocalDraftJson(JSON.stringify(payload));
    expect(parsed).not.toBeNull();
    expect(parsed?.quiz.name).toBe("N");
    expect(parsed?.formatVersion).toBe(BUILDER_LOCAL_DRAFT_FORMAT_VERSION);
  });

  it("returns null for invalid json", () => {
    expect(parseBuilderLocalDraftJson("not-json")).toBeNull();
  });

  it("returns null when time limit ui is wrong shape", () => {
    const bad = {
      formatVersion: BUILDER_LOCAL_DRAFT_FORMAT_VERSION,
      savedAt: new Date().toISOString(),
      sourceRoute: "/builder",
      quiz: minimalQuiz,
      timeLimitUi: { wrong: true },
    };
    expect(parseBuilderLocalDraftJson(JSON.stringify(bad))).toBeNull();
  });
});

describe("shouldOfferBuilderLocalDraftRestore", () => {
  it("returns false when draft matches hydrated baseline snapshot", () => {
    const draft = createBuilderLocalDraftPayload({
      quiz: minimalQuiz,
      timeLimitUi,
      sourceRoute: "/builder",
    });
    const baseline = computeQuizBuilderSnapshot(minimalQuiz, timeLimitUi);
    expect(shouldOfferBuilderLocalDraftRestore(draft, baseline)).toBe(false);
  });

  it("returns true when draft differs from baseline", () => {
    const draft = createBuilderLocalDraftPayload({
      quiz: { ...minimalQuiz, name: "Changed" },
      timeLimitUi,
      sourceRoute: "/builder",
    });
    const baseline = computeQuizBuilderSnapshot(minimalQuiz, timeLimitUi);
    expect(shouldOfferBuilderLocalDraftRestore(draft, baseline)).toBe(true);
  });
});

describe("buildBuilderDraftIndexKey", () => {
  it("uses index prefix and user id", () => {
    expect(buildBuilderDraftIndexKey("u-99")).toBe(
      `quizsnap:builder-draft-index:v${BUILDER_DRAFT_INDEX_FORMAT_VERSION}:u-99`,
    );
  });
});

describe("buildBuilderDraftTargetRoute", () => {
  it("maps new scope to /builder", () => {
    expect(buildBuilderDraftTargetRoute("new")).toBe("/builder");
  });

  it("maps quiz id to /builder/{id}", () => {
    expect(buildBuilderDraftTargetRoute("clxyz")).toBe("/builder/clxyz");
  });
});

describe("normalizeAndPruneBuilderDraftIndexEntries", () => {
  const exists = () => true;

  it("drops entries whose draft key is missing", () => {
    const entries = [
      {
        scope: "new",
        draftKey: "k1",
        quizId: null,
        quizName: "A",
        questionCount: 1,
        savedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        targetRoute: "/builder",
      },
      {
        scope: "cl2",
        draftKey: "k2",
        quizId: "cl2",
        quizName: "B",
        questionCount: 2,
        savedAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        targetRoute: "/builder/cl2",
      },
    ];
    const out = normalizeAndPruneBuilderDraftIndexEntries(entries, (k) => k === "k1");
    expect(out).toHaveLength(1);
    expect(out[0]?.scope).toBe("new");
  });

  it("keeps latest savedAt per scope", () => {
    const entries = [
      {
        scope: "new",
        draftKey: "a",
        quizId: null,
        quizName: "Old",
        questionCount: 0,
        savedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        targetRoute: "/builder",
      },
      {
        scope: "new",
        draftKey: "b",
        quizId: null,
        quizName: "New",
        questionCount: 1,
        savedAt: "2026-01-03T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
        targetRoute: "/builder",
      },
    ];
    const out = normalizeAndPruneBuilderDraftIndexEntries(entries, exists);
    expect(out).toHaveLength(1);
    expect(out[0]?.quizName).toBe("New");
    expect(out[0]?.draftKey).toBe("b");
  });

  it("sorts by savedAt descending", () => {
    const entries = [
      {
        scope: "a",
        draftKey: "ka",
        quizId: "a",
        quizName: "A",
        questionCount: 1,
        savedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        targetRoute: "/builder/a",
      },
      {
        scope: "b",
        draftKey: "kb",
        quizId: "b",
        quizName: "B",
        questionCount: 1,
        savedAt: "2026-01-05T00:00:00.000Z",
        updatedAt: "2026-01-05T00:00:00.000Z",
        targetRoute: "/builder/b",
      },
    ];
    const out = normalizeAndPruneBuilderDraftIndexEntries(entries, exists);
    expect(out[0]?.scope).toBe("b");
    expect(out[1]?.scope).toBe("a");
  });
});

describe("parseBuilderDraftIndexJson", () => {
  it("parses a valid index file", () => {
    const raw = JSON.stringify({
      formatVersion: BUILDER_DRAFT_INDEX_FORMAT_VERSION,
      entries: [
        {
          scope: "new",
          draftKey: "k",
          quizId: null,
          quizName: "Q",
          questionCount: 2,
          savedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          targetRoute: "/builder",
        },
      ],
    });
    const parsed = parseBuilderDraftIndexJson(raw);
    expect(parsed?.entries).toHaveLength(1);
    expect(parsed?.entries[0]?.questionCount).toBe(2);
  });

  it("returns null for invalid format version", () => {
    expect(parseBuilderDraftIndexJson(JSON.stringify({ formatVersion: 99, entries: [] }))).toBeNull();
  });
});

describe("saveBuilderDraft", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    } as unknown as Window & typeof globalThis);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists payload to localStorage", () => {
    const key = buildBuilderDraftKey("u1", "new");
    const payload = createBuilderLocalDraftPayload({
      quiz: minimalQuiz,
      timeLimitUi,
      sourceRoute: "/builder",
    });
    expect(saveBuilderDraft(key, payload)).toEqual({ ok: true });
    expect(window.localStorage.getItem(key)).toContain("N");
  });

  it("persists index when indexMeta is provided", () => {
    const key = buildBuilderDraftKey("u1", "new");
    const payload = createBuilderLocalDraftPayload({
      quiz: minimalQuiz,
      timeLimitUi,
      sourceRoute: "/builder",
    });
    expect(saveBuilderDraft(key, payload, { userId: "u1", scope: "new" })).toEqual({ ok: true });
    const indexRaw = window.localStorage.getItem(buildBuilderDraftIndexKey("u1"));
    expect(indexRaw).toBeTruthy();
    const parsed = parseBuilderDraftIndexJson(indexRaw as string);
    expect(parsed?.entries.some((e) => e.scope === "new")).toBe(true);
  });
});
