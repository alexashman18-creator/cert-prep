import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { formatPercent } from '@/lib/format';
import { DOMAIN_LABELS } from '@/types/domain';
import type { SessionResults } from '@/types/session';
import { colors, spacing } from '@/theme/tokens';

interface ResultsSummaryProps {
  results: SessionResults;
  caption: string;
}

export function ResultsSummary({ results, caption }: ResultsSummaryProps) {
  return (
    <View style={styles.stack}>
      <Card>
        <AppText variant="label" color={colors.accent}>
          PRACTICE PERFORMANCE
        </AppText>
        <AppText variant="display" style={styles.score}>
          {formatPercent(results.percent)}
        </AppText>
        <AppText variant="body" color={colors.inkSecondary}>
          {caption}
        </AppText>
        <View style={styles.stats}>
          <StatTile label="Correct" value={String(results.correct)} />
          <StatTile label="Incorrect" value={String(results.incorrect)} />
          <StatTile label="Unanswered" value={String(results.unanswered)} />
        </View>
      </Card>
      <Card>
        <AppText variant="subtitle">Domain performance</AppText>
        <View style={styles.domains}>
          {results.domainPerformance.map((item) => (
            <View key={item.domain} style={styles.domainRow}>
              <View style={styles.domainCopy}>
                <AppText variant="bodyStrong">{DOMAIN_LABELS[item.domain]}</AppText>
                <AppText variant="caption" color={colors.inkSecondary}>
                  {item.correct}/{item.answered} answered correctly
                </AppText>
              </View>
              <AppText variant="subtitle">{formatPercent(item.percent)}</AppText>
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
  score: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  domains: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  domainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  domainCopy: {
    flex: 1,
    gap: spacing.xs,
  },
});
