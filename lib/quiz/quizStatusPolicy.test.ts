import { describe, expect, it } from "vitest";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

import {
  canQuizBeMadePublic,
  canQuizBePlayed,
  canQuizBeShared,
  canQuizShowResponseInsights,
} from "./quizStatusPolicy";

describe("quizStatusPolicy", () => {
  it.each<[QuizLifecycleStatus, boolean]>([
    ["DRAFT", false],
    ["ACTIVE", true],
    ["ARCHIVED", false],
  ])("canQuizBePlayed(%s) => %s", (status, expected) => {
    expect(canQuizBePlayed(status)).toBe(expected);
  });

  it.each<[QuizLifecycleStatus, boolean]>([
    ["DRAFT", false],
    ["ACTIVE", true],
    ["ARCHIVED", false],
  ])("canQuizBeShared(%s) => %s", (status, expected) => {
    expect(canQuizBeShared(status)).toBe(expected);
  });

  it.each<[QuizLifecycleStatus, boolean]>([
    ["DRAFT", false],
    ["ACTIVE", true],
    ["ARCHIVED", false],
  ])("canQuizBeMadePublic(%s) => %s", (status, expected) => {
    expect(canQuizBeMadePublic(status)).toBe(expected);
  });

  it.each<[QuizLifecycleStatus, boolean]>([
    ["DRAFT", false],
    ["ACTIVE", true],
    ["ARCHIVED", false],
  ])("canQuizShowResponseInsights(%s) => %s", (status, expected) => {
    expect(canQuizShowResponseInsights(status)).toBe(expected);
  });
});
