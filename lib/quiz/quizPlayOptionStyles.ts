export type QuizPlayOptionVisualState = {
  borderColor: string;
  letterBgColor: string;
  letterTextColor: string;
};

export function getQuizPlayOptionVisualState({
  showCorrection,
  selected,
  correct,
  incorrect,
}: {
  showCorrection: boolean;
  selected: boolean;
  correct: boolean;
  incorrect: boolean;
}): QuizPlayOptionVisualState {
  if (showCorrection) {
    if (correct) {
      return {
        borderColor: "#22c55e",
        letterBgColor: "bg-green-500",
        letterTextColor: "text-white",
      };
    }
    if (incorrect) {
      return {
        borderColor: "#ef4444",
        letterBgColor: "bg-red-500",
        letterTextColor: "text-white",
      };
    }
    return {
      borderColor: "",
      letterBgColor: "bg-muted",
      letterTextColor: "text-muted-foreground",
    };
  }

  if (selected) {
    return {
      borderColor: "hsl(var(--blue))",
      letterBgColor: "bg-blue",
      letterTextColor: "text-blue-foreground",
    };
  }

  return {
    borderColor: "",
    letterBgColor: "bg-muted",
    letterTextColor: "text-muted-foreground",
  };
}
