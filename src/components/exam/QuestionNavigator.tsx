import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

interface QuestionNavigatorProps {
  visible: boolean;
  total: number;
  currentIndex: number;
  answeredIds: Set<number>;
  flaggedIds: Set<number>;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function QuestionNavigator({
  visible,
  total,
  currentIndex,
  answeredIds,
  flaggedIds,
  onSelect,
  onClose,
}: QuestionNavigatorProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <AppText variant="subtitle">Question navigator</AppText>
          <AppText variant="caption" color={colors.inkSecondary}>
            Answered · Flagged · Current
          </AppText>
          <View style={styles.grid}>
            {Array.from({ length: total }, (_, index) => {
              const current = index === currentIndex;
              const answered = answeredIds.has(index);
              const flagged = flaggedIds.has(index);
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    onSelect(index);
                    onClose();
                  }}
                  style={[
                    styles.cell,
                    answered && styles.answered,
                    flagged && styles.flagged,
                    current && styles.current,
                  ]}>
                  <AppText
                    variant="bodyStrong"
                    color={current ? colors.surface : colors.ink}
                    align="center">
                    {index + 1}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <AppButton label="Close" variant="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  answered: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  flagged: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.flag,
  },
  current: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
});
