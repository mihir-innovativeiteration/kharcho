import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Cloud, RefreshCw, WifiOff } from 'lucide-react-native';
import { useSync } from '@/hooks/useSync';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';

export function SyncStatusBar() {
  const { syncStatus, pendingCount, syncNow, isOnline } = useSync();
  const { theme } = useTheme();
  const { t } = useTranslation();

  // If online and fully synced with no pending, do not render clutter
  if (isOnline && syncStatus === 'synced' && pendingCount === 0) {
    return null;
  }

  const handleManualSync = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void syncNow();
  };

  let backgroundColor = 'rgba(234, 179, 8, 0.12)';
  let borderColor = 'rgba(234, 179, 8, 0.3)';
  let textColor = '#ca8a04';
  let IconComponent = Cloud;
  let message = '';

  if (!isOnline || syncStatus === 'offline') {
    backgroundColor = 'rgba(107, 114, 128, 0.12)';
    borderColor = 'rgba(107, 114, 128, 0.3)';
    textColor = theme.colors.textMuted;
    IconComponent = WifiOff;
    message =
      pendingCount > 0
        ? `${t('sync.offlineWithPending', { count: pendingCount })}`
        : t('sync.offlineMode');
  } else if (syncStatus === 'syncing') {
    backgroundColor = 'rgba(59, 130, 246, 0.12)';
    borderColor = 'rgba(59, 130, 246, 0.3)';
    textColor = '#2563eb';
    IconComponent = RefreshCw;
    message = t('sync.syncing');
  } else if (syncStatus === 'conflict') {
    backgroundColor = 'rgba(239, 68, 68, 0.12)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
    textColor = '#dc2626';
    IconComponent = AlertTriangle;
    message = t('sync.conflictDetected');
  } else if (syncStatus === 'error') {
    backgroundColor = 'rgba(239, 68, 68, 0.12)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
    textColor = '#dc2626';
    IconComponent = AlertTriangle;
    message = t('sync.syncError');
  } else if (pendingCount > 0) {
    backgroundColor = 'rgba(234, 179, 8, 0.12)';
    borderColor = 'rgba(234, 179, 8, 0.3)';
    textColor = '#ca8a04';
    IconComponent = Cloud;
    message = t('sync.pendingCount', { count: pendingCount });
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.leftRow}>
        <IconComponent size={14} color={textColor} style={{ marginRight: 6 }} />
        <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
          {message}
        </Text>
      </View>

      {isOnline && syncStatus !== 'syncing' && (
        <TouchableOpacity
          onPress={handleManualSync}
          style={styles.retryButton}
          accessibilityLabel={t('sync.syncNow')}
        >
          <Text style={[styles.retryText, { color: textColor }]}>
            {t('sync.syncNow')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
