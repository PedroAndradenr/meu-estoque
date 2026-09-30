import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/lib/theme';

type Props = {
  icon: ReactNode;
  onPress: () => void;
  /** Obrigatório: o botão só tem ícone, então é o único texto para leitores de tela. */
  accessibilityLabel: string;
};

/** Botão quadrado só com ícone, usado nas ações do cabeçalho de `Screen` (Estoque, Histórico). */
export function IconButton({ icon, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
