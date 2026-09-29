import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Archive, ShoppingBag } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { listMovements } from '@/db/movements';
import { PAYMENT_LABEL, type Movement } from '@/db/types';
import { formatRelativeDate } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

export default function HistoricoScreen() {
  const db = useSQLiteContext();
  const [movements, setMovements] = useState<Movement[]>([]);

  useFocusEffect(
    useCallback(() => {
      listMovements(db).then(setMovements);
    }, [db]),
  );

  return (
    <Screen scroll={false} title="Histórico" subtitle="Registro de saídas recentes">
      <FlatList
        data={movements}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => <MovementRow movement={item} />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma saída registrada ainda.</Text>}
      />
    </Screen>
  );
}

function MovementRow({ movement }: { movement: Movement }) {
  const isSale = movement.type === 'venda';
  const Icon = isSale ? ShoppingBag : Archive;
  const reason = isSale
    ? `Venda${movement.payment_method ? ` · ${PAYMENT_LABEL[movement.payment_method]}` : ''}`
    : 'Uso Interno';

  return (
    <View style={styles.row}>
      <View style={[styles.icon, isSale ? styles.iconSale : styles.iconUse]}>
        <Icon size={18} color={isSale ? colors.primary : colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {movement.product_name}
        </Text>
        <Text style={styles.meta}>
          {formatRelativeDate(movement.created_at)} •{' '}
          <Text style={isSale ? styles.reasonSale : styles.reasonUse}>{reason}</Text>
        </Text>
      </View>
      <Text style={styles.qty}>
        -{movement.quantity} <Text style={styles.unit}>un</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconSale: { backgroundColor: colors.primarySoft },
  iconUse: { backgroundColor: colors.neutralSoft },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { fontSize: 11, color: colors.textSubtle, marginTop: 3 },
  reasonSale: { color: colors.primaryText, fontWeight: '600' },
  reasonUse: { color: colors.text, fontWeight: '500' },
  qty: { fontSize: 16, fontWeight: '700', color: colors.danger },
  unit: { fontSize: 11, fontWeight: '400', color: colors.textSubtle },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
