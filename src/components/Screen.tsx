import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Conteúdo extra à direita do cabeçalho (ex.: botões de ação). */
  right?: ReactNode;
  children: ReactNode;
  /** Use false quando os filhos renderizam a própria lista rolável (ex.: FlatList). */
  scroll?: boolean;
};

/**
 * Layout base das telas das abas: área segura no topo, cabeçalho com título/subtítulo e conteúdo,
 * rolável ou não. Usado em Estoque, Produtos, Registrar e Histórico.
 */
export function Screen({ title, subtitle, right, children, scroll = true }: Props) {
  const header = (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );

  return (
    // Só a borda superior: a barra de abas já cuida do espaço inferior.
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1, paddingBottom: 0 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
