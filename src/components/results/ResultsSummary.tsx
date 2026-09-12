import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatPercent } from '@/lib/format';
import { domainLabel } from '@/types/domain';
import type { SessionResults } from '@/types/session';
import { colors, radii, spacing } from '@/theme/tokens';

interface ResultsSummaryProps {
  results: SessionResults;
  caption: string;
}

type CountTone = 'success' | 'danger' | 'muted';

const VALUE_COLOR: Record<CountTone, string> = {
  success: colors.success,
  danger: colors.danger,
  muted: colors.inkSecondary,
};

function ResultCount({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: CountTone;
}) {
  return (
    <View
      style={[styles.count, styles[tone]]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="title" color={VALUE_COLOR[tone]} maxFontSizeMultiplier={1.3}>
        {value}
      </AppText>
      <AppText
        variant="caption"
        color={colors.inkSecondary}
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={styles.countLabel}>
        {label}
      </AppText>
    </View>
  );
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
          <ResultCount label="Correct" value={results.correct} tone="success" />
          <ResultCount label="Incorrect" value={results.incorrect} tone="danger" />
          <ResultCount label="Unanswered" value={results.unanswered} tone="muted" />
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
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  count: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  countLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  success: {
    backgroundColor: colors.successSoft,
    borderColor: '#C7E8D4',
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#F4C7C3',
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
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
