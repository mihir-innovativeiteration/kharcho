import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GoogleButton({
  onPress,
  loading = false,
  disabled = false,
  style,
}: GoogleButtonProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={t('auth.continueWithGoogle')}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderColor: isDark ? '#374151' : '#E5E7EB',
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.brandAccent} />
      ) : (
        <View style={styles.content}>
          <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.googleIcon}>
            <Path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z"
            />
            <Path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.09-6.68-4.91H1.28v3.13C3.25 21.31 7.31 24 12 24z"
            />
            <Path
              fill="#FBBC05"
              d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.58H1.28C.46 8.2.0 10.04.0 12s.46 3.8 1.28 5.42l4.04-3.13z"
            />
            <Path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.28 6.58l4.04 3.13c.94-2.82 3.58-4.96 6.68-4.96z"
            />
          </Svg>
          <Text
            style={[
              styles.text,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.semiBold,
              },
            ]}
          >
            {t('auth.continueWithGoogle')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 12,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
