"use client";

import { useEffect, useRef, useState } from "react";

import {
  createQuestionTimerDeadline,
  getRemainingSecondsFromDeadline,
  isQuestionTimerExpired,
} from "./quizQuestionTimerDeadline";

export type UseQuizQuestionTimerOptions = {
  // Total budget per question in seconds. <= 0 disables the timer.
  totalSeconds: number;
  // Question whose deadline drives the floating timer (may differ from the viewed question).
  activeTimedQuestionId: string | undefined;
  // When true, the active timed question is locked and the UI countdown is hidden.
  isActiveTimedQuestionLocked: boolean;
  // Locks the question when its deadline passes (including while another question is shown).
  onBackgroundExpire?: (questionId: string) => void;
  // Called when the active timed question hits 0 or is revisited after its deadline.
  onExpire: (questionId: string) => void;
  /**
   * Optional server-provided deadlines (ms since epoch) keyed by questionId.
   * When present for a question, overrides the locally-calculated deadline so
   * the client timer is anchored to the server start time (anti-cheat).
   */
  serverDeadlines?: Record<string, number>;
};

export type UseQuizQuestionTimerResult = {
  timeRemaining: number | null;
  isTimeUp: boolean;
};

type PerQuestionTimerEntry = {
  startedAt: number;
  deadlineAt: number;
  expired: boolean;
};

function ensureQuestionTimerEntry(
  stateByQuestionRef: { current: Record<string, PerQuestionTimerEntry> },
  questionId: string,
  totalSeconds: number,
  now: number,
  serverDeadlineAtMs?: number,
): PerQuestionTimerEntry | null {
  const existing = stateByQuestionRef.current[questionId];
  if (existing) {
    return existing;
  }

  let startedAt: number;
  let deadlineAt: number;

  if (serverDeadlineAtMs != null && serverDeadlineAtMs > 0) {
    // Use server-provided deadline so the client timer matches server reality
    deadlineAt = serverDeadlineAtMs;
    startedAt = deadlineAt - totalSeconds * 1000;
  } else {
    const deadline = createQuestionTimerDeadline(totalSeconds, now);
    if (!deadline) {
      return null;
    }
    startedAt = deadline.startedAt;
    deadlineAt = deadline.deadlineAt;
  }

  const entry: PerQuestionTimerEntry = { startedAt, deadlineAt, expired: false };
  stateByQuestionRef.current[questionId] = entry;
  return entry;
}

// Per-question countdown backed by absolute deadlines. The floating UI follows
// activeTimedQuestionId, which can differ from the question currently on screen.
export function useQuizQuestionTimer({
  totalSeconds,
  activeTimedQuestionId,
  isActiveTimedQuestionLocked,
  onBackgroundExpire,
  onExpire,
  serverDeadlines,
}: UseQuizQuestionTimerOptions): UseQuizQuestionTimerResult {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const stateByQuestionRef = useRef<Record<string, PerQuestionTimerEntry>>({});
  const onExpireRef = useRef(onExpire);
  const onBackgroundExpireRef = useRef(onBackgroundExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    onBackgroundExpireRef.current = onBackgroundExpire;
  }, [onBackgroundExpire]);

  // Background sweep: deadlines keep running even off-screen.
  useEffect(() => {
    if (totalSeconds <= 0) {
      return;
    }

    const sweepExpiredQuestions = () => {
      const now = Date.now();

      for (const [questionId, entry] of Object.entries(stateByQuestionRef.current)) {
        if (entry.expired) {
          continue;
        }

        if (!isQuestionTimerExpired(entry.deadlineAt, now)) {
          continue;
        }

        entry.expired = true;
        onBackgroundExpireRef.current?.(questionId);

        if (questionId === activeTimedQuestionId) {
          setTimeRemaining(0);
          setIsTimeUp(true);
          onExpireRef.current(questionId);
        }
      }
    };

    sweepExpiredQuestions();
    const intervalId = setInterval(sweepExpiredQuestions, 1000);
    return () => clearInterval(intervalId);
  }, [totalSeconds, activeTimedQuestionId]);

  // Active timed question UI tick (derived from deadlineAt, never paused on navigation).
  useEffect(() => {
    if (totalSeconds <= 0 || !activeTimedQuestionId) {
      setTimeRemaining(null);
      setIsTimeUp(false);
      return;
    }

    if (isActiveTimedQuestionLocked) {
      setTimeRemaining(null);
      setIsTimeUp(false);
      return;
    }

    const entry = ensureQuestionTimerEntry(
      stateByQuestionRef,
      activeTimedQuestionId,
      totalSeconds,
      Date.now(),
      serverDeadlines?.[activeTimedQuestionId],
    );
    if (!entry) {
      setTimeRemaining(null);
      setIsTimeUp(false);
      return;
    }

    const now = Date.now();
    if (entry.expired || isQuestionTimerExpired(entry.deadlineAt, now)) {
      entry.expired = true;
      onBackgroundExpireRef.current?.(activeTimedQuestionId);
      setTimeRemaining(0);
      setIsTimeUp(true);
      onExpireRef.current(activeTimedQuestionId);
      return;
    }

    const syncFromDeadline = () => {
      const tickNow = Date.now();

      if (isQuestionTimerExpired(entry.deadlineAt, tickNow)) {
        entry.expired = true;
        setTimeRemaining(0);
        setIsTimeUp(true);
        onExpireRef.current(activeTimedQuestionId);
        return false;
      }

      setTimeRemaining(getRemainingSecondsFromDeadline(entry.deadlineAt, tickNow));
      setIsTimeUp(false);
      return true;
    };

    if (!syncFromDeadline()) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!syncFromDeadline()) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [totalSeconds, activeTimedQuestionId, isActiveTimedQuestionLocked]);

  return { timeRemaining, isTimeUp };
}
