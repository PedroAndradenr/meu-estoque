import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius } from '@/lib/theme';

/** Aceita todas as props de `TextInput`; `hint` é um texto de ajuda exibido abaixo do campo. */
type Props = TextInputProps & { label: string; hint?: string };

/** Campo de texto com rótulo e dica opcional. Usado em ProductForm, Configurações e Estoque. */
export function TextField({ label, hint, style, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textSubtle} style={[styles.input, style]} {...inputProps} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
});
