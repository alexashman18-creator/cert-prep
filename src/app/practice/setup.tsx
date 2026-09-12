import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ChoiceChip } from '@/components/ui/ChoiceChip';
import { DomainChoiceCard } from '@/components/ui/DomainChoiceCard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useRepositories } from '@/hooks/useRepositories';
import { useStartPractice } from '@/hooks/usePracticeSession';
import { DOMAIN_IDS, type DomainId } from '@/types/domain';
import { PRACTICE_LENGTHS, type PracticeDomainFilter, type PracticeLength } from '@/types/session';
import { colors, spacing } from '@/theme/tokens';

export default function PracticeSetupScreen() {
  const repos = useRepositories();
  const startPractice = useStartPractice();
  const [domain, setDomain] = useState<PracticeDomainFilter>('all');
  const [length, setLength] = useState<PracticeLength>(10);
  const [available, setAvailable] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void repos.questions
      .countByDomain(domain === 'all' ? undefined : domain)
      .then(setAvailable)
      .catch(() => setAvailable(0));
  }, [domain, repos.questions]);

  const actualCount = Math.min(length, available);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await startPractice({
        domainFilter: domain,
        requestedCount: length,
      });
      router.replace({ pathname: '/practice/session', params: { id: session.id } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start practice.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <View style={styles.section}>
        <SectionHeader title="Domain" subtitle="Focus one area or mix the full outline" />
        <View style={styles.choices}>
          <DomainChoiceCard
            domain="all"
            selected={domain === 'all'}
            onPress={() => setDomain('all')}
          />
          {DOMAIN_IDS.map((id: DomainId) => (
            <DomainChoiceCard
              key={id}
              domain={id}
              selected={domain === id}
              onPress={() => setDomain(id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Session length" subtitle="Number of questions in this sitting" />
        <Card>
          <View style={styles.row}>
            {PRACTICE_LENGTHS.map((value) => (
              <View key={value} style={styles.flex}>
                <ChoiceChip
                  label={`${value}`}
                  selected={length === value}
                  onPress={() => setLength(value)}
                />
              </View>
            ))}
          </View>
          <AppText variant="caption" color={colors.inkSecondary} style={styles.hint}>
            {available} sample question{available === 1 ? '' : 's'} available
            {actualCount < length ? `. This session will use ${actualCount}.` : '.'}
          </AppText>
        </Card>
      </View>

      {error ? (
        <AppText variant="body" color={colors.danger} style={styles.message}>
          {error}
        </AppText>
      ) : null}

      {actualCount === 0 ? (
        <AppText variant="body" color={colors.inkSecondary} style={styles.message}>
          No questions are available for this selection yet.
        </AppText>
      ) : null}

      <AppButton
        label="Start Practice"
        icon="play"
        onPress={() => void start()}
        disabled={busy || actualCount === 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  choices: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  hint: {
    marginTop: spacing.md,
  },
  message: {
    marginBottom: spacing.md,
  },
});
