export function missedQuestionIdsFromAnswers(
  answers: readonly { questionId: string; isCorrect: boolean | null }[],
): string[] {
  return [
    ...new Set(
      answers
        .filter((answer) => answer.isCorrect === false)
        .map((answer) => answer.questionId),
    ),
  ];
}
