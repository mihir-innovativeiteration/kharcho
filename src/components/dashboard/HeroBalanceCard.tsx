import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { formatINR } from '@/utils/currency';
import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp, Activity, Calendar } from 'lucide-react-native';

interface HeroBalanceCardProps {
  netActivity: number;
  income: number;
  expense: number;
  savingsRate?: number;
  periodLabel?: string;
  incomeChangePercentage?: number;
  expenseChangePercentage?: number;
}

export function HeroBalanceCard({
  netActivity,
  income,
  expense,
  savingsRate,
  periodLabel = 'This Month',
  incomeChangePercentage,
  expenseChangePercentage,
}: HeroBalanceCardProps) {
  const { t } = useTranslation();
  const isPositiveNet = netActivity >= 0;

  return (
    <Card variant="hero" padding="xl" style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.activityIconCircle}>
            <Activity size={16} color="#34D399" strokeWidth={2.4} />
          </View>
          <Text style={styles.headerLabel}>
            {t('dashboard.netActivity', 'Net Activity')}
          </Text>
        </View>

        <View style={styles.periodBadge}>
          <Calendar size={12} color="#34D399" strokeWidth={2} />
          <Text style={styles.periodText}>{periodLabel}</Text>
        </View>
      </View>

      {/* Main Net Activity Display */}
      <View style={styles.balanceSection}>
        <Text
          style={[
            styles.balanceAmount,
            { color: isPositiveNet ? '#FFFFFF' : '#FDA4AF' },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {isPositiveNet ? `+${formatINR(netActivity)}` : `-${formatINR(Math.abs(netActivity))}`}
        </Text>
        <Text style={styles.balanceSubtext}>
          {t('dashboard.netCashflowSubtext', 'Net financial activity for selected period')}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Income & Expense Flow Row */}
      <View style={styles.flowRow}>
        {/* Income Item */}
        <View style={styles.flowItem}>
          <View style={styles.flowLabelRow}>
            <View style={[styles.arrowCircle, { backgroundColor: 'rgba(52, 211, 153, 0.2)' }]}>
              <ArrowDownLeft size={13} color="#34D399" strokeWidth={2.5} />
            </View>
            <Text style={styles.flowLabel}>{t('transactions.income', 'Income')}</Text>
          </View>
          <Text style={[styles.flowValue, { color: '#34D399' }]} numberOfLines={1}>
            {formatINR(income)}
          </Text>
          {incomeChangePercentage !== undefined && incomeChangePercentage !== 0 && (
            <View style={styles.trendRow}>
              {incomeChangePercentage > 0 ? (
                <TrendingUp size={11} color="#34D399" />
              ) : (
                <TrendingDown size={11} color="#FB7185" />
              )}
              <Text
                style={[
                  styles.trendText,
                  { color: incomeChangePercentage > 0 ? '#34D399' : '#FB7185' },
                ]}
              >
                {incomeChangePercentage > 0 ? `+${incomeChangePercentage}%` : `${incomeChangePercentage}%`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.verticalDivider} />

        {/* Expense Item */}
        <View style={styles.flowItem}>
          <View style={styles.flowLabelRow}>
            <View style={[styles.arrowCircle, { backgroundColor: 'rgba(251, 113, 133, 0.2)' }]}>
              <ArrowUpRight size={13} color="#FB7185" strokeWidth={2.5} />
            </View>
            <Text style={styles.flowLabel}>{t('transactions.expense', 'Expenses')}</Text>
          </View>
          <Text style={[styles.flowValue, { color: '#FDA4AF' }]} numberOfLines={1}>
            {formatINR(expense)}
          </Text>
          {expenseChangePercentage !== undefined && expenseChangePercentage !== 0 && (
            <View style={styles.trendRow}>
              {expenseChangePercentage > 0 ? (
                <TrendingUp size={11} color="#FB7185" />
              ) : (
                <TrendingDown size={11} color="#34D399" />
              )}
              <Text
                style={[
                  styles.trendText,
                  { color: expenseChangePercentage > 0 ? '#FB7185' : '#34D399' },
                ]}
              >
                {expenseChangePercentage > 0 ? `+${expenseChangePercentage}%` : `${expenseChangePercentage}%`}
              </Text>
            </View>
          )}
        </View>

        {/* Savings Rate (if applicable) */}
        {savingsRate !== undefined && (
          <>
            <View style={styles.verticalDivider} />
            <View style={styles.flowItem}>
              <View style={styles.flowLabelRow}>
                <Text style={styles.flowLabel}>{t('dashboard.savedRate', 'Saved')}</Text>
              </View>
              <Text style={[styles.flowValue, { color: '#FFFFFF' }]}>
                {savingsRate.toFixed(0)}%
              </Text>
            </View>
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F382C', // Deep forest green
    borderColor: '#194E3E',
    borderWidth: 1,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1FAE5',
    letterSpacing: 0.2,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    gap: 5,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
  },
  balanceSection: {
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flowItem: {
    flex: 1,
  },
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  arrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  flowValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
});
