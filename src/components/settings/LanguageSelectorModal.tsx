import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { changeLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { Check, Globe } from 'lucide-react-native';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelectorModal({ visible, onClose }: LanguageSelectorModalProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const haptics = useHaptics();
  const { user, updateProfile } = useAuth();

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    haptics.selection();
    await changeLanguage(code);

    // If authenticated, sync with server
    if (user) {
      try {
        await updateProfile({ preferredLanguage: code });
      } catch {
        // Local preference already updated
      }
    }

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            theme.shadows.elevated,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.titleRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.incomeLight },
              ]}
            >
              <Globe size={18} color={theme.colors.brandAccent} strokeWidth={2.2} />
            </View>
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              {t('settings.selectLanguage')}
            </Text>
          </View>

          <View style={styles.languagesList}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = i18n.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleSelectLanguage(lang.code)}
                  style={[
                    styles.langRow,
                    {
                      backgroundColor: isSelected
                        ? theme.isDark
                          ? '#1A332B'
                          : '#ECFDF5'
                        : theme.colors.surfaceSubtle,
                      borderColor: isSelected
                        ? theme.colors.brandAccent
                        : theme.colors.border,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View>
                    <Text
                      style={[
                        styles.nativeName,
                        {
                          color: theme.colors.textPrimary,
                          fontFamily: theme.typography.fontFamily.semiBold,
                        },
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.langLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {lang.label}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.checkCircle,
                        { backgroundColor: theme.colors.brandAccent },
                      ]}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Button
            title={t('common.close')}
            onPress={onClose}
            variant="secondary"
            size="md"
            fullWidth
            style={styles.closeBtn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  languagesList: {
    gap: 10,
    marginBottom: 20,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  nativeName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  langLabel: {
    fontSize: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    marginTop: 4,
  },
});
