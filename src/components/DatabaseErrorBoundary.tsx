import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing } from '@/theme/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  attempt: number;
}

function isRetryableLockError(error: Error): boolean {
  return /Access Handle|NoModificationAllowedError|database is locked/i.test(error.message);
}

export class DatabaseErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };
  retryTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Database or render failure', error, info.componentStack);
    if (isRetryableLockError(error) && this.state.attempt < 4) {
      this.retryTimer = setTimeout(() => {
        this.setState((current) => ({ error: null, attempt: current.attempt + 1 }));
      }, 400 * (this.state.attempt + 1));
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (!this.state.error) {
      return <View key={this.state.attempt} style={styles.fill}>{this.props.children}</View>;
    }

    const retryable = isRetryableLockError(this.state.error);

    return (
      <View style={styles.wrap}>
        <AppText variant="title" align="center">
          Unable to open local study data
        </AppText>
        <AppText variant="body" color={colors.inkSecondary} align="center">
          {retryable
            ? 'Another tab or an earlier session still has the offline database open. Close other AZ-900 Prep windows and try again.'
            : 'AZ-900 Prep could not initialise its offline database. Restart the app. Progress already saved on this device is not deleted.'}
        </AppText>
        <AppButton
          label="Try again"
          onPress={() => this.setState((current) => ({ error: null, attempt: current.attempt + 1 }))}
        />
        <AppText variant="caption" color={colors.inkTertiary} align="center">
          {this.state.error.message}
        </AppText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
});
