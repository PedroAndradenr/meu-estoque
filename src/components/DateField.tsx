import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

/** Campo de data com rótulo, formatado em pt-BR. Usado na tela de relatório para o período. */
export function DateField({ label, value, onChange, minimumDate, maximumDate }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {/* iOS: seletor compacto embutido na tela. Android não tem versão inline: abre o diálogo
          nativo de forma imperativa ao tocar no campo. */}
      {Platform.OS === 'ios' ? (
        <RNDateTimePicker
          value={value}
          mode="date"
          display="compact"
          locale="pt-BR"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_, date) => onChange(date)}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            DateTimePickerAndroid.open({
              value,
              mode: 'date',
              minimumDate,
              maximumDate,
              onValueChange: (_, date) => onChange(date),
            })
          }
          style={styles.input}>
          <Calendar size={16} color={colors.textMuted} />
          <Text style={styles.value}>{formatDate(value)}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  value: { fontSize: 15, color: colors.text },
});
