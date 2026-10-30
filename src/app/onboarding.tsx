import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import {
  ArrowRight,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  renderIllustration: (isDark: boolean) => React.ReactNode;
}

export default function OnboardingScreen() {
  const { theme, isDark } = useTheme();
  const { completeOnboarding } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: OnboardingSlide[] = [
    {
      id: 'slide_1',
      badge: 'FINANCIAL CLARITY',
      title: 'Understand Your Money',
      subtitle: 'Where does your hard-earned income really go?',
      description:
        'Track daily food, groceries, bills, and commute seamlessly. Gain total visibility into every rupee spent in India.',
      renderIllustration: () => (
        <View style={styles.illustrationCard}>
          <View
            style={[
              styles.illustrationBg,
              { backgroundColor: isDark ? '#142E25' : '#ECFDF5' },
            ]}
          >
            <Svg width="180" height="180" viewBox="0 0 180 180">
              <Circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke={isDark ? '#234E3E' : '#A7F3D0'}
                strokeWidth="12"
                strokeDasharray="40 10"
              />
              <Circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#10B981"
                strokeWidth="12"
                strokeDasharray="180 300"
              />
            </Svg>
            <View style={styles.floatingCenterIcon}>
              <Wallet size={44} color="#10B981" strokeWidth={2.2} />
            </View>
          </View>
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <CheckCircle2 size={16} color="#10B981" strokeWidth={2.4} />
            <Text style={[styles.pillText, { color: theme.colors.textPrimary }]}>
              Automated INR Categorization
            </Text>
          </View>
        </View>
      ),
    },
    {
      id: 'slide_2',
      badge: 'PROACTIVE BUDGETS',
      title: 'Build Better Habits',
      subtitle: 'Set smart category caps and watch your savings grow.',
      description:
        'Establish monthly budgets for dining, shopping, and utilities. Receive gentle alerts before you exceed your target limits.',
      renderIllustration: () => (
        <View style={styles.illustrationCard}>
          <View
            style={[
              styles.illustrationBg,
              { backgroundColor: isDark ? '#1A2F2B' : '#EBF5EE' },
            ]}
          >
            <View style={styles.budgetMockContainer}>
              <View
                style={[
                  styles.mockBudgetRow,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <View style={[styles.miniDot, { backgroundColor: '#F97316' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mockBudgetText, { color: theme.colors.textPrimary }]}>
                    Dining Out
                  </Text>
                  <View style={[styles.mockBarBg, { backgroundColor: theme.colors.border }]}>
                    <View style={[styles.mockBarFill, { width: '68%', backgroundColor: '#F97316' }]} />
                  </View>
                </View>
                <Text style={[styles.mockAmount, { color: theme.colors.textSecondary }]}>68%</Text>
              </View>

              <View
                style={[
                  styles.mockBudgetRow,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mockBudgetText, { color: theme.colors.textPrimary }]}>
                    Wealth & SIP
                  </Text>
                  <View style={[styles.mockBarBg, { backgroundColor: theme.colors.border }]}>
                    <View style={[styles.mockBarFill, { width: '92%', backgroundColor: '#10B981' }]} />
                  </View>
                </View>
                <Text style={[styles.mockAmount, { color: theme.colors.textSecondary }]}>92%</Text>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <PieChart size={16} color="#34D399" strokeWidth={2.4} />
            <Text style={[styles.pillText, { color: theme.colors.textPrimary }]}>
              Category Discipline
            </Text>
          </View>
        </View>
      ),
    },
    {
      id: 'slide_3',
      badge: 'FINANCIAL PEACE',
      title: 'Stay in Control',
      subtitle: 'Insightful trends, private data, zero stress.',
      description:
        'Enjoy clear income vs expense trends, clean analytics, and encrypted local storage. Experience peace of mind with your money.',
      renderIllustration: () => (
        <View style={styles.illustrationCard}>
          <View
            style={[
              styles.illustrationBg,
              { backgroundColor: isDark ? '#163128' : '#E6F4EA' },
            ]}
          >
            <View style={styles.trendMockBox}>
              <View style={styles.trendBarsRow}>
                <View style={[styles.trendBar, { height: 40, backgroundColor: '#34D399' }]} />
                <View style={[styles.trendBar, { height: 65, backgroundColor: '#34D399' }]} />
                <View style={[styles.trendBar, { height: 50, backgroundColor: '#34D399' }]} />
                <View style={[styles.trendBar, { height: 85, backgroundColor: '#10B981' }]} />
                <View style={[styles.trendBar, { height: 105, backgroundColor: '#059669' }]} />
              </View>
            </View>
          </View>
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <ShieldCheck size={16} color="#10B981" strokeWidth={2.4} />
            <Text style={[styles.pillText, { color: theme.colors.textPrimary }]}>
              Private · Secure · Offline-Ready
            </Text>
          </View>
        </View>
      ),
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = async () => {
    haptics.selection();
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    haptics.success();
    await completeOnboarding();
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Top bar with Skip action */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.smallLogo, { backgroundColor: theme.colors.brandPrimary }]}>
            <Wallet size={16} color="#34D399" strokeWidth={2.4} />
          </View>
          <Text
            style={[
              styles.logoText,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              },
            ]}
          >
            Kharcho
          </Text>
        </View>

        {!isLast && (
          <Button
            title="Skip"
            onPress={handleFinish}
            variant="ghost"
            size="sm"
            style={styles.skipButton}
          />
        )}
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.illustrationWrapper}>
              {item.renderIllustration(isDark)}
            </View>

            <View style={styles.textContainer}>
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5',
                  },
                ]}
              >
                <Sparkles size={11} color={theme.colors.brandAccent} strokeWidth={2.4} />
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: theme.colors.brandAccent,
                      fontFamily: theme.typography.fontFamily.semiBold,
                    },
                  ]}
                >
                  {item.badge}
                </Text>
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
                {item.title}
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color: theme.colors.brandAccent,
                    fontFamily: theme.typography.fontFamily.medium,
                  },
                ]}
              >
                {item.subtitle}
              </Text>

              <Text
                style={[
                  styles.description,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.fontFamily.regular,
                  },
                ]}
              >
                {item.description}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex
                      ? theme.colors.brandAccent
                      : theme.colors.borderStrong,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <Button
          title={isLast ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  skipButton: {
    paddingHorizontal: 12,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  illustrationWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 280,
  },
  illustrationCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBg: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCenterIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetMockContainer: {
    width: 200,
    gap: 12,
  },
  mockBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mockBudgetText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  mockBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  mockBarFill: {
    height: 4,
    borderRadius: 2,
  },
  mockAmount: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendMockBox: {
    width: 180,
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  trendBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  trendBar: {
    width: 18,
    borderRadius: 6,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textContainer: {
    paddingVertical: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionBtn: {
    marginTop: 4,
  },
});
