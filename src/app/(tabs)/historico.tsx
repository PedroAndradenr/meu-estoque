import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Archive, FileText, ShoppingBag } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { MovementDetailModal } from '@/components/MovementDetailModal';
import { Screen } from '@/components/Screen';
import { listMovements } from '@/db/movements';
import { PAYMENT_LABEL, type Movement } from '@/db/types';
import { dayKey, formatDayLabel, formatTime } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

type DaySection = { key: string; title: string; data: Movement[] };

/** Agrupa as movimentações (já ordenadas da mais recente) em uma seção por dia do calendário. */
function groupByDay(movements: Movement[]): DaySection[] {
  const sections: DaySection[] = [];
  for (const m of movements) {
    const key = dayKey(m.created_at);
    const last = sections[sections.length - 1];
    if (last?.key === key) last.data.push(m);
    else sections.push({ key, title: formatDayLabel(m.created_at), data: [m] });
  }
  return sections;
}

/**
 * Aba Histórico: saídas agrupadas por dia. Tocar numa linha abre o detalhe da movimentação;
 * o ícone de documento abre a tela /relatorio para gerar o PDF.
 */
export default function HistoricoScreen() {
  const db = useSQLiteContext();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selected, setSelected] = useState<Movement | null>(null);

  // Recarrega ao focar a aba para incluir saídas recém-registradas.
  useFocusEffect(
    useCallback(() => {
      listMovements(db).then(setMovements);
    }, [db]),
  );

  const sections = useMemo(() => groupByDay(movements), [movements]);

  return (
    <Screen
      scroll={false}
      title="Histórico"
      subtitle="Registro de saídas recentes"
      right={
        <IconButton
          accessibilityLabel="Gerar relatório em PDF"
          onPress={() => router.push('/relatorio')}
          icon={<FileText size={18} color={colors.text} />}
        />
      }>
      <SectionList
        sections={sections}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({ item }) => <MovementRow movement={item} onPress={() => setSelected(item)} />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma saída registrada ainda.</Text>}
      />
      <MovementDetailModal movement={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

/** Linha de uma movimentação: produto, horário, motivo (venda + pagamento ou uso) e quantidade. */
function MovementRow({ movement, onPress }: { movement: Movement; onPress: () => void }) {
  const isSale = movement.type === 'venda';
  const Icon = isSale ? ShoppingBag : Archive;
  const reason = isSale
    ? `Venda${movement.payment_method ? ` · ${PAYMENT_LABEL[movement.payment_method]}` : ''}`
    : 'Uso Interno';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.icon, isSale ? styles.iconSale : styles.iconUse]}>
        <Icon size={18} color={isSale ? colors.primary : colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {movement.product_name}
        </Text>
        <Text style={styles.meta}>
          {formatTime(movement.created_at)} •{' '}
          <Text style={isSale ? styles.reasonSale : styles.reasonUse}>{reason}</Text>
        </Text>
      </View>
      <Text style={styles.qty}>
        -{movement.quantity} <Text style={styles.unit}>un</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 8, marginBottom: 10 },
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
