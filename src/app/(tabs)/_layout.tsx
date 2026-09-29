import { Tabs } from 'expo-router';
import { CirclePlus, History, Package } from 'lucide-react-native';

import { colors } from '@/lib/theme';

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
