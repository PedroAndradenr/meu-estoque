import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronRight, FileText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { getCardFees, saveCardFees } from '@/db/settings';
import { calculateFee } from '@/db/types';
import { formatMoney, parsePercent, percentToInput } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

const EXAMPLE_SALE = 10_000; // R$ 100,00

/**
 * Modal de configurações (engrenagem da aba Estoque): define as taxas da maquininha de débito e
 * crédito e dá acesso ao relatório de vendas em PDF.
 */
export default function ConfiguracoesScreen() {
  const db = useSQLiteContext();
  const [debito, setDebito] = useState('');
  const [credito, setCredito] = useState('');

  useEffect(() => {
    getCardFees(db).then((fees) => {
      setDebito(percentToInput(fees.debito));
      setCredito(percentToInput(fees.credito));
    });
  }, [db]);

  const debitoRate = parsePercent(debito);
  const creditoRate = parsePercent(credito);

  async function handleSave() {
    if (debitoRate === null || creditoRate === null) {
      return Alert.alert('Taxa inválida', 'Use um número entre 0 e 100, por exemplo 1,99.');
    }
    await saveCardFees(db, { debito: debitoRate, credito: creditoRate });
    router.back();
  }

  /** Texto de ajuda do campo: mostra quanto o vendedor recebe numa venda de exemplo com a taxa digitada. */
  function example(rate: number | null) {
    if (rate === null) return 'Informe um número entre 0 e 100.';
    const fee = calculateFee(EXAMPLE_SALE, rate);
    return `Numa venda de ${formatMoney(EXAMPLE_SALE)}, você recebe ${formatMoney(EXAMPLE_SALE - fee)}.`;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Define o título do cabeçalho do modal a partir da própria tela. */}
      <Stack.Screen options={{ title: 'Configurações' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Taxas da maquininha</Text>
        <Text style={styles.sectionHint}>
          Descontadas do lucro nas vendas no débito e no crédito. Mudar a taxa não altera vendas já registradas.
        </Text>
        <TextField
          label="Débito (%)"
          value={debito}
          onChangeText={setDebito}
          placeholder="0,00"
          keyboardType="decimal-pad"
          hint={example(debitoRate)}
        />
        <TextField
          label="Crédito (%)"
          value={credito}
          onChangeText={setCredito}
          placeholder="0,00"
          keyboardType="decimal-pad"
          hint={example(creditoRate)}
        />
        <Button label="Salvar taxas" onPress={handleSave} />

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Relatórios</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/relatorio')}
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}>
          <View style={styles.linkIcon}>
            <FileText size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Relatório de vendas em PDF</Text>
            <Text style={styles.linkHint}>Vendas, taxas, lucro e retiradas de um período</Text>
          </View>
          <ChevronRight size={18} color={colors.textSubtle} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionHint: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 12,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  linkHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
