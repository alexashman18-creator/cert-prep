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
import { useSelectedCertification } from '@/hooks/useSelectedCertification';
import { useRepositories } from '@/hooks/useRepositories';
import { useStartPractice } from '@/hooks/usePracticeSession';
import { PRACTICE_LENGTHS, type PracticeDomainFilter, type PracticeLength } from '@/types/session';
import { colors, spacing } from '@/theme/tokens';

export default function PracticeSetupScreen() {
  const repos = useRepositories();
  const { certification } = useSelectedCertification();
  const startPractice = useStartPractice();
  const [domain, setDomain] = useState<PracticeDomainFilter>('all');
  const [length, setLength] = useState<PracticeLength>(10);
  const [available, setAvailable] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const domains = certification?.domains ?? [];

  useEffect(() => {
    if (!certification) {
      return;
    }
    void repos.questions
      .countByDomain(certification.id, domain === 'all' ? undefined : domain)
      .then(setAvailable)
      .catch(() => setAvailable(0));
  }, [certification, domain, repos.questions]);

  const actualCount = Math.min(length, available);

  const start = async () => {
    if (!certification) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await startPractice({
        certificationId: certification.id,
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
            title="All Domains"
            summary="Questions from every domain in this certification"
            selected={domain === 'all'}
            onPress={() => setDomain('all')}
          />
          {domains.map((item) => (
            <DomainChoiceCard
              key={item.id}
              domain={item.id}
              title={item.label}
              summary={item.summary}
              selected={domain === item.id}
              onPress={() => setDomain(item.id)}
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
            {available} question{available === 1 ? '' : 's'} available
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
        disabled={busy || actualCount === 0 || !certification}
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
