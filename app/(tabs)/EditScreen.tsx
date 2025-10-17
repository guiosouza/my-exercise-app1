import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createExerciseFromForm, ensureDb } from '@/lib/exercises-repo';
import type { ExerciseFormData, ExerciseType } from '@/types/entities';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';

export default function EditScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const placeholderColor = Colors[colorScheme].icon;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExerciseFormData>({
    title: '',
    description: '',
    type: 'weight',
    bodyweightPercentage: undefined,
    youtubeLink: '',
    imageUri: '',
  });

  useEffect(() => {
    ensureDb();
  }, []);

  function setType(type: ExerciseType) {
    setForm((prev) => ({ ...prev, type, bodyweightPercentage: type === 'bodyweight' ? prev.bodyweightPercentage : undefined }));
  }

  function validate(): string | null {
    if (!form.title.trim()) return 'Título é obrigatório.';
    if (form.type === 'bodyweight') {
      if (form.bodyweightPercentage == null) return 'Informe a porcentagem do peso corporal.';
      if (form.bodyweightPercentage <= 0 || form.bodyweightPercentage > 100) return 'A porcentagem deve estar entre 1 e 100.';
    }
    if (form.youtubeLink && !/^https?:\/\//.test(form.youtubeLink)) return 'Link do YouTube deve começar com http(s)://';
    if (form.imageUri && !/^([a-z]+:\/\/|file:\/\/|data:)/.test(form.imageUri)) return 'A imagem deve ser uma URL válida, file:// ou data:';
    return null;
  }

  async function handleSave() {
    const error = validate();
    if (error) {
      Alert.alert('Erro', error);
      return;
    }
    try {
      setSaving(true);
      await createExerciseFromForm(form);
      setSaving(false);
      setIsModalVisible(false);
      setForm({ title: '', description: '', type: 'weight', bodyweightPercentage: undefined, youtubeLink: '', imageUri: '' });
      Alert.alert('Sucesso', 'Exercício criado com sucesso.');
    } catch (e) {
      setSaving(false);
      Alert.alert('Erro', 'Não foi possível salvar o exercício.');
    }
  }

  async function pickImageFromDevice() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para selecionar imagens.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0F172A', dark: '#0F172A' }}
      headerImage={<ThemedView style={{ height: 1 }} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Edição</ThemedText>
      </ThemedView>

      <ThemedView style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setIsModalVisible(true)}>
          <ThemedText style={styles.primaryButtonText}>Criar exercício</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <Collapsible title="Criar exercício">
        <ThemedText>Abra o modal acima para criar um exercício.</ThemedText>
      </Collapsible>

      <Collapsible title="Editar exercício">
        <ThemedText>• Exemplo: atualizar porcentagem de peso corporal</ThemedText>
      </Collapsible>

      <Collapsible title="Deletar exercício">
        <ThemedText>• Exemplo: remover exercício</ThemedText>
      </Collapsible>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">Novo exercício</ThemedText>

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Título</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Flexão"
                placeholderTextColor={placeholderColor}
                value={form.title}
                onChangeText={(text) => setForm((prev) => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Descrição (opcional)</ThemedText>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Descreva o exercício"
                placeholderTextColor={placeholderColor}
                value={form.description}
                onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
                multiline
              />
            </View>

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Tipo</ThemedText>
              <View style={styles.segment}>
                <TouchableOpacity
                  style={[styles.segmentButton, form.type === 'weight' && styles.segmentButtonActive]}
                  onPress={() => setType('weight')}
                >
                  <ThemedText style={styles.segmentText}>Peso</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, form.type === 'bodyweight' && styles.segmentButtonActive]}
                  onPress={() => setType('bodyweight')}
                >
                  <ThemedText style={styles.segmentText}>Peso corporal</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {form.type === 'bodyweight' && (
              <View style={styles.field}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Porcentagem do peso corporal (%)</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Ex.: 70"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={form.bodyweightPercentage?.toString() ?? ''}
                  onChangeText={(text) => {
                    const num = Number(text.replace(/[^0-9.]/g, ''));
                    setForm((prev) => ({ ...prev, bodyweightPercentage: isNaN(num) ? undefined : num }));
                  }}
                />
              </View>
            )}

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Link do YouTube (opcional)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="https://www.youtube.com/watch?v=..."
                placeholderTextColor={placeholderColor}
                value={form.youtubeLink}
                onChangeText={(text) => setForm((prev) => ({ ...prev, youtubeLink: text }))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Imagem (URL ou dispositivo)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="https://exemplo.com/imagem.jpg"
                placeholderTextColor={placeholderColor}
                value={form.imageUri}
                onChangeText={(text) => setForm((prev) => ({ ...prev, imageUri: text }))}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.row}>
                <TouchableOpacity style={styles.secondaryButton} onPress={pickImageFromDevice}>
                  <ThemedText style={styles.secondaryButtonText}>Selecionar do dispositivo</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)} disabled={saving}>
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                <ThemedText style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar'}</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actions: {
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#0F172A',
    gap: 12,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFFFFF',
  },
  inputMultiline: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: '#2563EB',
  },
  segmentText: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  cancelButtonText: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#00110A',
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
});
