import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import ExercisesScreen from './src/screens/ExercisesScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import WorkoutPlanScreen from './src/screens/WorkoutPlanScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { initDatabase } from './src/database/database';
import { theme } from './src/styles/theme';
import { TabParamList } from './src/types';

const Tab = createBottomTabNavigator<TabParamList>();

// ErrorBoundary personalizado
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CustomErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error);
    console.error('Stack trace:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error || new Error('Erro desconhecido')} />;
    }

    return this.props.children;
  }
}

// Componente de fallback para erros
function ErrorFallback({ error }: { error: Error }) {
  console.error('🚨 CRASH DO APP DETECTADO:', error);
  console.error('Stack trace completo:', error.stack);
  
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>Ops! Algo deu errado</Text>
      <Text style={errorStyles.message}>
        O app encontrou um erro inesperado. Verifique o console para mais detalhes.
      </Text>
      <Text style={errorStyles.error}>{error.message}</Text>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  error: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

export default function App() {
  useEffect(() => {
    console.log('🚀 App iniciando...');
    try {
      console.log('📊 Inicializando banco de dados...');
      initDatabase();
      console.log('✅ Banco de dados inicializado com sucesso');
    } catch (error) {
      console.error('❌ ERRO CRÍTICO na inicialização do banco:', error);
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
      }
    }
  }, []);

  return (
    <CustomErrorBoundary>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
          },
          fonts: {
            regular: {
              fontFamily: 'System',
              fontWeight: 'normal',
            },
            medium: {
              fontFamily: 'System',
              fontWeight: '500',
            },
            bold: {
              fontFamily: 'System',
              fontWeight: 'bold',
            },
            heavy: {
              fontFamily: 'System',
              fontWeight: '900',
            },
          },
        }}
        onStateChange={(state) => {
          console.log('🧭 Navegação mudou:', state?.routeNames?.[state?.index || 0] || 'desconhecido');
        }}
      >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Exercícios') {
                iconName = focused ? 'fitness' : 'fitness-outline';
              } else if (route.name === 'Estatísticas') {
                iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              } else if (route.name === 'Ficha') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Perfil') {
                iconName = focused ? 'person' : 'person-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginTop: 4,
            },
            headerStyle: {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
            },
            headerTitleStyle: {
              color: theme.colors.text,
              fontSize: 18,
              fontWeight: '600',
            },
            headerTintColor: theme.colors.text,
          })}
        >
          <Tab.Screen 
            name="Exercícios" 
            component={ExercisesScreen}
            options={{
              headerTitle: 'Exercícios',
            }}
          />
          <Tab.Screen 
            name="Estatísticas" 
            component={StatisticsScreen}
            options={{
              headerTitle: 'Estatísticas',
            }}
          />
          <Tab.Screen 
            name="Ficha" 
            component={WorkoutPlanScreen}
            options={{
              headerTitle: 'Ficha de Treino',
            }}
          />
          <Tab.Screen 
            name="Perfil" 
            component={ProfileScreen}
            options={{
              headerTitle: 'Perfil',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </CustomErrorBoundary>
  );
}
