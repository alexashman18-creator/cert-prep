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

const TONE: Record<AnswerState, { bg: string; fg: string; border: string; letterBg: string }> = {
  idle: {
    bg: colors.surface,
    fg: colors.ink,
    border: colors.border,
    letterBg: colors.surfaceMuted,
  },
  selected: {
    bg: colors.accentMuted,
    fg: colors.accentDeep,
    border: colors.accent,
    letterBg: colors.accentSoft,
  },
  correct: {
    bg: colors.successSoft,
    fg: colors.success,
    border: colors.success,
    letterBg: '#D8F0E3',
  },
  incorrect: {
    bg: colors.dangerSoft,
    fg: colors.danger,
    border: colors.danger,
    letterBg: '#F8D4D1',
  },
  muted: {
    bg: colors.backgroundWarm,
    fg: colors.inkTertiary,
    border: colors.border,
    letterBg: colors.surfaceMuted,
  },
};

const STATE_STATUS: Record<AnswerState, string | null> = {
  idle: null,
  selected: 'Selected',
  correct: 'Correct answer',
  incorrect: 'Your answer',
  muted: null,
};

export function AnswerOption({ label, text, state, disabled, onPress }: AnswerOptionProps) {
  const tone = TONE[state];
  const status = STATE_STATUS[state];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(disabled),
        selected: state === 'selected' || state === 'incorrect' || state === 'correct',
      }}
      accessibilityLabel={`${label}. ${text}${status ? `. ${status}` : ''}`}
      style={[styles.row, { borderColor: tone.border, backgroundColor: tone.bg }]}>
      <View style={[styles.letter, { backgroundColor: tone.letterBg }]}>
        <AppText variant="bodyStrong" color={tone.fg} maxFontSizeMultiplier={1.3}>
          {label}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText
          variant="body"
          color={state === 'muted' ? colors.inkTertiary : colors.ink}
          style={styles.text}>
          {text}
        </AppText>
        {status ? (
          <AppText variant="caption" color={tone.fg}>
            {status}
          </AppText>
        ) : null}
      </View>
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
    minHeight: 56,
  },
  letter: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    paddingTop: 4,
  },
  text: {
    flexShrink: 1,
  },
});
