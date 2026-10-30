import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../ui/Button';
import { MinusCircle, PlusCircle, Sparkles } from 'lucide-react-native';

export function QuickActions() {
  const router = useRouter();

  const handleSmartAdd = () => {
    router.push('/transaction/smart-add' as any);
  };

  const handleAddExpense = () => {
    router.push({
      pathname: '/transaction/new',
      params: { type: 'expense' },
    } as any);
  };

  const handleAddIncome = () => {
    router.push({
      pathname: '/transaction/new',
      params: { type: 'income' },
    } as any);
  };

  return (
    <View style={styles.wrapper}>
      {/* AI Natural Language Quick Add */}
      <Button
        title="✨ AI Smart Add (English, ગુજરાતી, हिंदी)"
        onPress={handleSmartAdd}
        variant="outline"
        size="md"
        leftIcon={<Sparkles size={16} color="#3B82F6" strokeWidth={2.2} />}
        style={styles.smartAddBtn}
        textStyle={{ fontWeight: '600', fontSize: 13 }}
      />

      {/* Manual Add Buttons */}
      <View style={styles.container}>
        <Button
          title="Add Expense"
          onPress={handleAddExpense}
          variant="primary"
          size="md"
          leftIcon={<MinusCircle size={17} color="#FFFFFF" strokeWidth={2.4} />}
          style={styles.actionBtn}
        />

        <Button
          title="Add Income"
          onPress={handleAddIncome}
          variant="secondary"
          size="md"
          leftIcon={<PlusCircle size={17} color="#10B981" strokeWidth={2.4} />}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
    gap: 8,
  },
  smartAddBtn: {
    width: '100%',
    borderWidth: 1.5,
  },
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
});
