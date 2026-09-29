import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Bell, Plus, Search } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { ProductCard } from '@/components/ProductCard';
import { Screen } from '@/components/Screen';
import { listProducts } from '@/db/products';
import { isLowStock, type Product } from '@/db/types';
import { colors, radius } from '@/lib/theme';

export default function EstoqueScreen() {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listProducts(db).then(setProducts);
    }, [db]),
  );

  const hasLow = products.some(isLowStock);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!onlyLow || isLowStock(p)) &&
        (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
    );
  }, [products, query, onlyLow]);

  const count = products.length;

  return (
    <Screen
      scroll={false}
      title="Meu Estoque"
      subtitle={`${count} ${count === 1 ? 'item cadastrado' : 'itens cadastrados'}`}
      right={
        <View style={styles.actions}>
          <IconButton
            accessibilityLabel="Mostrar apenas estoque baixo"
            active={onlyLow}
            badge={hasLow && !onlyLow}
            onPress={() => setOnlyLow((v) => !v)}
            icon={<Bell size={18} color={onlyLow ? colors.primary : colors.text} />}
          />
          <IconButton
            accessibilityLabel="Cadastrar produto"
            onPress={() => router.push('/produto')}
            icon={<Plus size={18} color={colors.text} />}
          />
        </View>
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
      <Text style={styles.section}>{onlyLow ? 'ESTOQUE BAIXO' : 'LISTA DE PRODUTOS'}</Text>
      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push({ pathname: '/produto', params: { id: String(item.id) } })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {count === 0
              ? 'Nenhum produto cadastrado.\nToque em + para cadastrar o primeiro.'
              : 'Nenhum produto encontrado.'}
          </Text>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row' },
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
