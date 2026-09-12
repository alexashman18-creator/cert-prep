import { StyleSheet, View } from 'react-native';

import { AnswerOption, type AnswerState } from '@/components/ui/AnswerOption';
import { AppText } from '@/components/ui/AppText';
import { DomainBadge } from '@/components/ui/DomainBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Question } from '@/types/question';
import { colors, spacing } from '@/theme/tokens';

interface QuestionPromptProps {
  question: Question;
  index: number;
  total: number;
  selectedOptionId: string | null;
  submitted?: boolean;
  disabled?: boolean;
  onSelect: (optionId: string) => void;
}

function optionState(
  optionId: string,
  question: Question,
  selectedOptionId: string | null,
  submitted: boolean,
): AnswerState {
  if (!submitted) {
    return selectedOptionId === optionId ? 'selected' : 'idle';
  }
  if (optionId === question.correctAnswerId) {
    return 'correct';
  }
  if (optionId === selectedOptionId) {
    return 'incorrect';
  }
  return 'muted';
}

export function QuestionPrompt({
  question,
  index,
  total,
  selectedOptionId,
  submitted = false,
  disabled = false,
  onSelect,
}: QuestionPromptProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.meta}>
        <DomainBadge domain={question.domain} />
        <AppText variant="caption" color={colors.inkSecondary}>
          Question {index + 1} of {total}
        </AppText>
      </View>
      <ProgressBar value={index + (submitted ? 1 : 0)} max={total} />
      <AppText variant="subtitle">{question.questionText}</AppText>
      <View style={styles.options}>
        {question.options.map((option) => (
          <AnswerOption
            key={option.id}
            label={option.id.toUpperCase()}
            text={option.text}
            state={optionState(option.id, question, selectedOptionId, submitted)}
            disabled={disabled || submitted}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  options: {
    gap: spacing.sm,
  },
});
