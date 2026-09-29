import { ChevronDown, Tag, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isLowStock, type Product } from '@/db/types';
import { colors, radius } from '@/lib/theme';

type Props = {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
};

function availability(p: Product) {
  return `Disponível: ${p.stock} un${isLowStock(p) ? ' (Baixo)' : ''}`;
}

export function ProductPicker({ products, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.trigger, selected && styles.triggerActive]}>
        <View style={[styles.icon, selected && isLowStock(selected) && styles.iconLow]}>
          <Tag size={16} color={selected && isLowStock(selected) ? colors.danger : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          {selected ? (
            <>
              <Text style={styles.name} numberOfLines={1}>
                {selected.name}
              </Text>
              <Text style={styles.meta}>{availability(selected)}</Text>
            </>
          ) : (
            <Text style={styles.placeholder}>Toque para escolher um produto</Text>
          )}
        </View>
        <ChevronDown size={20} color={colors.primary} />
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Produto</Text>
            <Pressable accessibilityLabel="Fechar" onPress={() => setOpen(false)} hitSlop={12}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>
          <FlatList
            data={products}
            keyExtractor={(p) => String(p.id)}
            contentContainerStyle={{ padding: 20 }}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum produto cadastrado ainda.</Text>}
            renderItem={({ item }) => {
              const outOfStock = item.stock <= 0;
              return (
                <Pressable
                  disabled={outOfStock}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  style={[styles.option, item.id === selected?.id && styles.triggerActive, outOfStock && { opacity: 0.4 }]}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={[styles.meta, isLowStock(item) && { color: colors.danger }]}>
                    {outOfStock ? 'Sem estoque' : availability(item)}
                  </Text>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  triggerActive: { borderColor: colors.primary },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLow: { backgroundColor: colors.dangerSoft },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  placeholder: { fontSize: 15, color: colors.textSubtle },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  option: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
