import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Archive, Info, ShoppingBag } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProductPicker } from '@/components/ProductPicker';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { registerExit } from '@/db/movements';
import { listProducts } from '@/db/products';
import { getCardFees } from '@/db/settings';
import {
  calculateFee,
  feeRateFor,
  PAYMENT_METHODS,
  type CardFees,
  type MovementType,
  type PaymentMethod,
  type Product,
} from '@/db/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

/**
 * Aba Registrar: dá baixa no estoque de um produto, como venda (com forma de pagamento) ou
 * uso/avulsa. Mostra o estoque restante e a taxa da maquininha; após salvar, vai para o Histórico.
 */
export default function RegistrarScreen() {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [type, setType] = useState<MovementType>('venda');
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState<CardFees>({ debito: 0, credito: 0 });

  const reload = useCallback(async () => {
    const [list, cardFees] = await Promise.all([listProducts(db), getCardFees(db)]);
    setProducts(list);
    setFees(cardFees);
  }, [db]);
  // Recarrega ao focar a aba: o estoque pode ter mudado e as taxas podem ter sido editadas.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const selected = products.find((p) => p.id === selectedId) ?? null;
  const remaining = selected ? selected.stock - quantity : 0;
  const total = selected ? selected.price * quantity : 0;
  // Prévia da taxa: só crédito/débito têm taxa; uso/avulsa nunca tem. O valor definitivo é gravado
  // na movimentação por registerExit.
  const feeRate = type === 'venda' ? feeRateFor(fees, payment) : 0;
  const fee = calculateFee(total, feeRate);
  // remaining >= 0 impede retirar mais do que há em estoque; venda exige forma de pagamento.
  const canSubmit =
    !!selected && quantity >= 1 && remaining >= 0 && (type === 'uso' || payment !== null) && !saving;

  /** Registra a saída, limpa quantidade/pagamento e leva o usuário ao Histórico. */
  async function handleSubmit() {
    if (!selected || !canSubmit) return;
    setSaving(true);
    try {
      await registerExit(db, { productId: selected.id, type, quantity, paymentMethod: payment });
      setQuantity(1);
      setPayment(null);
      await reload();
      router.navigate('/historico');
    } catch (e) {
      Alert.alert('Não foi possível registrar', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Registrar Saída" subtitle="Dê baixa em itens do estoque">
      <Text style={styles.label}>Selecionar Produto</Text>
      <ProductPicker
        products={products}
        selected={selected}
        onSelect={(p) => {
          setSelectedId(p.id);
          // Nova seleção de produto volta a quantidade para 1 (o máximo depende do estoque dele).
          setQuantity(1);
        }}
      />

      <Text style={styles.label}>Motivo da Saída</Text>
      <SegmentedControl<MovementType>
        value={type}
        onChange={setType}
        options={[
          { value: 'venda', label: 'Venda', icon: (c) => <ShoppingBag size={16} color={c} /> },
          { value: 'uso', label: 'Uso / Avulsa', icon: (c) => <Archive size={16} color={c} /> },
        ]}
      />

      {type === 'venda' ? (
        <>
          <Text style={styles.label}>Forma de Pagamento</Text>
          <View style={styles.chips}>
            {PAYMENT_METHODS.map((m) => {
              const active = payment === m.value;
              return (
                <Pressable
                  key={m.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setPayment(m.value)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={{ marginTop: 20 }}>
        <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(selected?.stock ?? 1, 1)} />
      </View>

      {selected ? (
        <View style={styles.info}>
          <Info size={16} color={colors.primaryText} />
          <Text style={styles.infoText}>
            Estoque restante após a baixa: <Text style={styles.infoStrong}>{remaining} unidades</Text>
            {type === 'venda' ? (
              <>
                {'\n'}Total da venda: <Text style={styles.infoStrong}>{formatMoney(total)}</Text>
                {feeRate > 0 ? (
                  <>
                    {'\n'}Taxa da maquininha ({formatPercent(feeRate)}):{' '}
                    <Text style={styles.infoStrong}>- {formatMoney(fee)}</Text>
                    {'\n'}Você recebe: <Text style={styles.infoStrong}>{formatMoney(total - fee)}</Text>
                  </>
                ) : null}
              </>
            ) : null}
          </Text>
        </View>
      ) : null}

      <View style={{ marginTop: 16 }}>
        <Button label="Registrar Saída" onPress={handleSubmit} disabled={!canSubmit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginTop: 20, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  info: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.primaryText, lineHeight: 20 },
  infoStrong: { fontWeight: '700' },
});
