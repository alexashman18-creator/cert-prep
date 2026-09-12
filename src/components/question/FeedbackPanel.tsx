import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import type { Question } from '@/types/question';
import { colors, spacing } from '@/theme/tokens';

interface FeedbackPanelProps {
  question: Question;
  selectedOptionId: string;
}

export function FeedbackPanel({ question, selectedOptionId }: FeedbackPanelProps) {
  const isCorrect = selectedOptionId === question.correctAnswerId;
  return (
    <View style={styles.stack}>
      <Card tone={isCorrect ? 'success' : 'danger'}>
        <View
          style={styles.verdict}
          accessibilityRole="text"
          accessibilityLabel={isCorrect ? 'Correct' : 'Incorrect'}>
          <Ionicons
            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
            size={22}
            color={isCorrect ? colors.success : colors.danger}
          />
          <AppText variant="subtitle" color={isCorrect ? colors.success : colors.danger}>
            {isCorrect ? 'Correct' : 'Incorrect'}
          </AppText>
        </View>
        <AppText variant="body" color={colors.ink} style={styles.block}>
          {question.explanation}
        </AppText>
      </Card>
      <Card>
        <AppText variant="subtitle">Why each option</AppText>
        <View style={styles.reasons}>
          {question.options.map((option) => {
            const correct = option.id === question.correctAnswerId;
            return (
              <View key={option.id} style={styles.reason}>
                <AppText variant="bodyStrong" color={correct ? colors.success : colors.ink}>
                  {option.id.toUpperCase()}. {option.text}
                  {correct ? ' · Correct' : ''}
                </AppText>
                <AppText variant="body" color={colors.inkSecondary}>
                  {question.optionExplanations[option.id]}
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  block: {
    marginTop: spacing.sm,
  },
  reasons: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  reason: {
    gap: spacing.xs,
  },
});
