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

  const typeConstraint =
    options.questionType === "MCQ"
      ? isFrench
        ? "CONTRAINTE OBLIGATOIRE: Chaque question DOIT avoir \"type\": \"MULTIPLE_CHOICE\" avec exactement 4 options. INTERDIT: ne génère AUCUNE question vrai/faux (TRUE_FALSE)."
        : "MANDATORY CONSTRAINT: Every question MUST have \"type\": \"MULTIPLE_CHOICE\" with exactly 4 options. FORBIDDEN: do NOT generate any true/false (TRUE_FALSE) question."
      : options.questionType === "TRUE_FALSE"
        ? isFrench
          ? "CONTRAINTE OBLIGATOIRE: Chaque question DOIT avoir \"type\": \"TRUE_FALSE\" avec exactement 2 options (Vrai/Faux). INTERDIT: ne génère AUCUNE question à choix multiples (MULTIPLE_CHOICE)."
          : "MANDATORY CONSTRAINT: Every question MUST have \"type\": \"TRUE_FALSE\" with exactly 2 options (True/False). FORBIDDEN: do NOT generate any multiple choice (MULTIPLE_CHOICE) question."
        : "";

  const prompt = isFrench
    ? `Tu es un assistant de génération de quiz. Génère un quiz à partir du contenu suivant.

CONTENU:
${options.content}

EXIGENCES:
- Génère un titre de quiz court et descriptif (3-8 mots maximum, sans préfixe comme "Générer un Quiz" ou "Quiz sur")
- Le titre doit refléter le sujet principal du contenu
- Génère exactement ${options.maxQuestions} questions
- ${questionTypeInstructions}
${typeConstraint ? `- ${typeConstraint}\n` : ""}- Pour les questions QCM, fournis exactement 4 options avec une seule bonne réponse
- Pour les questions VRAI_FAUX, fournis exactement 2 options: "Vrai" et "Faux"
- Les questions doivent être pertinentes par rapport au contenu
- Les questions doivent tester la compréhension, pas seulement la mémorisation
- Langue: français
- OBLIGATOIRE: Chaque question doit avoir un champ "explanation" (1-2 phrases) expliquant la bonne réponse, affiché si le participant se trompe

FORMAT DE SORTIE (JSON uniquement, aucune explication):
{
  "title": "Titre du quiz (court, descriptif, 3-8 mots maximum, sans préfixe)",
  "questions": [
    {
      "type": ${options.questionType === "MCQ" ? '"MULTIPLE_CHOICE"' : options.questionType === "TRUE_FALSE" ? '"TRUE_FALSE"' : '"MULTIPLE_CHOICE" | "TRUE_FALSE"'},
      "label": "Texte de la question ici",
      "explanation": "1 à 2 phrases expliquant pourquoi la bonne réponse est correcte (OBLIGATOIRE pour chaque question)",
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
- Chaque question DOIT contenir le champ "explanation" avec une courte explication pédagogique (obligatoire)
- Ne t'arrête pas avant d'avoir généré les ${options.maxQuestions} questions complètes
- Pour MULTIPLE_CHOICE: exactement 4 options, exactement 1 correcte
- Pour TRUE_FALSE: exactement 2 options, exactement 1 correcte
- Le tableau "questions" doit contenir EXACTEMENT ${options.maxQuestions} éléments
${options.questionType === "MCQ" ? "- TOUTES les questions doivent être de type MULTIPLE_CHOICE. Aucune question TRUE_FALSE." : options.questionType === "TRUE_FALSE" ? "- TOUTES les questions doivent être de type TRUE_FALSE. Aucune question MULTIPLE_CHOICE." : ""}

EXEMPLE d'une question (à reproduire pour chaque question, avec ton contenu et une vraie "explanation"):
${options.questionType === "TRUE_FALSE" ? '{"type":"TRUE_FALSE","label":"La capitale de la France est Paris.","explanation":"Paris est bien la capitale de la France.","options":[{"label":"Vrai","isCorrect":true},{"label":"Faux","isCorrect":false}]}' : '{"type":"MULTIPLE_CHOICE","label":"Quelle est la capitale de la France?","explanation":"Paris est la capitale et la plus grande ville de France.","options":[{"label":"Lyon","isCorrect":false},{"label":"Paris","isCorrect":true},{"label":"Marseille","isCorrect":false},{"label":"Bordeaux","isCorrect":false}]}'}`
    : `You are a quiz generation assistant. Generate a quiz from the following content.

CONTENT:
${options.content}

REQUIREMENTS:
- Generate a short, descriptive quiz title (3-8 words maximum, no prefix like "Generate a Quiz" or "Quiz about")
- The title should reflect the main subject of the content
- Generate exactly ${options.maxQuestions} questions
- ${questionTypeInstructions}
${typeConstraint ? `- ${typeConstraint}\n` : ""}- For MCQ questions, provide exactly 4 options with only 1 correct answer
- For TRUE_FALSE questions, provide exactly 2 options: "True" and "False"
- Questions must be relevant to the content
- Questions must test understanding, not just recall
- Language: ${options.language}
- MANDATORY: Each question must have an "explanation" field (1-2 sentences) explaining the correct answer, shown when the participant gets it wrong

OUTPUT FORMAT (JSON only, no explanations):
{
  "title": "Quiz title (short, descriptive, 3-8 words maximum, no prefix)",
  "questions": [
    {
      "type": ${options.questionType === "MCQ" ? '"MULTIPLE_CHOICE"' : options.questionType === "TRUE_FALSE" ? '"TRUE_FALSE"' : '"MULTIPLE_CHOICE" | "TRUE_FALSE"'},
      "label": "Question text here",
      "explanation": "1-2 sentences explaining why the correct answer is right (MANDATORY for each question)",
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
- Each question MUST include the "explanation" field with a short pedagogical explanation (mandatory)
- Do not stop before generating all ${options.maxQuestions} complete questions
- For MULTIPLE_CHOICE: exactly 4 options, exactly 1 correct
- For TRUE_FALSE: exactly 2 options, exactly 1 correct
- The "questions" array must contain EXACTLY ${options.maxQuestions} items
${options.questionType === "MCQ" ? "- ALL questions MUST be type MULTIPLE_CHOICE. No TRUE_FALSE questions." : options.questionType === "TRUE_FALSE" ? "- ALL questions MUST be type TRUE_FALSE. No MULTIPLE_CHOICE questions." : ""}

EXAMPLE of one question (replicate for each question with your content and a real "explanation"):
${options.questionType === "TRUE_FALSE" ? '{"type":"TRUE_FALSE","label":"Paris is the capital of France.","explanation":"Paris is the capital and largest city of France.","options":[{"label":"True","isCorrect":true},{"label":"False","isCorrect":false}]}' : '{"type":"MULTIPLE_CHOICE","label":"What is the capital of France?","explanation":"Paris is the capital and largest city of France.","options":[{"label":"Lyon","isCorrect":false},{"label":"Paris","isCorrect":true},{"label":"Marseille","isCorrect":false},{"label":"Bordeaux","isCorrect":false}]}'}`;

  return prompt;
}
