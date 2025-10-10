import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function EditScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0F172A', dark: '#0F172A' }}
      headerImage={<ThemedView style={{ height: 1 }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Edição</ThemedText>
      </ThemedView>
      <Collapsible title="Criar exercício">
        <ThemedText>• Título: Flexão</ThemedText>
        <ThemedText>• Descrição: Exercício de peito e tríceps.</ThemedText>
        <ThemedText>• Tipo: peso corporal (70%)</ThemedText>
        <ThemedText>• YouTube: https://youtu.be/xxxxx</ThemedText>
        <ThemedText>• Imagem: device://imagem.jpg</ThemedText>
      </Collapsible>
      <Collapsible title="Editar exercício">
        <ThemedText>• Flexão — atualizar para 75% do peso corporal</ThemedText>
        <ThemedText>• Supino — adicionar link do YouTube</ThemedText>
      </Collapsible>
      <Collapsible title="Deletar exercício">
        <ThemedText>• Remover Agachamento livre</ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
