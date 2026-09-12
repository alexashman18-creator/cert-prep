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
  maxFontSizeMultiplier = 1.6,
  ...rest
}: AppTextProps) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typography[variant], { color, textAlign: align }, style as StyleProp<TextStyle>]}
      {...rest}>
      {children}
    </Text>
  );
}
