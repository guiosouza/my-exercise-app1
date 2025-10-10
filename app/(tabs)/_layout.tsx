import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="WorkoutSessionScreen"
        options={{
          title: 'Exercícios',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="figure.strengthtraining.traditional" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="EditScreen"
        options={{
          title: 'Edição',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="pencil" color={color} />,
        }}
      />
      <Tabs.Screen
        name="StatisticsScreen"
        options={{
          title: 'Estatísticas',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar" color={color} />,
        }}
      />
    </Tabs>
  );
}
