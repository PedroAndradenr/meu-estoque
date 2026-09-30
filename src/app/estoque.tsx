import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Archive, Info, PackagePlus, Pencil } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { registerExit } from '@/db/movements';
import { addStock, getProduct, setMinStock } from '@/db/products';
import { isLowStock, type Product } from '@/db/types';
import { formatMoney } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

const QUICK_AMOUNTS = [1, 5, 10, 20];

type Mode = 'entrada' | 'retirada';

/** Converte o texto em inteiro não negativo; retorna null se não for só dígitos. */
function parseCount(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? parseInt(value, 10) : null;
}

/**
 * Modal de estoque de um produto (/estoque?id=, aberto pela aba Estoque): adiciona unidades que
 * chegaram ou retira unidades sem venda (gravado como movimentação 'uso') e define o alerta de
 * estoque baixo.
 */
export default function EstoqueProdutoScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [mode, setMode] = useState<Mode>('entrada');
  const [amount, setAmount] = useState('');
  const [minStock, setMinStockInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Recarrega ao focar para que edições feitas na tela do produto apareçam ao voltar.
  useFocusEffect(
    useCallback(() => {
      getProduct(db, productId).then((p) => {
        setProduct(p);
        if (p) setMinStockInput(String(p.min_stock));
      });
    }, [db, productId]),
  );

  if (!product) return null;

  const isEntry = mode === 'entrada';
  const count = parseCount(amount) ?? 0;
  const minStockValue = parseCount(minStock);
  const resulting = isEntry ? product.stock + count : product.stock - count;
  // Não é possível retirar mais do que há em estoque.
  const exceedsStock = !isEntry && count > product.stock;
  const canSubmit = count > 0 && !exceedsStock && minStockValue !== null && !saving;

  /** Aplica a entrada ou retirada, salva o alerta se mudou e fecha o modal. */
  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      if (isEntry) await addStock(db, productId, count);
      // Retirada passa por registerExit para ficar no Histórico e baixar o estoque na mesma transação.
      else await registerExit(db, { productId, type: 'uso', quantity: count, paymentMethod: null });
      if (minStockValue !== product!.min_stock) await setMinStock(db, productId, minStockValue!);
      router.back();
    } catch (e) {
      Alert.alert('Não foi possível atualizar o estoque', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  /** Salva o alerta de estoque baixo ao sair do campo, sem precisar tocar no botão. */
  async function saveMinStock() {
    if (minStockValue === null || minStockValue === product!.min_stock) return;
    await setMinStock(db, productId, minStockValue);
    setProduct({ ...product!, min_stock: minStockValue });
  }

  const low = isLowStock(product);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Define o título do cabeçalho do modal a partir da própria tela. */}
      <Stack.Screen options={{ title: 'Estoque do Produto' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.summary, low && styles.summaryLow]}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{product.name}</Text>
              {product.code ? <Text style={styles.code}>Cód: {product.code}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar dados do produto"
              hitSlop={10}
              onPress={() => router.push({ pathname: '/produto', params: { id: String(product.id) } })}
              style={styles.edit}>
              <Pencil size={14} color={colors.primary} />
              <Text style={styles.editText}>Editar</Text>
            </Pressable>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryBottom}>
            <View>
              <Text style={styles.caption}>EM ESTOQUE</Text>
              <Text style={[styles.stock, low && { color: colors.danger }]}>
                {product.stock} <Text style={styles.unit}>unidades</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceLine}>Custo {formatMoney(product.cost)}</Text>
              <Text style={styles.priceLine}>Venda {formatMoney(product.price)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Movimentar estoque</Text>
        <View style={{ marginBottom: 16 }}>
          <SegmentedControl<Mode>
            value={mode}
            onChange={(m) => {
              setMode(m);
              setAmount('');
            }}
            options={[
              { value: 'entrada', label: 'Adicionar', icon: (c) => <PackagePlus size={16} color={c} /> },
              { value: 'retirada', label: 'Retirar', icon: (c) => <Archive size={16} color={c} /> },
            ]}
          />
        </View>
        <TextField
          label={isEntry ? 'Quantidade que chegou' : 'Quantidade a retirar'}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          keyboardType="number-pad"
          hint={isEntry ? undefined : 'Sem venda: fica no Histórico como Uso Interno.'}
        />
        <View style={styles.chips}>
          {QUICK_AMOUNTS.map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              onPress={() => setAmount(String(count + n))}
              style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
              <Text style={styles.chipText}>+{n}</Text>
            </Pressable>
          ))}
        </View>

        {count > 0 ? (
          <View style={[styles.info, exceedsStock && styles.infoDanger]}>
            <Info size={16} color={exceedsStock ? colors.danger : colors.primaryText} />
            <Text style={[styles.infoText, exceedsStock && { color: colors.danger }]}>
              {exceedsStock ? (
                `Só há ${product.stock} ${product.stock === 1 ? 'unidade' : 'unidades'} em estoque.`
              ) : (
                <>
                  Estoque após a {isEntry ? 'entrada' : 'retirada'}:{' '}
                  <Text style={styles.infoStrong}>{resulting} unidades</Text>
                </>
              )}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <Button
            label={isEntry ? 'Adicionar ao estoque' : 'Retirar do estoque'}
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>

        <Text style={styles.sectionTitle}>Alerta de estoque baixo</Text>
        <TextField
          label="Avisar quando tiver até (unidades)"
          value={minStock}
          onChangeText={setMinStockInput}
          onEndEditing={saveMinStock}
          keyboardType="number-pad"
          hint={minStockValue === null ? 'Informe um número válido.' : 'O produto aparece em "Precisa repor" no Estoque.'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  summaryLow: { borderColor: colors.dangerBorder },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  code: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  edit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  editText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  summaryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  caption: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: colors.textSubtle },
  stock: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 2 },
  unit: { fontSize: 14, fontWeight: '400', color: colors.textMuted },
  priceLine: { fontSize: 13, color: colors.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 28, marginBottom: 14 },
  chips: { flexDirection: 'row', gap: 8, marginTop: -4 },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  info: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 16,
  },
  infoDanger: { backgroundColor: colors.dangerSoft },
  infoText: { flex: 1, fontSize: 13, color: colors.primaryText },
  infoStrong: { fontWeight: '700' },
});
