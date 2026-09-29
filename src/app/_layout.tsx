import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrateDbIfNeeded } from '@/db/migrations';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="meu-estoque.db" onInit={migrateDbIfNeeded}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="produto" options={{ presentation: 'modal', title: 'Produto' }} />
      </Stack>
    </SQLiteProvider>
  );
}
