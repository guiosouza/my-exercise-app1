import { Redirect } from 'expo-router';

export default function Index() {
  // Garante que a rota raiz ("/") redirecione para as tabs
  // e abra a aba principal de Exercícios.
  return <Redirect href="/(tabs)/WorkoutSessionScreen" />;
}