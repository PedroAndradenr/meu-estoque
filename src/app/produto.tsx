import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { createProduct, deleteProduct, getProduct, updateProduct } from '@/db/products';
import { centsToInput, formatMoney, parseMoney } from '@/lib/format';
import { colors } from '@/lib/theme';

function parseIntField(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? parseInt(value, 10) : null;
}

export default function ProdutoScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const productId = id ? Number(id) : null;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('3');

  useEffect(() => {
    if (productId === null) return;
    getProduct(db, productId).then((p) => {
      if (!p) return;
      setName(p.name);
      setCode(p.code);
      setPrice(centsToInput(p.price));
      setCost(centsToInput(p.cost));
      setStock(String(p.stock));
      setMinStock(String(p.min_stock));
    });
  }, [db, productId]);

  const priceCents = parseMoney(price);
  const costCents = parseMoney(cost);
  const margin = priceCents !== null && costCents !== null ? priceCents - costCents : null;

  async function handleSave() {
    const stockValue = parseIntField(stock);
    const minStockValue = parseIntField(minStock);
    if (!name.trim()) return Alert.alert('Informe o nome do produto.');
    if (priceCents === null) return Alert.alert('Preço de venda inválido.');
    if (costCents === null) return Alert.alert('Custo inválido.');
    if (stockValue === null) return Alert.alert('Quantidade em estoque inválida.');
    if (minStockValue === null) return Alert.alert('Estoque mínimo inválido.');

    const input = {
      name: name.trim(),
      code: code.trim(),
      price: priceCents,
      cost: costCents,
      stock: stockValue,
      min_stock: minStockValue,
    };
    if (productId === null) await createProduct(db, input);
    else await updateProduct(db, productId, input);
    router.back();
  }

  function handleDelete() {
    if (productId === null) return;
    Alert.alert('Excluir produto', 'O histórico de saídas deste produto também será removido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(db, productId);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: productId === null ? 'Novo Produto' : 'Editar Produto' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Tênis Street Runner" />
        <TextField
          label="Código / ID"
          value={code}
          onChangeText={setCode}
          placeholder="Ex.: TN-5040"
          autoCapitalize="characters"
        />
        <View style={styles.row}>
          <View style={styles.col}>
            <TextField label="Preço de venda (R$)" value={price} onChangeText={setPrice} placeholder="0,00" keyboardType="decimal-pad" />
          </View>
          <View style={styles.col}>
            <TextField label="Custo (R$)" value={cost} onChangeText={setCost} placeholder="0,00" keyboardType="decimal-pad" />
          </View>
        </View>
        {margin !== null ? (
          <Text style={[styles.margin, margin < 0 && { color: colors.danger }]}>
            Lucro por unidade: {formatMoney(margin)}
          </Text>
        ) : null}
        <View style={styles.row}>
          <View style={styles.col}>
            <TextField label="Estoque atual" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
          </View>
          <View style={styles.col}>
            <TextField
              label="Estoque mínimo"
              value={minStock}
              onChangeText={setMinStock}
              keyboardType="number-pad"
              hint="Alerta de estoque baixo"
            />
          </View>
        </View>

        <View style={{ gap: 12, marginTop: 8 }}>
          <Button label="Salvar" onPress={handleSave} />
          {productId !== null ? <Button label="Excluir produto" variant="danger" onPress={handleDelete} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  margin: { fontSize: 13, color: colors.primaryText, fontWeight: '600', marginTop: -6, marginBottom: 16 },
});
