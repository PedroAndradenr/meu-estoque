import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductForm } from '@/components/ProductForm';
import { Screen } from '@/components/Screen';
import { createProduct, listProducts } from '@/db/products';
import type { Product } from '@/db/types';
import { formatMoney } from '@/lib/format';
import { colors, radius } from '@/lib/theme';

/**
 * Aba Produtos: formulário para cadastrar um produto novo e lista dos já cadastrados com o lucro
 * unitário. Tocar num item abre o modal /produto?id= para editar ou excluir.
 */
export default function ProdutosScreen() {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<Product[]>([]);
  // Incrementado a cada cadastro para remontar (e assim limpar) o formulário.
  const [formKey, setFormKey] = useState(0);

  const reload = useCallback(() => listProducts(db).then(setProducts), [db]);
  // Recarrega ao voltar para a aba, pois o produto pode ter sido editado ou excluído no modal.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <Screen title="Produtos" subtitle="Cadastre o que você vende">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Novo produto</Text>
        <ProductForm
          key={formKey}
          submitLabel="Adicionar produto"
          onSubmit={async (input) => {
            await createProduct(db, input);
            setFormKey((k) => k + 1);
            await reload();
          }}
        />
      </View>

      <Text style={styles.section}>PRODUTOS CADASTRADOS ({products.length})</Text>
      {products.length === 0 ? (
        <Text style={styles.empty}>Nenhum produto cadastrado ainda.</Text>
      ) : (
        products.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/produto', params: { id: String(p.id) } })}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.meta}>
                Custo {formatMoney(p.cost)} · Venda {formatMoney(p.price)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.profitLabel}>Lucro</Text>
              <Text style={[styles.profit, p.price - p.cost < 0 && { color: colors.danger }]}>
                {formatMoney(p.price - p.cost)}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSubtle} />
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
  section: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 24, marginBottom: 10 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  profitLabel: { fontSize: 11, color: colors.textSubtle },
  profit: { fontSize: 14, fontWeight: '700', color: colors.primaryText },
});
