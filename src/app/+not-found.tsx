import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <AppText variant="title">This screen does not exist.</AppText>
        <Link href="/" style={styles.link}>
          <AppText variant="bodyStrong" color={colors.accent}>
            Return home
          </AppText>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    marginTop: spacing.lg,
  },
});
