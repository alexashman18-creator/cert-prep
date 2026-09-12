import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

export interface ChoiceDialogAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ChoiceDialogProps {
  visible: boolean;
  title: string;
  body: string;
  actions: ChoiceDialogAction[];
  onCancel: () => void;
}

export function ChoiceDialog({ visible, title, body, actions, onCancel }: ChoiceDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Cancel" />
        <View
          style={styles.sheet}
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${body}`}>
          <AppText variant="subtitle">{title}</AppText>
          <AppText variant="body" color={colors.inkSecondary}>
            {body}
          </AppText>
          <View style={styles.actions}>
            {actions.map((action) => (
              <AppButton
                key={action.label}
                label={action.label}
                variant={action.variant ?? 'secondary'}
                onPress={action.onPress}
              />
            ))}
            <AppButton label="Cancel" variant="ghost" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
