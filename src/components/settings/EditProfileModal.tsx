import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { User } from 'lucide-react-native';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      haptics.error();
      setError(t('validation.nameTooShort'));
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await updateProfile({ name: name.trim() });
      haptics.success();
      onClose();
    } catch (e: any) {
      haptics.error();
      setError(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
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
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            {t('settings.editProfile')}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.fontFamily.regular,
              },
            ]}
          >
            {t('settings.editProfileSub')}
          </Text>

          <Input
            label={t('settings.displayName')}
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(undefined);
            }}
            leftElement={<User size={18} color={theme.colors.textMuted} />}
            error={error}
          />

          <View style={styles.buttonRow}>
            <Button
              title={t('common.cancel')}
              onPress={onClose}
              variant="secondary"
              size="md"
              style={styles.actionBtn}
            />
            <Button
              title={t('common.save')}
              onPress={handleSave}
              loading={loading}
              variant="primary"
              size="md"
              style={styles.actionBtn}
            />
          </View>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
