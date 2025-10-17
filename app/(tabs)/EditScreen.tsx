import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createExerciseFromForm, ensureDb } from '@/lib/exercises-repo';
import type { ExerciseFormData, ExerciseType } from '@/types/entities';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts } from '@/constants/theme';
import { db } from '@/lib/db';

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

  // Estado para execução de SQL
  const [sql, setSql] = useState<string>('SELECT * FROM exercises LIMIT 20;');
  const [runningQuery, setRunningQuery] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [nonSelectInfo, setNonSelectInfo] = useState<{ rowsAffected?: number; lastInsertRowId?: number | null } | null>(null);

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

  function formatCell(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  async function runQuery() {
    const sqlText = sql.trim();
    if (!sqlText) {
      Alert.alert('Informe uma query', 'Digite uma instrução SQL para executar.');
      return;
    }
    setRunningQuery(true);
    setQueryError(null);
    setNonSelectInfo(null);
    try {
      const firstToken = sqlText.split(/\s+/)[0]?.toLowerCase();
      const isSelectLike = firstToken === 'select' || sqlText.toLowerCase().startsWith('with ') || firstToken === 'pragma';
      if (isSelectLike && (db as any).getAllAsync) {
        const rows = await (db as any).getAllAsync(sqlText);
        setResults(rows ?? []);
      } else if (isSelectLike) {
        const res = await (db as any).runAsync(sqlText);
        const rows = (res as any)?.rows ?? [];
        setResults(rows);
      } else {
        const res = await (db as any).runAsync(sqlText);
        const rowsAffected = (res as any)?.rowsAffected ?? (res as any)?.changes ?? 0;
        const lastInsertRowId = (res as any)?.lastInsertRowId ?? (res as any)?.insertId ?? null;
        setResults([]);
        setNonSelectInfo({ rowsAffected, lastInsertRowId });
      }
    } catch (e: any) {
      setQueryError(e?.message ?? String(e));
    } finally {
      setRunningQuery(false);
    }
  }

  function clearResults() {
    setResults([]);
    setQueryError(null);
    setNonSelectInfo(null);
  }

  const columns = useMemo(() => {
    if (!results || results.length === 0) return [] as string[];
    const first = Object.keys(results[0] ?? {});
    const union = Array.from(new Set(results.flatMap((r) => Object.keys(r ?? {}))));
    const extras = union.filter((k) => !first.includes(k)).sort();
    return [...first, ...extras];
  }, [results]);

  const columnWidths = useMemo(() => {
    const MIN = 110;
    const MAX = 260;
    const CHAR_W = 8; // monospace approx
    const widths: Record<string, number> = {};
    for (const col of columns) {
      let maxLen = col.length;
      for (const row of results) {
        const cell = formatCell(row?.[col]);
        if (cell.length > maxLen) maxLen = cell.length;
      }
      const calc = Math.min(Math.max((maxLen + 2) * CHAR_W, MIN), MAX);
      widths[col] = calc;
    }
    return widths;
  }, [columns, results]);

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

      <Collapsible title="Executar SQL">
        <ThemedView style={styles.sqlCard}>
          <ThemedText type="subtitle" lightColor="#FFFFFF" darkColor="#FFFFFF" style={styles.sqlTitle}>Console SQL</ThemedText>
          <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">Digite sua query e visualize resultados em tabela.</ThemedText>
          <View style={[styles.field, { marginTop: 8 }] }>
            <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Query SQL</ThemedText>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Ex.: SELECT * FROM exercises LIMIT 20"
              placeholderTextColor={placeholderColor}
              value={sql}
              onChangeText={setSql}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <TouchableOpacity style={styles.primaryButton} onPress={runQuery} disabled={runningQuery}>
              <ThemedText style={styles.primaryButtonText}>{runningQuery ? 'Executando...' : 'Executar'}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={clearResults} disabled={runningQuery}>
              <ThemedText style={styles.secondaryButtonText}>Limpar</ThemedText>
            </TouchableOpacity>
          </View>
          {queryError && (
            <ThemedText style={{ color: '#FCA5A5', marginTop: 8 }}>Erro: {queryError}</ThemedText>
          )}
          {nonSelectInfo && (
            <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF" style={{ marginTop: 8 }}>
              {`Linhas afetadas: ${nonSelectInfo.rowsAffected ?? 0}`}{nonSelectInfo.lastInsertRowId != null ? ` • Último ID: ${nonSelectInfo.lastInsertRowId}` : ''}
            </ThemedText>
          )}
          {results.length > 0 && (
            <ScrollView horizontal style={styles.tableContainer}>
              <View>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  {columns.map((col) => (
                    <ThemedText
                      key={`h-${col}`}
                      style={[styles.tableCell, styles.tableHeaderCell, { width: columnWidths[col], fontFamily: Fonts.mono }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {col}
                    </ThemedText>
                  ))}
                </View>
                {results.map((row, idx) => (
                  <View key={`r-${idx}`} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : undefined]}>
                    {columns.map((col) => (
                      <ThemedText
                        key={`c-${idx}-${col}`}
                        style={[styles.tableCell, { width: columnWidths[col], fontFamily: Fonts.mono }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {formatCell(row[col])}
                      </ThemedText>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          {results.length === 0 && !queryError && !nonSelectInfo && (
            <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF" style={{ marginTop: 8 }}>Nenhum resultado para exibir.</ThemedText>
          )}
        </ThemedView>
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
  sqlCard: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    gap: 8,
  },
  sqlTitle: {
    fontWeight: '700',
  },
  tableContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tableCell: {
    minWidth: 140,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFFFFF',
    borderRightWidth: 1,
    borderColor: '#1F2937',
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  tableHeaderCell: {
    fontWeight: '700',
  },
});
