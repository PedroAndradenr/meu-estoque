import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/lib/theme';

type Props = {
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  badge?: boolean;
};

export function IconButton({ icon, onPress, accessibilityLabel, active, badge }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, active && styles.active, pressed && { opacity: 0.7 }]}>
      {icon}
      {badge ? <View style={styles.badge} /> : null}
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
  active: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  badge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
});
