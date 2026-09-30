import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { ProductForm } from '@/components/ProductForm';
import { deleteProduct, getProduct, updateProduct } from '@/db/products';
import type { Product } from '@/db/types';

/**
 * Modal de edição de produto (/produto?id=, aberto pela aba Produtos ou pelo modal de estoque):
 * altera os dados de catálogo (nome, código, custo, preço) ou exclui o produto. Estoque não é editado aqui.
 */
export default function ProdutoScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    getProduct(db, productId).then(setProduct);
  }, [db, productId]);

  function handleDelete() {
    Alert.alert('Excluir produto', 'O histórico de saídas deste produto também será removido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(db, productId);
          // Fecha todos os modais (inclusive o de estoque, se aberto), pois o produto não existe mais.
          router.dismissAll();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Define o título do cabeçalho do modal a partir da própria tela. */}
      <Stack.Screen options={{ title: 'Editar Produto' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {product ? (
          <>
            <ProductForm
              initial={product}
              submitLabel="Salvar"
              onSubmit={async (input) => {
                await updateProduct(db, productId, input);
                router.back();
              }}
            />
            <View style={{ marginTop: 12 }}>
              <Button label="Excluir produto" variant="danger" onPress={handleDelete} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
});
