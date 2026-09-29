import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isLowStock, type Product } from '@/db/types';
import { formatMoney } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

type Props = { product: Product; onPress: () => void };

export function ProductCard({ product, onPress }: Props) {
  const low = isLowStock(product);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, low && styles.cardLow, pressed && { opacity: 0.8 }]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          {product.code ? <Text style={styles.code}>Cód: {product.code}</Text> : null}
        </View>
        {low ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ESTOQUE BAIXO</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.divider} />
      <View style={styles.bottom}>
        <Text style={styles.units}>
          <Text style={[styles.stock, low && { color: colors.danger }]}>{product.stock}</Text> unidades
        </Text>
        <Text style={styles.priceLabel}>
          Preço: <Text style={styles.price}>{formatMoney(product.price)}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardLow: { borderColor: colors.dangerBorder },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  code: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  badge: { backgroundColor: colors.dangerSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.danger },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  bottom: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  units: { fontSize: 13, color: colors.textMuted },
  stock: { fontSize: 20, fontWeight: '700', color: colors.text },
  priceLabel: { fontSize: 12, color: colors.textSubtle },
  price: { fontSize: 14, fontWeight: '600', color: colors.text },
});
