import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Search, Settings } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { ProductCard } from '@/components/ProductCard';
import { Screen } from '@/components/Screen';
import { listProducts } from '@/db/products';
import { isLowStock, type Product } from '@/db/types';
import { colors, radius } from '@/lib/theme';

/**
 * Aba Estoque (tela inicial): lista os produtos com busca por nome/código, separando os que
 * precisam de reposição. Tocar num produto abre o modal /estoque?id=; a engrenagem abre /configuracoes.
 */
export default function EstoqueScreen() {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');

  // Recarrega ao voltar para a aba, para refletir vendas, entradas e edições feitas em outras telas.
  useFocusEffect(
    useCallback(() => {
      listProducts(db).then(setProducts);
    }, [db]),
  );

  // Filtra pela busca e divide em "precisa repor" (no/abaixo do mínimo) e "em estoque"; seções vazias somem.
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = products.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    );
    const low = matches.filter(isLowStock);
    const ok = matches.filter((p) => !isLowStock(p));
    return [
      { key: 'low', title: `PRECISA REPOR (${low.length})`, data: low },
      { key: 'ok', title: `EM ESTOQUE (${ok.length})`, data: ok },
    ].filter((s) => s.data.length > 0);
  }, [products, query]);

  const count = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <Screen
      scroll={false}
      title="Meu Estoque"
      subtitle={`${count} ${count === 1 ? 'produto' : 'produtos'} · ${totalUnits} ${totalUnits === 1 ? 'unidade' : 'unidades'}`}
      right={
        <IconButton
          accessibilityLabel="Configurações"
          onPress={() => router.push('/configuracoes')}
          icon={<Settings size={18} color={colors.text} />}
        />
      }>
      <View style={styles.search}>
        <Search size={18} color={colors.textSubtle} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar produto por nome ou ID..."
          placeholderTextColor={colors.textSubtle}
          style={styles.searchInput}
        />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.section, section.key === 'low' && { color: colors.danger }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push({ pathname: '/estoque', params: { id: String(item.id) } })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {count === 0
              ? 'Nenhum produto cadastrado.\nCadastre na aba Produtos.'
              : 'Nenhum produto encontrado.'}
          </Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  section: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 20, marginBottom: 10 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, lineHeight: 20 },
});
