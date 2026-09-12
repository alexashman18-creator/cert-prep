import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

interface EmptyStateProps {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({ title, body, icon = 'documents-outline' }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap} importantForAccessibility="no-hide-descendants">
        <Ionicons name={icon} size={26} color={colors.accent} />
      </View>
      <AppText variant="subtitle" align="center">
        {title}
      </AppText>
      <AppText variant="body" color={colors.inkSecondary} align="center">
        {body}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingVertical: spacing.huge,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
