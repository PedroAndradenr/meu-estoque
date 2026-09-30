import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrateDbIfNeeded } from '@/db/migrations';
import { colors } from '@/lib/theme';

/**
 * Layout raiz: navegador Stack que envolve as abas e as telas abertas por cima delas
 * (estoque, produto, configurações e relatório).
 */
export default function RootLayout() {
  // Abre o banco local uma vez para o app todo; onInit roda as migrações antes de qualquer tela usá-lo.
  return (
    <SQLiteProvider databaseName="meu-estoque.db" onInit={migrateDbIfNeeded}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Telas de edição abrem como modal sobre as abas; o relatório abre como tela normal da pilha. */}
        <Stack.Screen name="estoque" options={{ presentation: 'modal', title: 'Estoque do Produto' }} />
        <Stack.Screen name="produto" options={{ presentation: 'modal', title: 'Editar Produto' }} />
        <Stack.Screen name="configuracoes" options={{ presentation: 'modal', title: 'Configurações' }} />
        <Stack.Screen name="relatorio" options={{ title: 'Relatório de Vendas' }} />
      </Stack>
    </SQLiteProvider>
  );
}
