import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/hooks/useApp';
import { useHaptics } from '@/hooks/useHaptics';
import { getGreeting } from '@/utils/date';
import { Settings, Sparkles } from 'lucide-react-native';

export function GreetingHeader() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { userProfile } = useApp();
  const router = useRouter();
  const haptics = useHaptics();

  const activeUser = user || userProfile;
  const fullName = activeUser?.name?.trim() || '';
  const firstName = fullName ? fullName.split(' ')[0] : '';
  const { greeting } = getGreeting(firstName || 'there');

  const avatarInitials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'KH';

  const navigateToProfile = () => {
    haptics.selection();
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={navigateToProfile}
        style={styles.leftRow}
        accessibilityRole="button"
        accessibilityLabel={t('settings.profileAndSettings', 'Profile and Settings')}
      >
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: theme.isDark ? '#1C382F' : '#E6F4EA',
              borderColor: theme.isDark ? '#2B5749' : '#A7F3D0',
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              {
                color: theme.colors.brandAccent,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {avatarInitials}
          </Text>
        </View>

        <View style={styles.greetingTextColumn}>
          <Text
            style={[
              styles.salutation,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fontFamily.regular,
              },
            ]}
          >
            {greeting}
          </Text>
          <View style={styles.statusRow}>
            <Text
              style={[
                styles.brandTitle,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
              numberOfLines={1}
            >
              {fullName || 'Kharcho'}
            </Text>
            <View
              style={[
                styles.proPill,
                {
                  backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5',
                },
              ]}
            >
              <Sparkles size={10} color={theme.colors.brandAccent} strokeWidth={2.5} />
              <Text
                style={[
                  styles.proText,
                  {
                    color: theme.colors.brandAccent,
                  },
                ]}
              >
                PRO
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.rightActions}>
        <Pressable
          onPress={navigateToProfile}
          style={[
            styles.iconBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('settings.profileAndSettings', 'Settings')}
        >
          <Settings size={18} color={theme.colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
  },
  greetingTextColumn: {
    justifyContent: 'center',
    flex: 1,
  },
  salutation: {
    fontSize: 12,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  proText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
