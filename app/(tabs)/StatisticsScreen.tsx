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
      </ThemedView>
      <ThemedView style={styles.section}>
        
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