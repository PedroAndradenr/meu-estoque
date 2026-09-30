import { X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PAYMENT_LABEL, type Movement } from '@/db/types';
import { formatDateTime, formatMoney, formatPercent } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

type Props = {
  /** Movimentação a exibir; null mantém o modal fechado. */
  movement: Movement | null;
  onClose: () => void;
};

/**
 * Folha inferior com os detalhes de uma movimentação (venda ou uso interno), incluindo custo,
 * taxa e lucro. Aberta ao tocar num item do Histórico; tocar fora fecha.
 */
export function MovementDetailModal({ movement, onClose }: Props) {
  // O Modal fica fora da SafeAreaView da tela, então o recuo inferior é aplicado manualmente.
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={movement !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar">
        {movement ? (
          // Pressable interno "engole" os toques na folha para não fecharem o modal pelo fundo.
          <Pressable style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} onPress={() => {}}>
            <Details movement={movement} onClose={onClose} />
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

/** Conteúdo da folha; separado para só renderizar quando há uma movimentação. */
function Details({ movement, onClose }: { movement: Movement; onClose: () => void }) {
  const isSale = movement.type === 'venda';
  const totalCost = movement.unit_cost * movement.quantity;
  const revenue = movement.unit_price * movement.quantity;
  // Usa os valores gravados na movimentação (snapshot), não os atuais do produto.
  // Lucro = receita - custo - taxa da maquininha; margem em % sobre a receita.
  const profit = revenue - totalCost - movement.fee;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  return (
    <>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {movement.product_name}
          </Text>
          <Text style={styles.subtitle}>{formatDateTime(movement.created_at)}</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Fechar">
          <X size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Row label="Motivo" value={isSale ? 'Venda' : 'Uso Interno'} />
        {isSale && movement.payment_method ? (
          <Row label="Pagamento" value={PAYMENT_LABEL[movement.payment_method]} />
        ) : null}
        <Row label="Quantidade" value={`${movement.quantity} un`} />
        {isSale ? <Row label="Preço unitário" value={formatMoney(movement.unit_price)} /> : null}
        <Row label="Custo unitário" value={formatMoney(movement.unit_cost)} />
      </View>

      <View style={styles.card}>
        {isSale ? <Row label="Valor da venda" value={formatMoney(revenue)} /> : null}
        <Row label={isSale ? 'Custo' : 'Custo da saída'} value={formatMoney(totalCost)} />
        {movement.fee > 0 ? (
          <Row label={`Taxa da maquininha (${formatPercent(movement.fee_rate)})`} value={formatMoney(movement.fee)} />
        ) : null}
      </View>

      {isSale ? (
        <View style={[styles.profit, profit < 0 && styles.loss]}>
          <Text style={[styles.profitLabel, profit < 0 && styles.lossText]}>{profit < 0 ? 'Prejuízo' : 'Lucro'}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.profitValue, profit < 0 && styles.lossText]}>{formatMoney(profit)}</Text>
            <Text style={[styles.profitMargin, profit < 0 && styles.lossText]}>Margem de {margin}%</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.note}>Saídas de uso interno não geram receita.</Text>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  profit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 16,
  },
  loss: { backgroundColor: colors.dangerSoft },
  profitLabel: { fontSize: 16, fontWeight: '600', color: colors.primaryText },
  profitValue: { fontSize: 22, fontWeight: '700', color: colors.primaryText },
  profitMargin: { fontSize: 12, color: colors.primaryText, marginTop: 2 },
  lossText: { color: colors.danger },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
