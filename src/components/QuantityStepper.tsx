import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/lib/theme';

type Props = {
  value: number;
  onChange: (value: number) => void;
  /** Quantidade mínima; padrão 1. */
  min?: number;
  /** Limite superior, normalmente o estoque disponível do produto. */
  max: number;
};

/** Contador com botões -/+ para escolher a quantidade de uma saída. Usado em Registrar. */
export function QuantityStepper({ value, onChange, min = 1, max }: Props) {
  const canDecrement = value > min;
  const canIncrement = value < max;
  return (
    <View style={styles.card}>
      <Text style={styles.caption}>QUANTIDADE A RETIRAR</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Diminuir quantidade"
          disabled={!canDecrement}
          onPress={() => onChange(value - 1)}
          style={[styles.button, styles.minus, !canDecrement && styles.disabled]}>
          <Minus size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          accessibilityLabel="Aumentar quantidade"
          disabled={!canIncrement}
          onPress={() => onChange(value + 1)}
          style={[styles.button, styles.plus, !canIncrement && styles.disabled]}>
          <Plus size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  caption: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: colors.textSubtle },
  row: { flexDirection: 'row', alignItems: 'center', gap: 40, marginTop: 12 },
  button: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  minus: { backgroundColor: colors.neutralSoft },
  plus: { backgroundColor: colors.primarySoft },
  disabled: { opacity: 0.4 },
  value: { fontSize: 30, fontWeight: '700', color: colors.text, minWidth: 40, textAlign: 'center' },
});
