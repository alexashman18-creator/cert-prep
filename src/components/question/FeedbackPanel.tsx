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
      <Card style={{ backgroundColor: isCorrect ? colors.successSoft : colors.dangerSoft }}>
        <View accessibilityRole="text" accessibilityLabel={isCorrect ? 'Correct' : 'Incorrect'}>
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
          {question.options.map((option) => (
            <View key={option.id} style={styles.reason}>
              <AppText variant="bodyStrong">
                {option.id.toUpperCase()}. {option.text}
              </AppText>
              <AppText variant="body" color={colors.inkSecondary}>
                {question.optionExplanations[option.id]}
              </AppText>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
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
