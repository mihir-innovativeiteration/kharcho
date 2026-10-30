import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { EditProfileModal } from '@/components/settings/EditProfileModal';
import { LanguageSelectorModal } from '@/components/settings/LanguageSelectorModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { APP_CONFIG } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSync } from '@/hooks/useSync';
import { notificationApiClient } from '@/services/api/notificationApi';
import { notificationService } from '@/services/notifications/notificationService';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Database,
  Edit3,
  FileText,
  Globe,
  Lock,
  LogOut,
  Moon,
  RefreshCw,
  Repeat,
  RotateCcw,
  Shield,
  Smartphone,
  Sun,
  UserX,
  XCircle,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { user, logout, logoutAll, deleteAccount } = useAuth();

  const {
    resetToMockData,
    clearAllToEmptyState,
    resetOnboarding,
  } = useApp();

  const { pendingCount } = useSync();

  const [billReminders, setBillReminders] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [savingsMilestones, setSavingsMilestones] = useState(true);
  const [syncAlerts, setSyncAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutAllModalVisible, setLogoutAllModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void notificationApiClient.getPreferences().then((prefs) => {
      if (isMounted && prefs) {
        setBillReminders(prefs.billRemindersEnabled ?? true);
        setBudgetAlerts(prefs.budgetAlertsEnabled ?? true);
        setSavingsMilestones(prefs.savingsMilestonesEnabled ?? true);
        setSyncAlerts(prefs.syncAlertsEnabled ?? true);
        setDailySummary(prefs.dailySummaryEnabled ?? false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleBillReminders = (val: boolean) => {
    haptics.selection();
    setBillReminders(val);
    void notificationApiClient.updatePreferences({ billRemindersEnabled: val });
  };

  const handleToggleBudgetAlerts = (val: boolean) => {
    haptics.selection();
    setBudgetAlerts(val);
    void notificationApiClient.updatePreferences({ budgetAlertsEnabled: val });
  };

  const handleToggleSavingsMilestones = (val: boolean) => {
    haptics.selection();
    setSavingsMilestones(val);
    void notificationApiClient.updatePreferences({ savingsMilestonesEnabled: val });
  };

  const handleToggleSyncAlerts = (val: boolean) => {
    haptics.selection();
    setSyncAlerts(val);
    void notificationApiClient.updatePreferences({ syncAlertsEnabled: val });
  };

  const handleToggleDailySummary = (val: boolean) => {
    haptics.selection();
    setDailySummary(val);
    void notificationApiClient.updatePreferences({ dailySummaryEnabled: val });
  };

  const handleResetOnboarding = async () => {
    haptics.medium();
    await resetOnboarding();
    router.replace('/onboarding');
  };

  const handleConfirmReset = async () => {
    haptics.medium();
    await resetToMockData();
    setResetModalVisible(false);
  };

  const handleConfirmLogout = async () => {
    haptics.warning();
    setLogoutModalVisible(false);
    await notificationService.unregisterDeviceToken();
    await logout();
    router.replace('/(auth)/sign-in');
  };

  const handleConfirmLogoutAll = async () => {
    haptics.warning();
    setLogoutAllModalVisible(false);
    await notificationService.unregisterDeviceToken();
    await logoutAll();
    router.replace('/(auth)/sign-in');
  };

  const handleConfirmDeleteAccount = async () => {
    haptics.error();
    setDeleteAccountModalVisible(false);
    try {
      await notificationService.unregisterDeviceToken();
      await deleteAccount();
      router.replace('/(auth)/sign-in');
    } catch {
      // Ignored
    }
  };

  const currentLangLabel =
    i18n.language === 'gu'
      ? 'ગુજરાતી'
      : i18n.language === 'hi'
      ? 'हिन्दी'
      : 'English';

  const displayName = user?.name || '';
  const displayEmail = user?.email || '';
  const isVerified = Boolean(user?.isEmailVerified);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t('settings.profileAndSettings')}
          subtitle="Account, preferences & security"
        />

        {/* Profile Card */}
        <Card padding="lg" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: theme.colors.brandPrimary,
                },
              ]}
            >
              <Text style={styles.avatarInitials}>
                {displayName.trim()
                  ? displayName
                      .trim()
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                  : 'KH'}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameBadgeRow}>
                <Text
                  style={[
                    styles.profileName,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.bold,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <Badge label="PRO" variant="brand" size="sm" />
              </View>

              <Text style={[styles.profileEmail, { color: theme.colors.textMuted }]}>
                {displayEmail}
              </Text>

              <View style={styles.verificationRow}>
                {isVerified ? (
                  <View style={styles.verifiedChip}>
                    <CheckCircle2 size={12} color={theme.colors.income} strokeWidth={2.4} />
                    <Text style={[styles.verificationText, { color: theme.colors.income }]}>
                      {t('settings.verified')}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => router.push('/(auth)/verify-email')}
                    style={styles.unverifiedChip}
                  >
                    <XCircle size={12} color={theme.colors.warning} strokeWidth={2.4} />
                    <Text style={[styles.verificationText, { color: theme.colors.warning }]}>
                      {t('settings.unverified')} (Verify)
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <Pressable
              onPress={() => setEditProfileVisible(true)}
              style={[
                styles.editIconBtn,
                { backgroundColor: theme.colors.surfaceSubtle },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={16} color={theme.colors.brandAccent} />
            </Pressable>
          </View>
        </Card>

        {/* Financial Schedules */}
        <SectionHeader title={t('recurring.title')} subtitle={t('recurring.subtitle')} />
        <Card padding="md" style={styles.settingsCard}>
          <Pressable
            style={styles.navRow}
            onPress={() => {
              haptics.selection();
              router.push('/recurring' as any);
            }}
          >
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
                ]}
              >
                <Repeat size={16} color={theme.colors.brandPrimary} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('recurring.allRules')}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  {t('recurring.upcomingSubtitle')}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </Pressable>
        </Card>

        {/* Language Selection */}
        <SectionHeader title={t('settings.language')} subtitle="Select app interface language" />
        <Card padding="md" style={styles.settingsCard}>
          <Pressable
            style={styles.navRow}
            onPress={() => setLangModalVisible(true)}
          >
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.incomeLight },
                ]}
              >
                <Globe size={16} color={theme.colors.brandAccent} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('settings.language')}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  {currentLangLabel}
                </Text>
              </View>
            </View>
            <View style={styles.rightWithChevron}>
              <Badge label={currentLangLabel} variant="brand" size="sm" />
              <ChevronRight size={18} color={theme.colors.textMuted} />
            </View>
          </Pressable>
        </Card>

        {/* Appearance Settings */}
        <SectionHeader title={t('settings.appearance')} subtitle="Customize interface theme" />
        <Card padding="md" style={styles.settingsCard}>
          <Text
            style={[
              styles.settingLabel,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {t('settings.themeMode')}
          </Text>
          <SegmentedControl
            options={[
              {
                value: 'light',
                label: t('settings.light'),
                icon: <Sun size={14} color={theme.colors.brandAccent} />,
              },
              {
                value: 'dark',
                label: t('settings.dark'),
                icon: <Moon size={14} color={theme.colors.brandAccent} />,
              },
              {
                value: 'system',
                label: t('settings.system'),
                icon: <Smartphone size={14} color={theme.colors.brandAccent} />,
              },
            ]}
            value={themeMode}
            onChange={(mode) => setThemeMode(mode)}
            style={styles.themeSelector}
          />
        </Card>

        {/* Security & Sessions */}
        <SectionHeader title={t('settings.accountSecurity')} subtitle="Device sessions & protection" />
        <Card padding="md" style={styles.settingsCard}>
          <Pressable
            style={styles.navRow}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceSubtle },
                ]}
              >
                <Lock size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  Change / Reset Password
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  Request a password reset email
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <Pressable
            style={styles.navRow}
            onPress={() => setLogoutAllModalVisible(true)}
          >
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.expenseLight },
                ]}
              >
                <UserX size={16} color={theme.colors.expense} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.expense,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('settings.logOutAll')}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  {t('settings.logOutAllDesc')}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceSubtle },
                ]}
              >
                <Database size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  Hardware Storage Encryption
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  Expo SecureStore active
                </Text>
              </View>
            </View>
            <Badge label="Active" variant="success" size="sm" />
          </View>
        </Card>

        {/* Notifications Settings */}
        <SectionHeader
          title={t('sync.notificationsTitle')}
          subtitle={t('sync.notificationsSubtitle')}
        />
        <Card padding="md" style={styles.settingsCard}>
          {/* Bill Reminders */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.incomeLight },
                ]}
              >
                <Repeat size={16} color={theme.colors.income} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('sync.billReminders')}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  {t('sync.billRemindersDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={billReminders}
              onValueChange={handleToggleBillReminders}
              trackColor={{ false: theme.colors.border, true: theme.colors.brandAccent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Budget Overrun Alerts */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.warningLight },
                ]}
              >
                <Shield size={16} color={theme.colors.warning} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('sync.budgetAlerts')}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  {t('sync.budgetAlertsDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={budgetAlerts}
              onValueChange={handleToggleBudgetAlerts}
              trackColor={{ false: theme.colors.border, true: theme.colors.brandAccent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Savings Milestones */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceSubtle },
                ]}
              >
                <Bell size={16} color={theme.colors.brandAccent} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('sync.savingsMilestones')}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  {t('sync.savingsMilestonesDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={savingsMilestones}
              onValueChange={handleToggleSavingsMilestones}
              trackColor={{ false: theme.colors.border, true: theme.colors.brandAccent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Sync & Offline Alerts */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceSubtle },
                ]}
              >
                <RefreshCw size={16} color={theme.colors.textPrimary} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('sync.syncAlerts')}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  {t('sync.syncAlertsDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={syncAlerts}
              onValueChange={handleToggleSyncAlerts}
              trackColor={{ false: theme.colors.border, true: theme.colors.brandAccent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Daily Summary */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.surfaceSubtle },
                ]}
              >
                <FileText size={16} color={theme.colors.textMuted} strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.fontFamily.medium,
                    },
                  ]}
                >
                  {t('sync.dailySummary')}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  {t('sync.dailySummaryDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={dailySummary}
              onValueChange={handleToggleDailySummary}
              trackColor={{ false: theme.colors.border, true: theme.colors.brandAccent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Reviewer & Demo Controls */}
        <SectionHeader
          title="Reviewer & Demo Controls"
          subtitle="Test onboarding, demo data, and empty states"
        />
        <Card padding="md" style={styles.settingsCard}>
          <Pressable
            style={styles.navRow}
            onPress={handleResetOnboarding}
          >
            <View style={styles.settingIconRow}>
              <RotateCcw size={16} color={theme.colors.brandAccent} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.colors.textPrimary, fontWeight: '600' },
                  ]}
                >
                  Replay First-Time Onboarding
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  View the 3-page introduction walkthrough again
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <Pressable
            style={styles.navRow}
            onPress={() => setResetModalVisible(true)}
          >
            <View style={styles.settingIconRow}>
              <RefreshCw size={16} color={theme.colors.income} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.colors.textPrimary, fontWeight: '600' },
                  ]}
                >
                  Restore Verified Demo Records
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  Populate rich Indian transaction and budget samples
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <Pressable
            style={styles.navRow}
            onPress={clearAllToEmptyState}
          >
            <View style={styles.settingIconRow}>
              <FileText size={16} color={theme.colors.expense} />
              <View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: theme.colors.expense, fontWeight: '600' },
                  ]}
                >
                  Clear All to Test Empty States
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.textMuted }]}>
                  Verify clean empty layouts across all tabs
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </Pressable>
        </Card>

        {/* About App */}
        <SectionHeader title="About Kharcho" />
        <Card padding="md" style={styles.settingsCard}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutTitle, { color: theme.colors.textPrimary }]}>
              {APP_CONFIG.name}
            </Text>
            <Text style={[styles.aboutVersion, { color: theme.colors.textMuted }]}>
              v{APP_CONFIG.version} (Build {APP_CONFIG.build})
            </Text>
          </View>
          <Text style={[styles.aboutTagline, { color: theme.colors.textSecondary }]}>
            {APP_CONFIG.tagline}
          </Text>
          <Text style={[styles.copyright, { color: theme.colors.textMuted }]}>
            Crafted with precision for India · Phase 2 Complete Authentication System
          </Text>
        </Card>

        {/* Logout Button */}
        <Button
          title={t('auth.logout')}
          onPress={() => setLogoutModalVisible(true)}
          variant="outline"
          size="md"
          leftIcon={<LogOut size={16} color={theme.colors.expense} />}
          textStyle={{ color: theme.colors.expense }}
          style={styles.logoutButton}
        />

        {/* Delete Account Button (App Store / Play Store compliance) */}
        <Button
          title="Delete Account & Personal Data"
          onPress={() => setDeleteAccountModalVisible(true)}
          variant="ghost"
          size="sm"
          leftIcon={<UserX size={14} color={theme.colors.textMuted} />}
          textStyle={{ color: theme.colors.textMuted, fontSize: 13 }}
          style={styles.deleteAccountButton}
        />
      </ScrollView>

      {/* Confirmation Dialogs & Modals */}
      <ModalDialog
        visible={deleteAccountModalVisible}
        title="Permanently Delete Account?"
        description="This action is irreversible. All your transactions, budgets, recurring bills, and savings history will be permanently deleted from our servers."
        confirmText="Delete My Account"
        isDestructive
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteAccountModalVisible(false)}
      />
      <ModalDialog
        visible={logoutModalVisible}
        title={pendingCount > 0 ? t('sync.unsyncedLogoutTitle') : t('auth.logoutConfirmTitle')}
        description={
          pendingCount > 0
            ? t('sync.unsyncedLogoutMessage', { count: pendingCount })
            : t('auth.logoutConfirmDesc')
        }
        confirmText={t('auth.logout')}
        isDestructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />

      <ModalDialog
        visible={logoutAllModalVisible}
        title={t('settings.logOutAll')}
        description="This will revoke all active sessions across all your phones and tablets. You will need to sign in again."
        confirmText="Log Out All"
        isDestructive
        onConfirm={handleConfirmLogoutAll}
        onCancel={() => setLogoutAllModalVisible(false)}
      />

      <ModalDialog
        visible={resetModalVisible}
        title="Restore Demo Data"
        description="This will reload the realistic sample Indian transactions and category budgets for testing."
        confirmText="Restore"
        onConfirm={handleConfirmReset}
        onCancel={() => setResetModalVisible(false)}
      />

      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileCard: {
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitials: {
    color: '#34D399',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 4,
  },
  verificationRow: {
    marginTop: 2,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unverifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCard: {
    marginBottom: 16,
  },
  themeSelector: {
    marginTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  rightWithChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aboutVersion: {
    fontSize: 12,
  },
  aboutTagline: {
    fontSize: 13,
    marginBottom: 6,
  },
  copyright: {
    fontSize: 11,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 8,
    borderColor: '#FECDD3',
  },
  deleteAccountButton: {
    marginBottom: 24,
  },
});
