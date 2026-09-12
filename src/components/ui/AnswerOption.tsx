import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export type AnswerState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'muted';

interface AnswerOptionProps {
  label: string;
  text: string;
  state: AnswerState;
  disabled?: boolean;
  onPress: () => void;
}

const LETTER_COLORS: Record<AnswerState, { bg: string; fg: string; border: string }> = {
  idle: { bg: colors.surfaceMuted, fg: colors.ink, border: colors.border },
  selected: { bg: colors.accentSoft, fg: colors.accent, border: colors.accent },
  correct: { bg: colors.successSoft, fg: colors.success, border: colors.success },
  incorrect: { bg: colors.dangerSoft, fg: colors.danger, border: colors.danger },
  muted: { bg: colors.surface, fg: colors.inkTertiary, border: colors.border },
};

export function AnswerOption({ label, text, state, disabled, onPress }: AnswerOptionProps) {
  const tone = LETTER_COLORS[state];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.row, { borderColor: tone.border, backgroundColor: tone.bg }]}>
      <View style={[styles.letter, { backgroundColor: colors.surface }]}>
        <AppText variant="bodyStrong" color={tone.fg}>
          {label}
        </AppText>
      </View>
      <AppText
        variant="body"
        color={state === 'muted' ? colors.inkTertiary : colors.ink}
        style={styles.text}>
        {text}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  letter: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    paddingTop: 4,
  },
});
