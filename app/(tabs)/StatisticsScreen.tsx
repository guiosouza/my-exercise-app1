import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function StatisticsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0F172A', dark: '#0F172A' }}
      headerImage={<ThemedView style={{ height: 1 }} />}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">Estatísticas</ThemedText>
        <ThemedText>
          Evolução: 42% • Carga inicial: 140 kg • Carga final: 198 kg
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">TOP sessões</ThemedText>
        <ThemedText>1 • Flexão • 280 kg • 05/10/2025 17:00</ThemedText>
        <ThemedText>2 • Flexão • 140 kg • 03/10/2025 17:33</ThemedText>
        <ThemedText>3 • Flexão • 120 kg • 01/10/2025 17:36</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
    marginBottom: 12,
  },
});