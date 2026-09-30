import { Tabs } from 'expo-router';
import { CirclePlus, History, Package, Tag } from 'lucide-react-native';

import { colors } from '@/lib/theme';

/**
 * Barra de abas inferior: Estoque, Produtos, Registrar e Histórico.
 * O cabeçalho nativo fica oculto porque cada aba desenha o seu via <Screen>.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Estoque', tabBarIcon: ({ color, size }) => <Package color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="produtos"
        options={{ title: 'Produtos', tabBarIcon: ({ color, size }) => <Tag color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="registrar"
        options={{ title: 'Registrar', tabBarIcon: ({ color, size }) => <CirclePlus color={color} size={size - 2} /> }}
      />
      <Tabs.Screen
        name="historico"
        options={{ title: 'Histórico', tabBarIcon: ({ color, size }) => <History color={color} size={size - 2} /> }}
      />
    </Tabs>
  );
}
