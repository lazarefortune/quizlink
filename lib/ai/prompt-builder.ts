type PromptOptions = {
  content: string;
  questionType: string;
  maxQuestions: number;
  language: string;
};

export function buildQuizGenerationPrompt(
  options: PromptOptions
): string {
  const isFrench = options.language === "fr";

  const questionTypeInstructions =
    options.questionType === "MIXED"
      ? isFrench
        ? "Mélangez des questions à choix multiples (QCM) et des questions vrai/faux."
        : "Mix multiple choice questions (MCQ) and true/false questions."
      : options.questionType === "MCQ"
        ? isFrench
          ? "Générez uniquement des questions à choix multiples (QCM)."
          : "Generate only multiple choice questions (MCQ)."
        : isFrench
          ? "Générez uniquement des questions vrai/faux."
          : "Generate only true/false questions.";

  const prompt = isFrench
    ? `Tu es un assistant de génération de quiz. Génère un quiz à partir du contenu suivant.

CONTENU:
${options.content}

EXIGENCES:
- Génère un titre de quiz court et descriptif (3-8 mots maximum, sans préfixe comme "Générer un Quiz" ou "Quiz sur")
- Le titre doit refléter le sujet principal du contenu
- Génère exactement ${options.maxQuestions} questions
- ${questionTypeInstructions}
- Pour les questions QCM, fournis exactement 4 options avec une seule bonne réponse
- Pour les questions VRAI_FAUX, fournis exactement 2 options: "Vrai" et "Faux"
- Les questions doivent être pertinentes par rapport au contenu
- Les questions doivent tester la compréhension, pas seulement la mémorisation
- Langue: français

FORMAT DE SORTIE (JSON uniquement, aucune explication):
{
  "title": "Titre du quiz (court, descriptif, 3-8 mots maximum, sans préfixe)",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE",
      "label": "Texte de la question ici",
      "options": [
        {"label": "Option 1", "isCorrect": true},
        {"label": "Option 2", "isCorrect": false},
        {"label": "Option 3", "isCorrect": false},
        {"label": "Option 4", "isCorrect": false}
      ]
    }
  ]
}

IMPORTANT - CRITIQUE:
- Retourne UNIQUEMENT du JSON valide
- N'inclus aucune explication ou texte en dehors du JSON
- TU DOIS générer EXACTEMENT ${options.maxQuestions} questions - C'EST OBLIGATOIRE
- Ne t'arrête pas avant d'avoir généré les ${options.maxQuestions} questions complètes
- Pour MULTIPLE_CHOICE: exactement 4 options, exactement 1 correcte
- Pour TRUE_FALSE: exactement 2 options, exactement 1 correcte
- Le tableau "questions" doit contenir EXACTEMENT ${options.maxQuestions} éléments`
    : `You are a quiz generation assistant. Generate a quiz from the following content.

CONTENT:
${options.content}

REQUIREMENTS:
- Generate a short, descriptive quiz title (3-8 words maximum, no prefix like "Generate a Quiz" or "Quiz about")
- The title should reflect the main subject of the content
- Generate exactly ${options.maxQuestions} questions
- ${questionTypeInstructions}
- For MCQ questions, provide exactly 4 options with only 1 correct answer
- For TRUE_FALSE questions, provide exactly 2 options: "True" and "False"
- Questions must be relevant to the content
- Questions must test understanding, not just recall
- Language: ${options.language}

OUTPUT FORMAT (JSON only, no explanations):
{
  "title": "Quiz title (short, descriptive, 3-8 words maximum, no prefix)",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE",
      "label": "Question text here",
      "options": [
        {"label": "Option 1", "isCorrect": true},
        {"label": "Option 2", "isCorrect": false},
        {"label": "Option 3", "isCorrect": false},
        {"label": "Option 4", "isCorrect": false}
      ]
    }
  ]
}

IMPORTANT - CRITICAL:
- Return ONLY valid JSON
- Do not include any explanations or text outside the JSON
- YOU MUST generate EXACTLY ${options.maxQuestions} questions - THIS IS MANDATORY
- Do not stop before generating all ${options.maxQuestions} complete questions
- For MULTIPLE_CHOICE: exactly 4 options, exactly 1 correct
- For TRUE_FALSE: exactly 2 options, exactly 1 correct
- The "questions" array must contain EXACTLY ${options.maxQuestions} items`;

  return prompt;
}
