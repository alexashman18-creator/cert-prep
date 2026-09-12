import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { colors, typography } from '@/theme/tokens';

type TextVariant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  color = colors.ink,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[typography[variant], { color, textAlign: align }, style as StyleProp<TextStyle>]}
      {...rest}>
      {children}
    </Text>
  );
}
