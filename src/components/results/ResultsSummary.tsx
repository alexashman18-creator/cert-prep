import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatTile } from '@/components/ui/StatTile';
import { formatPercent } from '@/lib/format';
import { domainLabel } from '@/types/domain';
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
        <AppText variant="display" color={colors.navy} style={styles.score}>
          {formatPercent(results.percent)}
        </AppText>
        <ProgressBar value={results.percent ?? 0} max={100} tone="navy" />
        <AppText variant="body" color={colors.inkSecondary} style={styles.caption}>
          {caption}
        </AppText>
        <View style={styles.stats}>
          <StatTile label="Correct" value={String(results.correct)} tone="success" />
          <StatTile label="Incorrect" value={String(results.incorrect)} tone="danger" />
          <StatTile label="Unanswered" value={String(results.unanswered)} tone="muted" />
        </View>
      </Card>
      <Card>
        <AppText variant="subtitle">Domain performance</AppText>
        <View style={styles.domains}>
          {results.domainPerformance.map((item) => (
            <View key={item.domain} style={styles.domainRow}>
              <View style={styles.domainHead}>
                <View style={styles.domainCopy}>
                  <AppText variant="bodyStrong">{domainLabel(item.domain)}</AppText>
                  <AppText variant="caption" color={colors.inkSecondary}>
                    {item.correct}/{item.answered} answered correctly
                  </AppText>
                </View>
                <AppText variant="subtitle" color={colors.navy}>
                  {formatPercent(item.percent)}
                </AppText>
              </View>
              <ProgressBar value={item.percent ?? 0} max={100} size="sm" />
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
    marginBottom: spacing.md,
  },
  caption: {
    marginTop: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  domains: {
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  domainRow: {
    gap: spacing.sm,
  },
  domainHead: {
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
