import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius } from '@/lib/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
};

export function Button({ label, onPress, disabled, variant = 'primary' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'danger' ? styles.danger : styles.primary,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, variant === 'danger' && styles.dangerLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.dangerSoft },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
  dangerLabel: { color: colors.danger },
});
