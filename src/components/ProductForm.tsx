import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import type { ProductInput } from '@/db/types';
import { centsToInput, formatMoney, parseMoney } from '@/lib/format';
import { colors } from '@/lib/theme';

import { Button } from './Button';
import { TextField } from './TextField';

type Props = {
  /** Valores iniciais ao editar; omitido ao cadastrar um novo produto. */
  initial?: ProductInput;
  submitLabel: string;
  /** Recebe os dados já validados (valores em centavos); o botão fica desabilitado até resolver. */
  onSubmit: (input: ProductInput) => Promise<void>;
};

/**
 * Formulário de catálogo: nome, código, custo e preço de venda (não mexe no estoque).
 * Usado em Produtos (cadastro) e na tela de edição de produto.
 * O estado só é lido de `initial` na montagem; para limpar os campos, remonte trocando a `key`.
 */
export function ProductForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [cost, setCost] = useState(initial ? centsToInput(initial.cost) : '');
  const [price, setPrice] = useState(initial ? centsToInput(initial.price) : '');
  const [saving, setSaving] = useState(false);

  const costCents = parseMoney(cost);
  const priceCents = parseMoney(price);
  // Prévia do lucro por unidade, exibida só quando os dois valores são válidos.
  const profit = costCents !== null && priceCents !== null ? priceCents - costCents : null;

  async function handleSubmit() {
    if (!name.trim()) return Alert.alert('Informe o nome do produto.');
    if (costCents === null) return Alert.alert('Custo inválido.');
    if (priceCents === null) return Alert.alert('Valor de venda inválido.');
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), code: code.trim(), cost: costCents, price: priceCents });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <TextField label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Bolo de pote" />
      <TextField
        label="Código / ID (opcional)"
        value={code}
        onChangeText={setCode}
        placeholder="Ex.: BP-001"
        autoCapitalize="characters"
      />
      <View style={styles.row}>
        <View style={styles.col}>
          <TextField label="Custo (R$)" value={cost} onChangeText={setCost} placeholder="0,00" keyboardType="decimal-pad" />
        </View>
        <View style={styles.col}>
          <TextField
            label="Valor de venda (R$)"
            value={price}
            onChangeText={setPrice}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      {profit !== null ? (
        <Text style={[styles.profit, profit < 0 && { color: colors.danger }]}>
          Lucro por unidade: {formatMoney(profit)}
        </Text>
      ) : null}
      <Button label={submitLabel} onPress={handleSubmit} disabled={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  profit: { fontSize: 13, color: colors.primaryText, fontWeight: '600', marginTop: -6, marginBottom: 16 },
});
