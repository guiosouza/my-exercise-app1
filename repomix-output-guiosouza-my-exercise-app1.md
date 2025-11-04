This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
app/
  (tabs)/
    _layout.tsx
    EditScreen.tsx
    ProgressScreen.tsx
    StatisticsScreen.tsx
    WorkoutSessionScreen.tsx
  _layout.tsx
  modal.tsx
components/
  ui/
    collapsible.tsx
    icon-symbol.ios.tsx
    icon-symbol.tsx
  exercise-card.tsx
  external-link.tsx
  haptic-tab.tsx
  hello-wave.tsx
  parallax-scroll-view.tsx
  themed-text.tsx
  themed-view.tsx
constants/
  theme.ts
hooks/
  use-color-scheme.ts
  use-color-scheme.web.ts
  use-theme-color.ts
lib/
  db.ts
  exercises-repo.ts
  workout-sessions-repo.ts
scripts/
  reset-project.js
types/
  entities.ts
.gitignore
app.json
eslint.config.js
package.json
README.md
specifications.md
tsconfig.json
```

# Files

## File: app/(tabs)/_layout.tsx
````typescript
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
      <Tabs.Screen
        name="ProgressScreen"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar" color={color} />,
        }}
      />
    </Tabs>
  );
}
````

## File: app/(tabs)/EditScreen.tsx
````typescript
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ExerciseCard } from '@/components/exercise-card';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { db } from '@/lib/db';
import { createExerciseFromForm, deleteExercise, ensureDb, getAllExercises, updateExerciseFromForm } from '@/lib/exercises-repo';
import type { Exercise, ExerciseFormData, ExerciseType } from '@/types/entities';
import * as ImagePicker from 'expo-image-picker';

export default function EditScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const placeholderColor = Colors[colorScheme].icon;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [form, setForm] = useState<ExerciseFormData>({
    title: '',
    description: '',
    type: 'weight',
    bodyweightPercentage: undefined,
    youtubeLink: '',
    imageUri: '',
  });

  // Estado para execução de SQL
  const [sql, setSql] = useState<string>('SELECT * FROM workout_sessions LIMIT 20;');
  const [runningQuery, setRunningQuery] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [nonSelectInfo, setNonSelectInfo] = useState<{ rowsAffected?: number; lastInsertRowId?: number | null } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('json'); // Novo estado para alternar entre visualizações
  const [isSqlModalVisible, setIsSqlModalVisible] = useState<boolean>(false);

  useEffect(() => {
    ensureDb();
    reloadExercises();
  }, []);

  function setType(type: ExerciseType) {
    setForm((prev) => ({ ...prev, type, bodyweightPercentage: type === 'bodyweight' ? prev.bodyweightPercentage : undefined }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title: '', description: '', type: 'weight', bodyweightPercentage: undefined, youtubeLink: '', imageUri: '' });
  }

  function openCreateModal() {
    resetForm();
    setIsModalVisible(true);
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

  async function reloadExercises() {
    setLoadingList(true);
    try {
      const list = await getAllExercises();
      setExercises(list);
    } catch (e) {
      // noop
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSave() {
    const error = validate();
    if (error) {
      Alert.alert('Erro', error);
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await updateExerciseFromForm(editingId, form);
        Alert.alert('Sucesso', 'Exercício atualizado com sucesso.');
      } else {
        await createExerciseFromForm(form);
        Alert.alert('Sucesso', 'Exercício criado com sucesso.');
      }
      setSaving(false);
      setIsModalVisible(false);
      resetForm();
      await reloadExercises();
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

  function handleEdit(ex: Exercise) {
    setEditingId(ex.id);
    setForm({
      title: ex.title,
      description: ex.description ?? '',
      type: ex.type,
      bodyweightPercentage: ex.bodyweightPercentage,
      youtubeLink: ex.youtubeLink ?? '',
      imageUri: ex.imageUri ?? '',
    });
    setIsModalVisible(true);
  }

  function handleDelete(ex: Exercise) {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o exercício "${ex.title}"? Esta ação não poderá ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExercise(ex.id);
              Alert.alert('Excluído', 'Exercício removido com sucesso.');
              await reloadExercises();
            } catch (e: any) {
              const msg = e?.message || String(e);
              const isFkFail = /FOREIGN KEY/i.test(msg) || /constraint failed/i.test(msg);
              Alert.alert(
                'Erro ao excluir',
                isFkFail
                  ? 'Este exercício está sendo utilizado em outros registros e não pode ser excluído.'
                  : 'Não foi possível excluir o exercício.'
              );
            }
          },
        },
      ]
    );
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
      headerImage={<ThemedView style={{ height: 1 }} />}
      contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Edição</ThemedText>
      </ThemedView>


      <Collapsible title="Exercícios">
        <View style={styles.listHeaderRow}>
          <ThemedText style={styles.listHeaderTitle}>Lista de exercícios</ThemedText>
          <TouchableOpacity style={styles.secondaryButton} onPress={reloadExercises}>
            <ThemedText style={styles.secondaryButtonText}>Recarregar</ThemedText>
          </TouchableOpacity>
        </View>
        {loadingList ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <ThemedText style={{ marginLeft: 8 }}>Carregando...</ThemedText>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {/* Card de criar novo exercício */}
            <TouchableOpacity activeOpacity={0.9} onPress={openCreateModal}>
              <ThemedView style={styles.addCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <IconSymbol name="plus.circle.fill" color={Colors[colorScheme].tint} size={20} />
                  <ThemedText type="defaultSemiBold">Criar novo exercício</ThemedText>
                </View>
                <ThemedText style={{ color: '#9CA3AF', marginTop: 4 }}>Adicionar um novo exercício à lista</ThemedText>
              </ThemedView>
            </TouchableOpacity>

            {/* Lista de exercícios */}
            {exercises.length === 0 ? (
              <ThemedText style={{ color: '#9CA3AF' }}>Nenhum exercício cadastrado.</ThemedText>
            ) : (
              exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  title={ex.title}
                  type={ex.type === 'weight' ? 'Peso' : 'Peso corporal'}
                  description={ex.description}
                  youtubeLink={ex.youtubeLink}
                  imageUri={ex.imageUri}
                  onPress={() => handleEdit(ex)}
                  onEdit={() => handleEdit(ex)}
                  onDelete={() => handleDelete(ex)}
                />
              ))
            )}
          </View>
        )}
      </Collapsible>

      <Collapsible title="Executar SQL">
        <ThemedView style={styles.sqlCard}>
          <View style={styles.listHeaderRow}>
            <ThemedText type="subtitle" lightColor="#FFFFFF" darkColor="#FFFFFF" style={styles.sqlTitle}>Console SQL</ThemedText>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setIsSqlModalVisible(true)}>
              <ThemedText style={styles.primaryButtonText}>Abrir editor</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">Edite sua query no modal e visualize os resultados abaixo.</ThemedText>
          <View style={[styles.row, { marginTop: 8 }]}>
            <TouchableOpacity style={styles.secondaryButton} onPress={clearResults} disabled={runningQuery}>
              <ThemedText style={styles.secondaryButtonText}>Limpar resultados</ThemedText>
            </TouchableOpacity>
          </View>
          
          {/* Botões para alternar entre visualizações */}
          {results.length > 0 && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF" style={{ marginRight: 8 }}>Visualização:</ThemedText>
              <TouchableOpacity 
                style={[styles.segmentButton, viewMode === 'json' && styles.segmentButtonActive]} 
                onPress={() => setViewMode('json')}
              >
                <ThemedText style={styles.segmentText}>JSON</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentButton, viewMode === 'table' && styles.segmentButtonActive]} 
                onPress={() => setViewMode('table')}
              >
                <ThemedText style={styles.segmentText}>Tabela</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          {queryError && (
            <ThemedText style={{ color: '#FCA5A5', marginTop: 8 }}>Erro: {queryError}</ThemedText>
          )}
          {nonSelectInfo && (
            <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF" style={{ marginTop: 8 }}>
              {`Linhas afetadas: ${nonSelectInfo.rowsAffected ?? 0}`}{nonSelectInfo.lastInsertRowId != null ? ` • Último ID: ${nonSelectInfo.lastInsertRowId}` : ''}
            </ThemedText>
          )}
          {results.length > 0 && viewMode === 'table' && (
            <ScrollView horizontal style={styles.tableContainer}>
              <View>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  {columns.map((col) => (
                    <ThemedText
                      key={`h-${col}`}
                      style={[styles.tableCell, styles.tableHeaderCell, { width: columnWidths[col], fontFamily: 'monospace' }]}
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
                        style={[styles.tableCell, { width: columnWidths[col], fontFamily: 'monospace' }]}
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
        {results.length > 0 && viewMode === 'json' && (
          <ScrollView 
            style={styles.jsonContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEnabled={true}
          >
            <ThemedText style={styles.jsonText} selectable>
              {JSON.stringify(Array.isArray(results) ? results : [results], null, 2)}
            </ThemedText>
          </ScrollView>
        )}
        {results.length === 0 && !queryError && !nonSelectInfo && (
          <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF" style={{ marginTop: 8 }}>Nenhum resultado para exibir.</ThemedText>
        )}
        </ThemedView>
      </Collapsible>

      {/* Modal para edição de SQL */}
      <Modal visible={isSqlModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">Editor SQL</ThemedText>
            <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">Digite sua query abaixo e execute para ver os resultados.</ThemedText>

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

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsSqlModalVisible(false)} disabled={runningQuery}>
                <ThemedText style={styles.cancelButtonText}>Fechar</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">{editingId ? 'Editar exercício' : 'Novo exercício'}</ThemedText>

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
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsModalVisible(false); resetForm(); }} disabled={saving}>
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                <ThemedText style={styles.saveButtonText}>{saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Salvar')}</ThemedText>
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
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  addCard: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.08)'
  },
  jsonContainer: {
    marginTop: 8,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flex: 0,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#FFFFFF',
    padding: 12,
    lineHeight: 16,
    flexShrink: 0,
  },
});
````

## File: app/(tabs)/ProgressScreen.tsx
````typescript
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ensureDb as ensureExercisesDb, getAllExercises } from '@/lib/exercises-repo';
import { getSessionsBetweenDates } from '@/lib/workout-sessions-repo';
import { initDb } from '@/lib/db';
import type { Exercise, WorkoutSession } from '@/types/entities';

function toISODateOnly(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

function startOfDayIso(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  return d;
}

function endOfDayIso(dateStr: string): Date {
  const d = new Date(dateStr + 'T23:59:59.999Z');
  return d;
}

function computeProgressPercent(sessions: WorkoutSession[]): { baseline: number; latest: number; percent: number } | null {
  if (!sessions || sessions.length === 0) return null;
  const sorted = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const baseline = sorted[0].totalLoad || 0;
  const latest = sorted[sorted.length - 1].totalLoad || 0;
  if (baseline <= 0) {
    if (latest <= 0) return { baseline, latest, percent: 0 };
    return { baseline, latest, percent: 100 };
  }
  const percent = ((latest - baseline) / baseline) * 100;
  return { baseline, latest, percent: Math.round(percent * 100) / 100 };
}

export default function ProgressScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const placeholderColor = Colors[colorScheme].icon;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODateOnly(d);
  });
  const [endDate, setEndDate] = useState<string>(() => toISODateOnly(new Date()));
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{
    exerciseId: string;
    title: string;
    baseline: number;
    latest: number;
    percent: number;
  }[]>([]);

  useEffect(() => {
    ensureExercisesDb();
    initDb();
    (async () => {
      try {
        const list = await getAllExercises();
        setExercises(list);
      } catch (e) {
        // noop
      }
    })();
  }, []);

  const filteredExercises = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => (ex.title || '').toLowerCase().includes(q));
  }, [exercises, searchQuery]);

  async function runFilter() {
    try {
      setLoading(true);
      const start = startOfDayIso(startDate);
      const end = endOfDayIso(endDate);
      if (start > end) {
        Alert.alert('Período inválido', 'A data inicial deve ser anterior à final.');
        setLoading(false);
        return;
      }
      if (selectedExerciseId) {
        const sessions = await getSessionsBetweenDates(start, end, selectedExerciseId);
        const ex = exercises.find((e) => e.id === selectedExerciseId);
        const prog = computeProgressPercent(sessions);
        setResults(
          prog && ex
            ? [
                {
                  exerciseId: selectedExerciseId,
                  title: ex.title,
                  baseline: prog.baseline,
                  latest: prog.latest,
                  percent: prog.percent,
                },
              ]
            : []
        );
      } else {
        // Sem seleção: lista progresso de todos exercícios com dados
        const out: {
          exerciseId: string;
          title: string;
          baseline: number;
          latest: number;
          percent: number;
        }[] = [];
        for (const ex of exercises) {
          const sessions = await getSessionsBetweenDates(start, end, ex.id);
          const prog = computeProgressPercent(sessions);
          if (prog) {
            out.push({ exerciseId: ex.id, title: ex.title, baseline: prog.baseline, latest: prog.latest, percent: prog.percent });
          }
        }
        setResults(out);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível calcular o progresso.');
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    setSelectedExerciseId(null);
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0F172A', dark: '#0F172A' }}
      headerImage={<ThemedView style={{ height: 1 }} />}
      contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Progresso</ThemedText>
      </ThemedView>

      <ThemedView style={styles.filterCard}>
        <ThemedText type="subtitle" lightColor="#FFFFFF" darkColor="#FFFFFF">Filtro</ThemedText>

        <View style={styles.field}>
          <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Selecionar exercício (opcional)</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Pesquisar por título..."
            placeholderTextColor={placeholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ marginTop: 8 }}>
            {filteredExercises.slice(0, 6).map((ex) => (
              <TouchableOpacity
                key={ex.id}
                style={[styles.selectRow, selectedExerciseId === ex.id && styles.selectRowActive]}
                onPress={() => setSelectedExerciseId(ex.id)}
              >
                <ThemedText style={{ color: '#FFFFFF' }}>{ex.title}</ThemedText>
              </TouchableOpacity>
            ))}
            {selectedExerciseId && (
              <TouchableOpacity style={[styles.clearBtn]} onPress={clearSelection}>
                <ThemedText style={{ color: '#FFFFFF' }}>Limpar seleção</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }] }>
            <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Início</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={placeholderColor}
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[styles.field, { flex: 1 }] }>
            <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Fim</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={placeholderColor}
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={[styles.row, { marginTop: 8 }]}>
          <TouchableOpacity style={styles.primaryButton} onPress={runFilter} disabled={loading}>
            <ThemedText style={styles.primaryButtonText}>{loading ? 'Filtrando...' : 'Filtrar'}</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.resultCard}>
        <View style={styles.listHeaderRow}>
          <ThemedText style={styles.listHeaderTitle}>Resultado</ThemedText>
          <IconSymbol name="chart.bar" color={Colors[colorScheme].tint} size={20} />
        </View>
        {results.length === 0 ? (
          <ThemedText style={{ color: '#9CA3AF' }}>Nenhum dado para exibir. Ajuste o filtro e tente novamente.</ThemedText>
        ) : (
          <View style={{ gap: 8 }}>
            {results.map((r) => (
              <View key={r.exerciseId} style={styles.progressRow}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF" style={{ fontWeight: '700' }}>{r.title}</ThemedText>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Carga total começo: {r.baseline}kg</ThemedText>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Carga total no final: {r.latest}kg</ThemedText>
                <ThemedText style={{ color: r.percent >= 0 ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                  Evolução: {r.percent >= 0 ? '+' : ''}{r.percent.toFixed(1)}%
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterCard: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    gap: 8,
  },
  resultCard: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    gap: 8,
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
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontWeight: '700',
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
  selectRow: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  selectRowActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: '#2563EB',
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  progressRow: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    gap: 4,
  },
});
````

## File: app/(tabs)/StatisticsScreen.tsx
````typescript
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { db } from "@/lib/db";
import {
  ensureDb as ensureExercisesDb,
  getAllExercises,
} from "@/lib/exercises-repo";
import {
  calculateTotalLoad,
  ensureDb as ensureWorkoutDb,
} from "@/lib/workout-sessions-repo";

export default function StatisticsScreen() {
  const colorScheme = useColorScheme() ?? "light";

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<
    Array<{
      id: string;
      exerciseId: string;
      rank: number;
      exerciseTitle: string;
      exerciseType: string | null;
      exerciseBodyweightPercentage: number | null;
      date: Date;
      completeReps: number;
      negativeReps: number;
      failedReps: number;
      sets: number;
      weight: number;
      restTime: number;
      totalLoad: number;
    }>
  >([]);
  const [exercises, setExercises] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("Todos");
  const [searchText, setSearchText] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [filteredExercises, setFilteredExercises] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [selectedExerciseTitle, setSelectedExerciseTitle] =
    useState<string>("Todos");

  // Edição de sessão
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{
    completeReps: number;
    negativeReps: number;
    failedReps: number;
    sets: number;
    weight: number;
    restTime: number;
  }>({
    completeReps: 0,
    negativeReps: 0,
    failedReps: 0,
    sets: 0,
    weight: 0,
    restTime: 80,
  });
  const [editWeightInput, setEditWeightInput] = useState<string>("0");
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  async function fetchRecords(exerciseFilter: string) {
    setLoading(true);
    setError(null);
    try {
      ensureWorkoutDb();
      const where = exerciseFilter === "Todos" ? "" : "WHERE ex.id = ?";
      const params = exerciseFilter === "Todos" ? [] : [exerciseFilter];
      const rows = await (db as any).getAllAsync?.(
        `SELECT 
           ws.id, ws.exerciseId, ws.date,
           ws.completeReps, ws.negativeReps, ws.failedReps,
           ws.sets, ws.weight, ws.restTime, ws.totalLoad,
           ex.title as exerciseTitle, ex.type as exerciseType, ex.bodyweightPercentage as exerciseBodyweightPercentage
         FROM workout_sessions ws
         JOIN exercises ex ON ex.id = ws.exerciseId
         ${where}
         ORDER BY ws.totalLoad DESC
         LIMIT 30;`,
        params
      );
      const arr = (rows ?? []).map((r: any, idx: number) => ({
        id: r.id,
        exerciseId: r.exerciseId,
        rank: idx + 1,
        exerciseTitle: r.exerciseTitle,
        exerciseType: r.exerciseType,
        exerciseBodyweightPercentage: r.exerciseBodyweightPercentage,
        date: new Date(r.date),
        completeReps: Number(r.completeReps ?? 0),
        negativeReps: Number(r.negativeReps ?? 0),
        failedReps: Number(r.failedReps ?? 0),
        sets: Number(r.sets ?? 0),
        weight: Number(r.weight ?? 0),
        restTime: Number(r.restTime ?? 80),
        totalLoad: Number(r.totalLoad ?? 0),
      }));
      setRecords(arr);
    } catch (e) {
      setError("Não foi possível carregar estatísticas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        ensureExercisesDb();
        const exs = await getAllExercises();
        const exerciseList = exs
          .map((e) => ({ id: e.id, title: e.title }))
          .sort((a, b) => a.title.localeCompare(b.title));
        const allExercises = [{ id: "Todos", title: "Todos" }, ...exerciseList];
        setExercises(allExercises);
        setFilteredExercises(allExercises);
        setSearchText("Todos");
        await fetchRecords(selectedExercise);
      } catch (e) {
        setError("Não foi possível carregar estatísticas e tipos.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    fetchRecords(selectedExercise);
  }, [selectedExercise]);

  // Função para filtrar exercícios baseado no texto de busca
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter((ex) =>
        ex.title.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
    setShowDropdown(true);
  };

  // Função para selecionar um exercício
  const handleSelectExercise = (exercise: { id: string; title: string }) => {
    setSelectedExercise(exercise.id);
    setSelectedExerciseTitle(exercise.title);
    setSearchText(exercise.title);
    setShowDropdown(false);
  };

  const secondLoad = records.length > 1 ? records[1].totalLoad : 0;
  const firstImprovementPct =
    records.length > 1 && secondLoad > 0
      ? Math.round(((records[0].totalLoad - secondLoad) / secondLoad) * 1000) /
        10 // 0.1% precision
      : null;

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#0F172A", dark: "#0F172A" }}
        headerImage={<ThemedView style={{ height: 1 }} />}
        contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
      >
        <ThemedView style={styles.section}>
          <ThemedText type="title">Top 30 Recordes de exercício</ThemedText>
          <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">
            Ordenado por peso total puxado
          </ThemedText>
        </ThemedView>

        {/* Filtros e ações */}
        <View style={styles.filtersRow}>
          <View style={styles.autocompleteContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Selecione um exercício..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={handleSearchChange}
              onBlur={() => setShowDropdown(false)}
              onFocus={() => {
                setShowDropdown(true);
                if (searchText === selectedExerciseTitle) {
                  setSearchText("");
                  setFilteredExercises(exercises);
                }
              }}
            />
            {showDropdown && (
              <View style={styles.dropdown}>
                <ScrollView
                  style={styles.dropdownList}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredExercises.map((item) => (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.dropdownItem,
                        selectedExercise === item.id &&
                          styles.dropdownItemSelected,
                      ]}
                      onPress={() => handleSelectExercise(item)}
                    >
                      <ThemedText
                        style={[
                          styles.dropdownText,
                          selectedExercise === item.id &&
                            styles.dropdownTextSelected,
                        ]}
                      >
                        {item.title}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          <Pressable
            onPress={() => fetchRecords(selectedExercise)}
            style={styles.reloadButton}
          >
            <ThemedText style={styles.reloadText}>Recarregar</ThemedText>
          </Pressable>
        </View>

        {loading && (
          <View style={[styles.row, { alignItems: "center" }]}>
            <ActivityIndicator />
            <ThemedText style={{ marginLeft: 8 }}>Carregando...</ThemedText>
          </View>
        )}

        {!!error && (
          <ThemedText style={{ color: "#EF4444" }}>{error}</ThemedText>
        )}

        {!loading && !error && records.length === 0 && (
          <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">
            Nenhuma sessão registrada para este filtro.
          </ThemedText>
        )}

        {!loading && !error && records.length > 0 && (
          <View style={{ gap: 12 }}>
            {records.map((rec, idx) => {
              const next = records[idx + 1];
              const improvementPct =
                next && next.totalLoad > 0
                  ? Math.round(
                      ((rec.totalLoad - next.totalLoad) / next.totalLoad) * 1000
                    ) / 10
                  : null;
              return (
                <ThemedView key={rec.id} style={styles.recordCard}>
                  {/* Header com rank e título */}
                  <View style={styles.cardHeader}>
                    <View style={styles.rankBadge}>
                      <ThemedText style={styles.rankNumber}>
                        #{rec.rank}
                      </ThemedText>
                    </View>
                    <View style={styles.headerContent}>
                      <ThemedText
                        type="defaultSemiBold"
                        style={styles.exerciseTitle}
                      >
                        {rec.exerciseTitle}
                      </ThemedText>
                      <ThemedText style={styles.dateText}>
                        {rec.date.toLocaleDateString("pt-BR")}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Métricas principais em grid */}
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <ThemedText style={styles.metricValue}>
                        {rec.totalLoad}
                      </ThemedText>
                      <ThemedText style={styles.metricLabel}>
                        kg total
                      </ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText style={styles.metricValue}>
                        {rec.completeReps}
                      </ThemedText>
                      <ThemedText style={styles.metricLabel}>reps</ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText style={styles.metricValue}>
                        {rec.sets}
                      </ThemedText>
                      <ThemedText style={styles.metricLabel}>séries</ThemedText>
                    </View>
                    <View style={styles.metricItem}>
                      <ThemedText style={styles.metricValue}>
                        {rec.weight}
                      </ThemedText>
                      <ThemedText style={styles.metricLabel}>
                        kg/carga
                      </ThemedText>
                    </View>
                  </View>

                  {/* Métricas secundárias */}
                  <View style={styles.secondaryMetrics}>
                    <View style={styles.secondaryMetric}>
                      <ThemedText style={styles.secondaryLabel}>
                        Negativas:
                      </ThemedText>
                      <ThemedText style={styles.secondaryValue}>
                        {rec.negativeReps || 0}
                      </ThemedText>
                    </View>
                    <View style={styles.secondaryMetric}>
                      <ThemedText style={styles.secondaryLabel}>
                        Falhas:
                      </ThemedText>
                      <ThemedText style={styles.secondaryValue}>
                        {rec.failedReps || 0}
                      </ThemedText>
                    </View>
                    <View style={styles.secondaryMetric}>
                      <ThemedText style={styles.secondaryLabel}>
                        Descanso:
                      </ThemedText>
                      <ThemedText style={styles.secondaryValue}>
                        {rec.restTime}s
                      </ThemedText>
                    </View>
                  </View>

                  {/* Melhoria em relação ao próximo */}
                  {improvementPct !== null && (
                    <View style={styles.improvementBadge}>
                      <ThemedText style={styles.improvementText}>
                        ↑ {improvementPct}% melhor que #{rec.rank + 1}
                      </ThemedText>
                    </View>
                  )}

                  {/* Ações */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setEditingRecord(rec);
                        setEditForm({
                          completeReps: rec.completeReps,
                          negativeReps: rec.negativeReps ?? 0,
                          failedReps: rec.failedReps ?? 0,
                          sets: rec.sets,
                          weight: rec.weight ?? 0,
                          restTime: rec.restTime ?? 80,
                        });
                        setEditWeightInput(String(rec.weight ?? 0));
                        setIsEditModalVisible(true);
                      }}
                    >
                      <ThemedText style={styles.editButtonText}>
                        Editar
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          "Confirmar",
                          "Deseja excluir esta sessão?",
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Excluir",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  await (db as any).runAsync?.(
                                    "DELETE FROM workout_sessions WHERE id = ?;",
                                    [rec.id]
                                  );
                                  await fetchRecords(selectedExercise);
                                } catch (e) {
                                  Alert.alert(
                                    "Erro",
                                    "Não foi possível excluir a sessão."
                                  );
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <ThemedText style={styles.deleteButtonText}>
                        Excluir
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </ThemedView>
              );
            })}
          </View>
        )}
      </ParallaxScrollView>

      {/* Modal de edição */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">
              Editar sessão
            </ThemedText>

            {editingRecord && (
              <>
                <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">
                  {editingRecord.exerciseTitle} ·{" "}
                  {editingRecord.date.toLocaleDateString()}
                </ThemedText>

                <View style={styles.field}>
                  <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                    Repetições completas
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={String(editForm.completeReps ?? 0)}
                    onChangeText={(t) =>
                      setEditForm((p) => ({
                        ...p,
                        completeReps: Number(t.replace(/\D/g, "")) || 0,
                      }))
                    }
                  />
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                      Negativas
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={String(editForm.negativeReps ?? 0)}
                      onChangeText={(t) =>
                        setEditForm((p) => ({
                          ...p,
                          negativeReps: Number(t.replace(/\D/g, "")) || 0,
                        }))
                      }
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                      Falhas
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={String(editForm.failedReps ?? 0)}
                      onChangeText={(t) =>
                        setEditForm((p) => ({
                          ...p,
                          failedReps: Number(t.replace(/\D/g, "")) || 0,
                        }))
                      }
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                      Séries
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={String(editForm.sets ?? 0)}
                      onChangeText={(t) =>
                        setEditForm((p) => ({
                          ...p,
                          sets: Number(t.replace(/\D/g, "")) || 0,
                        }))
                      }
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                      Peso (kg)
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType={
                        Platform.OS === "ios" ? "decimal-pad" : "numeric"
                      }
                      value={editWeightInput}
                      onChangeText={(t) => {
                        let normalized = t
                          .replace(",", ".")
                          .replace(/[^0-9.]/g, "");
                        const dotIndex = normalized.indexOf(".");
                        if (dotIndex !== -1) {
                          normalized =
                            normalized.slice(0, dotIndex + 1) +
                            normalized.slice(dotIndex + 1).replace(/\./g, "");
                        }
                        if (normalized.startsWith("."))
                          normalized = "0" + normalized;
                        setEditWeightInput(normalized);
                        setEditForm((p) => ({
                          ...p,
                          weight:
                            normalized === "" || normalized === "."
                              ? 0
                              : parseFloat(normalized),
                        }));
                      }}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                    Descanso (s)
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="80"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={String(editForm.restTime ?? 80)}
                    onChangeText={(t) =>
                      setEditForm((p) => ({
                        ...p,
                        restTime: Number(t.replace(/\D/g, "")) || 80,
                      }))
                    }
                  />
                </View>

                {/* Prévia do totalLoad */}
                <ThemedView style={styles.previewCard}>
                  <ThemedText
                    lightColor="#FFFFFF"
                    darkColor="#FFFFFF"
                    style={{ fontWeight: "700" }}
                  >
                    Prévia da carga total
                  </ThemedText>
                  <ThemedText
                    type="title"
                    lightColor="#FFFFFF"
                    darkColor="#FFFFFF"
                  >
                    {(() => {
                      const ex = {
                        id: editingRecord.exerciseId,
                        title: editingRecord.exerciseTitle,
                        type: editingRecord.exerciseType,
                        bodyweightPercentage:
                          editingRecord.exerciseBodyweightPercentage,
                        description: undefined,
                        youtubeLink: undefined,
                        imageUri: undefined,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      } as any;
                      return calculateTotalLoad(ex, editForm);
                    })()}{" "}
                    kg
                  </ThemedText>
                </ThemedView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsEditModalVisible(false)}
                    disabled={savingEdit}
                  >
                    <ThemedText style={styles.cancelButtonText}>
                      Cancelar
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={async () => {
                      if (!editingRecord) return;
                      try {
                        setSavingEdit(true);
                        const ex = {
                          id: editingRecord.exerciseId,
                          title: editingRecord.exerciseTitle,
                          type: editingRecord.exerciseType,
                          bodyweightPercentage:
                            editingRecord.exerciseBodyweightPercentage,
                          description: undefined,
                          youtubeLink: undefined,
                          imageUri: undefined,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        } as any;
                        const newTotal = calculateTotalLoad(ex, editForm);
                        await (db as any).runAsync?.(
                          `UPDATE workout_sessions SET completeReps = ?, negativeReps = ?, failedReps = ?, sets = ?, weight = ?, restTime = ?, totalLoad = ? WHERE id = ?;`,
                          [
                            Math.max(0, editForm.completeReps || 0),
                            Math.max(0, editForm.negativeReps || 0),
                            Math.max(0, editForm.failedReps || 0),
                            Math.max(1, editForm.sets || 1),
                            editForm.weight || 0,
                            editForm.restTime || 80,
                            newTotal,
                            editingRecord.id,
                          ]
                        );
                        setIsEditModalVisible(false);
                        setSavingEdit(false);
                        await fetchRecords(selectedExercise);
                      } catch (e) {
                        setSavingEdit(false);
                        Alert.alert(
                          "Erro",
                          "Não foi possível salvar alterações."
                        );
                      }
                    }}
                    disabled={savingEdit}
                  >
                    <ThemedText style={styles.saveButtonText}>
                      {savingEdit ? "Salvando..." : "Salvar"}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  autocompleteContainer: {
    flex: 1,
    position: "relative",
    zIndex: 1000,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#374151",
  },
  dropdown: {
    position: "absolute",
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#EBF4FF",
  },
  dropdownText: {
    fontSize: 16,
    color: "#374151",
  },
  dropdownTextSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  reloadButton: {
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  reloadText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  recordCard: {
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  rankText: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  totalLabel: {
    color: "#9CA3AF",
  },
  totalValue: {
    color: Colors["light"].tint,
    fontWeight: "700",
    fontSize: 18,
  },
  improvementText: {
    color: "#10B981",
    marginTop: 6,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    backgroundColor: "#1F2937",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "rgba(239,68,68,0.12)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontWeight: "700",
  },
  // Estilos do modal de edição
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#0F172A",
    gap: 12,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 8,
    padding: 12,
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 6,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  cancelButtonText: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#00110A",
    fontWeight: "700",
  },
  previewCard: {
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  rankBadge: {
    backgroundColor: Colors["light"].tint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: "center",
  },
  rankNumber: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  headerContent: {
    flex: 1,
  },
  exerciseTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 2,
  },
  dateText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },

  metricLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    textAlign: "center",
  },
  secondaryMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 8,
  },

  secondaryMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  secondaryLabel: {
    color: "#9CA3AF",
    fontSize: 12,
  },

  secondaryValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  improvementBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
});
````

## File: app/(tabs)/WorkoutSessionScreen.tsx
````typescript
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ExerciseCard } from "@/components/exercise-card";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ensureDb as ensureExerciseDb,
  getAllExercises,
} from "@/lib/exercises-repo";
import {
  calculateEffectiveWeight,
  calculateTotalLoad,
  createWorkoutSessionFromForm,
} from "@/lib/workout-sessions-repo";
import type { Exercise, WorkoutSessionFormData } from "@/types/entities";

export default function WorkoutSessionScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const placeholderColor = Colors[colorScheme].icon;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState<WorkoutSessionFormData>({
    completeReps: 0,
    negativeReps: 0,
    failedReps: 0,
    sets: 0,
    weight: 0,
    restTime: 80,
  });
  const [weightInput, setWeightInput] = useState<string>("0");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    ensureExerciseDb();
    reloadExercises();
  }, []);

  async function reloadExercises() {
    setLoading(true);
    try {
      const list = await getAllExercises();
      setExercises(list);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }

  function openFormFor(ex: Exercise) {
    setSelectedExercise(ex);
    setForm({
      completeReps: 0,
      negativeReps: 0,
      failedReps: 0,
      sets: 0,
      weight: 0,
      restTime: 80,
    });
    setWeightInput("0");
    setIsModalVisible(true);
  }

  const previewTotalLoad = useMemo(() => {
    if (!selectedExercise) return 0;
    return calculateTotalLoad(selectedExercise, form);
  }, [selectedExercise, form]);

  const previewEffectiveWeight = useMemo(() => {
    if (!selectedExercise) return 0;
    return (
      Math.round(
        calculateEffectiveWeight(selectedExercise, form.weight || 0) * 100
      ) / 100
    );
  }, [selectedExercise, form.weight]);

  async function handleSave() {
    if (!selectedExercise) return;
    try {
      setSaving(true);
      await createWorkoutSessionFromForm(selectedExercise, form);
      setSaving(false);
      setIsModalVisible(false);
      Alert.alert("Sucesso", "Sessão de treino gravada.");
    } catch (e) {
      setSaving(false);
      Alert.alert("Erro", "Não foi possível gravar a sessão.");
    }
  }

  const filteredExercises = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => {
      const title = (ex.title || "").toLowerCase();
      const desc = (ex.description || "").toLowerCase();
      const typeLabel = ex.type === "weight" ? "peso" : "peso corporal";
      return title.includes(q) || desc.includes(q) || typeLabel.includes(q);
    });
  }, [exercises, searchQuery]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#0F172A", dark: "#0F172A" }}
      headerImage={
        <Image
          source={require("@/assets/images/workout-session.png")}
          style={styles.headerImage}
        />
      }
      contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Exercícios</ThemedText>
      </ThemedView>

      <View style={styles.reloadRow}>
        <TouchableOpacity
          onPress={reloadExercises}
          disabled={loading}
          style={styles.reloadButton}
        >
          <ThemedText style={styles.reloadButtonText}>
            {loading ? "Recarregando..." : "Recarregar lista"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar exercícios..."
          placeholderTextColor={placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <View style={styles.instructionsRow}>
        <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">
          Clique em um exercício para começar a treinar.
        </ThemedText>
      </View>

      {loading ? (
        <ThemedText style={{ color: "#9CA3AF" }}>Carregando...</ThemedText>
      ) : exercises.length === 0 ? (
        <ThemedText style={{ color: "#9CA3AF" }}>
          Nenhum exercício cadastrado.
        </ThemedText>
      ) : filteredExercises.length === 0 ? (
        <ThemedText style={{ color: "#9CA3AF" }}>
          Nenhum exercício encontrado para "{searchQuery}".
        </ThemedText>
      ) : (
        <View style={{ gap: 12 }}>
          {filteredExercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              title={ex.title}
              type={ex.type === "weight" ? "Peso" : "Peso corporal"}
              description={ex.description}
              youtubeLink={ex.youtubeLink}
              imageUri={ex.imageUri}
              onPress={() => openFormFor(ex)}
              onEdit={() => openFormFor(ex)}
            />
          ))}
        </View>
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">
              Nova sessão de treino
            </ThemedText>

            {!!selectedExercise?.youtubeLink && (
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => {
                  // O ExerciseCard já trata abrir, aqui apenas exibimos o link
                  Alert.alert(
                    "Dica",
                    "Abra o vídeo pelo card do exercício na lista."
                  );
                }}
              >
                <IconSymbol name="play.circle.fill" color="#FF0000" size={18} />
                <ThemedText style={{ color: "#FF0000" }}>
                  Ver vídeo do exercício
                </ThemedText>
              </TouchableOpacity>
            )}

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                Repetições completas
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={placeholderColor}
                keyboardType="numeric"
                value={String(form.completeReps ?? 0)}
                onChangeText={(t) =>
                  setForm((p) => ({
                    ...p,
                    completeReps: Number(t.replace(/\D/g, "")) || 0,
                  }))
                }
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                  Negativas
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={String(form.negativeReps ?? 0)}
                  onChangeText={(t) =>
                    setForm((p) => ({
                      ...p,
                      negativeReps: Number(t.replace(/\D/g, "")) || 0,
                    }))
                  }
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                  Falhas
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={String(form.failedReps ?? 0)}
                  onChangeText={(t) =>
                    setForm((p) => ({
                      ...p,
                      failedReps: Number(t.replace(/\D/g, "")) || 0,
                    }))
                  }
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                  Séries
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={String(form.sets ?? 0)}
                  onChangeText={(t) =>
                    setForm((p) => ({
                      ...p,
                      sets: Number(t.replace(/\D/g, "")) || 0,
                    }))
                  }
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                  Peso (kg)
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType={
                    Platform.OS === "ios" ? "decimal-pad" : "numeric"
                  }
                  value={weightInput}
                  onChangeText={(t) => {
                    let normalized = t
                      .replace(",", ".")
                      .replace(/[^0-9.]/g, "");
                    const dotIndex = normalized.indexOf(".");
                    if (dotIndex !== -1) {
                      normalized =
                        normalized.slice(0, dotIndex + 1) +
                        normalized.slice(dotIndex + 1).replace(/\./g, "");
                    }
                    if (normalized.startsWith("."))
                      normalized = "0" + normalized;
                    setWeightInput(normalized);
                    setForm((p) => ({
                      ...p,
                      weight:
                        normalized === "" || normalized === "."
                          ? 0
                          : parseFloat(normalized),
                    }));
                  }}
                />
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                Descanso (s)
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="80"
                placeholderTextColor={placeholderColor}
                keyboardType="numeric"
                value={String(form.restTime ?? 80)}
                onChangeText={(t) =>
                  setForm((p) => ({
                    ...p,
                    restTime: Number(t.replace(/\D/g, "")) || 80,
                  }))
                }
              />
            </View>

            {selectedExercise && (
              <ThemedView style={styles.previewCard}>
                <ThemedText
                  lightColor="#FFFFFF"
                  darkColor="#FFFFFF"
                  style={{ fontWeight: "700" }}
                >
                  Prévia da carga total
                </ThemedText>
                <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">
                  Peso efetivo por rep: {previewEffectiveWeight} kg
                </ThemedText>
                <ThemedText
                  type="title"
                  lightColor="#FFFFFF"
                  darkColor="#FFFFFF"
                >
                  {previewTotalLoad} kg
                </ThemedText>
              </ThemedView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
                disabled={saving}
              >
                <ThemedText style={styles.cancelButtonText}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving || !selectedExercise}
              >
                <ThemedText style={styles.saveButtonText}>
                  {saving ? "Gravando..." : "Gravar sessão"}
                </ThemedText>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#0F172A",
    gap: 12,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  previewCard: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    gap: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 6,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  cancelButtonText: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#00110A",
    fontWeight: "700",
  },
  linkRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  reloadRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  reloadButton: {
    backgroundColor: "#1F2937",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  reloadButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  searchRow: {
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#FFFFFF",
  },
  headerImage: {
    height: 178,
    width: "100%",
    bottom: 0,
    position: "absolute",
  },
  instructionsRow: {
    marginTop: 32,
    marginBottom: 32,
  },
});
````

## File: app/_layout.tsx
````typescript
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
````

## File: app/modal.tsx
````typescript
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
````

## File: components/ui/collapsible.tsx
````typescript
import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 12,
  },
});
````

## File: components/ui/icon-symbol.ios.tsx
````typescript
import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
````

## File: components/ui/icon-symbol.tsx
````typescript
// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'pencil': 'edit',
  'trash': 'delete',
  'plus.circle.fill': 'add-circle',
  'chart.bar': 'bar-chart',
  'figure.strengthtraining.traditional': 'fitness-center',
  'play.circle.fill': 'play-circle-filled',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
````

## File: components/exercise-card.tsx
````typescript
import {
  Alert,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "react-native";

type ExerciseCardProps = {
  title: string;
  type: string;
  lastSessionSummary?: string;
  description?: string;
  youtubeLink?: string;
  onPress?: () => void;
  imageUri?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ExerciseCard({
  title,
  type,
  description,
  youtubeLink,
  onPress,
  imageUri,
  onEdit,
  onDelete,
}: ExerciseCardProps) {
  const theme = useColorScheme() ?? "light";
  const borderColor = theme === "light" ? "#1F2937" : "#1F2937";
  const iconColor = theme === "light" ? Colors.light.icon : Colors.dark.icon;

  const handleYoutubePress = async () => {
    if (!youtubeLink) return;

    try {
      const canOpen = await Linking.canOpenURL(youtubeLink);

      if (canOpen) {
        await Linking.openURL(youtubeLink);
      } else {
        await Linking.openURL(youtubeLink);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o link do YouTube");
    }
  };

  const getYouTubeVideoId = (rawUrl: string) => {
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.replace(/^www\./, "");

      if (host === "youtube.com" || host.endsWith(".youtube.com")) {
        const vParam = url.searchParams.get("v");
        if (vParam && /^[\w-]{11}$/.test(vParam)) return vParam;

        const parts = url.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1];
        if (last && /^[\w-]{11}$/.test(last)) return last;
      }

      if (host === "youtu.be") {
        const seg = url.pathname.split("/").filter(Boolean)[0];
        if (seg && /^[\w-]{11}$/.test(seg)) return seg;
      }
    } catch {}

    const regex =
      /(?:youtube\.com\/(?:.*[?&]v=|(?:shorts|embed|v)\/)|youtu\.be\/)([\w-]{11})/;
    const match = rawUrl.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;
  };

  const thumbnailUrl = youtubeLink ? getYouTubeThumbnail(youtubeLink) : null;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <ThemedView style={[styles.card, { borderColor, backgroundColor: theme === "dark" ? "#1F2937" : "#F9FAFB" }]}>
        <View style={styles.row}>
          <IconSymbol
            name="figure.strengthtraining.traditional"
            color={iconColor}
            size={20}
          />
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {title}
          </ThemedText>
          <View style={{ flex: 1 }} />
          {onEdit ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onEdit?.();
              }}
              style={styles.actionBtn}
              accessibilityLabel="Editar exercício"
            >
              <IconSymbol name="pencil" color={iconColor} size={18} />
            </TouchableOpacity>
          ) : null}
          {onDelete ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete?.();
              }}
              style={[styles.actionBtn, { marginLeft: 6 }]}
              accessibilityLabel="Excluir exercício"
            >
              <IconSymbol name="trash" color={iconColor} size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
        <ThemedText style={styles.meta}>{type}</ThemedText>

        {description ? (
          <ThemedText style={styles.description}>{description}</ThemedText>
        ) : null}

        {youtubeLink ? (
          <TouchableOpacity
            style={styles.youtubeContainer}
            onPress={handleYoutubePress}
            activeOpacity={0.7}
          >
            {thumbnailUrl && (
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.playButtonOverlay}>
                  <IconSymbol
                    name="play.circle.fill"
                    color="#FFFFFF"
                    size={40}
                  />
                </View>
              </View>
            )}
            <View style={styles.youtubeContent}>
              <View style={styles.youtubeRow}>
                <IconSymbol name="play.circle.fill" color="#FF0000" size={20} />
                <ThemedText style={styles.youtubeText}>
                  Assistir no YouTube
                </ThemedText>
              </View>
              <ThemedText style={styles.youtubeLink}>
                {youtubeLink
                  .replace("https://www.", "")
                  .replace("https://", "")}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ) : null}

        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
  },
  meta: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  summary: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  youtubeContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "rgba(255, 0, 0, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.1)",
  },
  thumbnailContainer: {
    position: "relative",
    marginBottom: 8,
  },
  thumbnail: {
    width: "100%",
    height: 120,
    borderRadius: 6,
  },
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 6,
  },
  youtubeContent: {
    flex: 1,
  },
  youtubeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  youtubeText: {
    fontSize: 14,
    color: "#FF0000",
    fontWeight: "600",
  },
  youtubeLink: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
});
````

## File: components/external-link.tsx
````typescript
import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
````

## File: components/haptic-tab.tsx
````typescript
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
````

## File: components/hello-wave.tsx
````typescript
import Animated from 'react-native-reanimated';

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      👋
    </Animated.Text>
  );
}
````

## File: components/parallax-scroll-view.tsx
````typescript
import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  contentStyle?: any;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  contentStyle,
}: Props) {
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor, flex: 1 }}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled">
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor[colorScheme] },
          headerAnimatedStyle,
        ]}>
        {headerImage}
      </Animated.View>
      <ThemedView style={[styles.content, contentStyle]}>{children}</ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
````

## File: components/themed-text.tsx
````typescript
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#8B5CF6',
  },
});
````

## File: components/themed-view.tsx
````typescript
import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
````

## File: constants/theme.ts
````typescript
/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#8B5CF6'; // roxo suave para acentos em light
const tintColorDark = '#8B5CF6'; // mesmo acento no dark para consistência

export const Colors = {
  light: {
    text: '#E5E7EB',
    background: '#0B0F14',
    tint: tintColorLight,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E5E7EB',
    background: '#0B0F14',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
````

## File: hooks/use-color-scheme.ts
````typescript
export { useColorScheme } from 'react-native';
````

## File: hooks/use-color-scheme.web.ts
````typescript
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
````

## File: hooks/use-theme-color.ts
````typescript
/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
````

## File: lib/db.ts
````typescript
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'my-exercise-app1.db';

// Abre (ou cria) o banco usando a API nova do expo-sqlite
export const db = SQLite.openDatabaseSync(DB_NAME);

// Cria a tabela de exercícios (caso não exista)
export async function initDb() {
  // Ativa FKs para integridade referencial futura
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      bodyweightPercentage REAL,
      youtubeLink TEXT,
      imageUri TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Tabela de sessões de treino - JÁ INCLUI totalLoad
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      exerciseId TEXT NOT NULL,
      date TEXT NOT NULL,
      completeReps INTEGER NOT NULL,
      negativeReps INTEGER NOT NULL,
      failedReps INTEGER NOT NULL,
      sets INTEGER NOT NULL,
      weight REAL NOT NULL,
      restTime INTEGER NOT NULL,
      totalLoad REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE RESTRICT
    );
  `);

  // Migração mais robusta para garantir a coluna totalLoad
  try {
    const result = await db.getAllAsync('PRAGMA table_info(workout_sessions);');
    const hasTotalLoad = result.some((column: any) => column.name === 'totalLoad');
    
    if (!hasTotalLoad) {
      console.log('Adicionando coluna totalLoad...');
      await db.execAsync('ALTER TABLE workout_sessions ADD COLUMN totalLoad REAL NOT NULL DEFAULT 0;');
    }
  } catch (error) {
    console.log('Erro na migração:', error);
    // Se falhar, tenta adicionar a coluna diretamente
    try {
      await db.execAsync('ALTER TABLE workout_sessions ADD COLUMN totalLoad REAL NOT NULL DEFAULT 0;');
    } catch {
      // Ignora erro se a coluna já existir
    }
  }
}

// Insere um exercício
export async function insertExercise(record: {
  id: string;
  title: string;
  description: string | null;
  type: string;
  bodyweightPercentage: number | null;
  youtubeLink: string | null;
  imageUri: string | null;
  createdAt: string;
  updatedAt: string;
}): Promise<void> {
  await db.runAsync(
    `INSERT INTO exercises (
      id, title, description, type, bodyweightPercentage, youtubeLink, imageUri, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      record.id,
      record.title,
      record.description,
      record.type,
      record.bodyweightPercentage,
      record.youtubeLink,
      record.imageUri,
      record.createdAt,
      record.updatedAt,
    ]
  );
}

// Seleciona todos os exercícios (ordem: mais recentes primeiro)
export async function selectAllExercises(): Promise<any[]> {
  const rows = await (db as any).getAllAsync?.(
    'SELECT * FROM exercises ORDER BY datetime(createdAt) DESC;'
  );
  if (rows) return rows;
  const res = await (db as any).runAsync?.(
    'SELECT * FROM exercises ORDER BY datetime(createdAt) DESC;'
  );
  return (res as any)?.rows ?? [];
}

// Atualiza um exercício por id
export async function updateExercise(record: {
  id: string;
  title: string;
  description: string | null;
  type: string;
  bodyweightPercentage: number | null;
  youtubeLink: string | null;
  imageUri: string | null;
  updatedAt: string;
}): Promise<void> {
  await db.runAsync(
    `UPDATE exercises
     SET title = ?, description = ?, type = ?, bodyweightPercentage = ?, youtubeLink = ?, imageUri = ?, updatedAt = ?
     WHERE id = ?;`,
    [
      record.title,
      record.description,
      record.type,
      record.bodyweightPercentage,
      record.youtubeLink,
      record.imageUri,
      record.updatedAt,
      record.id,
    ]
  );
}

// Deleta um exercício por id
export async function deleteExerciseById(id: string): Promise<void> {
  await db.runAsync('DELETE FROM exercises WHERE id = ?;', [id]);
}

// Insere uma sessão de treino
export async function insertWorkoutSession(record: {
  id: string;
  exerciseId: string;
  date: string; // ISO
  completeReps: number;
  negativeReps: number;
  failedReps: number;
  sets: number;
  weight: number;
  restTime: number;
  totalLoad: number;
}): Promise<void> {
  await db.runAsync(
    `INSERT INTO workout_sessions (
      id, exerciseId, date, completeReps, negativeReps, failedReps, sets, weight, restTime, totalLoad
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      record.id,
      record.exerciseId,
      record.date,
      record.completeReps,
      record.negativeReps,
      record.failedReps,
      record.sets,
      record.weight,
      record.restTime,
      record.totalLoad,
    ]
  );
}

// Seleciona sessões por exercício
export async function selectWorkoutSessionsByExercise(exerciseId: string): Promise<any[]> {
  const rows = await (db as any).getAllAsync?.(
    'SELECT * FROM workout_sessions WHERE exerciseId = ? ORDER BY datetime(date) DESC;',
    [exerciseId]
  );
  if (rows) return rows;
  const res = await (db as any).runAsync?.(
    'SELECT * FROM workout_sessions WHERE exerciseId = ? ORDER BY datetime(date) DESC;',
    [exerciseId]
  );
  return (res as any)?.rows ?? [];
}

// Seleciona sessões por período (opcionalmente filtrando por exercício)
export async function selectWorkoutSessionsBetweenDates(
  startIso: string,
  endIso: string,
  exerciseId?: string
): Promise<any[]> {
  if (exerciseId) {
    const rows = await (db as any).getAllAsync?.(
      'SELECT * FROM workout_sessions WHERE exerciseId = ? AND datetime(date) BETWEEN datetime(?) AND datetime(?) ORDER BY datetime(date) ASC;',
      [exerciseId, startIso, endIso]
    );
    if (rows) return rows;
    const res = await (db as any).runAsync?.(
      'SELECT * FROM workout_sessions WHERE exerciseId = ? AND datetime(date) BETWEEN datetime(?) AND datetime(?) ORDER BY datetime(date) ASC;',
      [exerciseId, startIso, endIso]
    );
    return (res as any)?.rows ?? [];
  }

  const rows = await (db as any).getAllAsync?.(
    'SELECT * FROM workout_sessions WHERE datetime(date) BETWEEN datetime(?) AND datetime(?) ORDER BY datetime(date) ASC;',
    [startIso, endIso]
  );
  if (rows) return rows;
  const res = await (db as any).runAsync?.(
    'SELECT * FROM workout_sessions WHERE datetime(date) BETWEEN datetime(?) AND datetime(?) ORDER BY datetime(date) ASC;',
    [startIso, endIso]
  );
  return (res as any)?.rows ?? [];
}
````

## File: lib/exercises-repo.ts
````typescript
import { ExerciseFormData, Exercise } from '@/types/entities';
import { initDb, insertExercise, selectAllExercises, updateExercise, deleteExerciseById } from '@/lib/db';

function createId(): string {
  return 'ex_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ensureDb() {
  initDb();
}

export async function createExerciseFromForm(form: ExerciseFormData): Promise<Exercise> {
  const now = new Date();
  const id = createId();

  const exercise: Exercise = {
    id,
    title: form.title.trim(),
    description: form.description?.trim() || undefined,
    type: form.type,
    bodyweightPercentage: form.type === 'bodyweight' ? form.bodyweightPercentage : undefined,
    youtubeLink: form.youtubeLink?.trim() || undefined,
    imageUri: form.imageUri?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  await insertExercise({
    id: exercise.id,
    title: exercise.title,
    description: exercise.description ?? null,
    type: exercise.type,
    bodyweightPercentage: exercise.bodyweightPercentage ?? null,
    youtubeLink: exercise.youtubeLink ?? null,
    imageUri: exercise.imageUri ?? null,
    createdAt: exercise.createdAt.toISOString(),
    updatedAt: exercise.updatedAt.toISOString(),
  });

  return exercise;
}

function mapRowToExercise(row: any): Exercise {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    bodyweightPercentage: row.bodyweightPercentage ?? undefined,
    youtubeLink: row.youtubeLink ?? undefined,
    imageUri: row.imageUri ?? undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export async function getAllExercises(): Promise<Exercise[]> {
  const rows = await selectAllExercises();
  return rows.map(mapRowToExercise);
}

export async function updateExerciseFromForm(id: string, form: ExerciseFormData): Promise<Exercise> {
  const now = new Date();
  const record = {
    id,
    title: form.title.trim(),
    description: (form.description?.trim() || null) as string | null,
    type: form.type,
    bodyweightPercentage: form.type === 'bodyweight' ? (form.bodyweightPercentage ?? null) : null,
    youtubeLink: (form.youtubeLink?.trim() || null) as string | null,
    imageUri: (form.imageUri?.trim() || null) as string | null,
    updatedAt: now.toISOString(),
  };
  await updateExercise(record);
  // Retorna o modelo atualizado
  return {
    id,
    title: record.title,
    description: record.description ?? undefined,
    type: record.type as Exercise['type'],
    bodyweightPercentage: record.bodyweightPercentage ?? undefined,
    youtubeLink: record.youtubeLink ?? undefined,
    imageUri: record.imageUri ?? undefined,
    createdAt: now, // não temos o createdAt aqui; idealmente buscar do banco. Vamos manter now para consistência temporária
    updatedAt: now,
  };
}

export async function deleteExercise(id: string): Promise<void> {
  await deleteExerciseById(id);
}
````

## File: lib/workout-sessions-repo.ts
````typescript
import { Exercise, WorkoutSession, WorkoutSessionFormData } from '@/types/entities';
import { initDb, insertWorkoutSession, selectWorkoutSessionsByExercise, selectWorkoutSessionsBetweenDates } from '@/lib/db';

function createId(): string {
  return 'ws_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ensureDb() {
  initDb();
}

export function calculateEffectiveWeight(exercise: Exercise, weight: number): number {
  if (exercise.type === 'bodyweight') {
    const pct = (exercise.bodyweightPercentage ?? 0) / 100;
    return weight * pct;
  }
  return weight;
}

// Segue o ajuste solicitado: falha = 60% de 1 rep; negativa = 70% de 1 rep
export function calculateEffectiveReps(form: WorkoutSessionFormData): number {
  const full = Math.max(0, form.completeReps || 0);
  const failed = Math.max(0, form.failedReps || 0) * 0.6;
  const negative = Math.max(0, form.negativeReps || 0) * 0.7;
  return full + failed + negative;
}

export function calculateTotalLoad(exercise: Exercise, form: WorkoutSessionFormData): number {
  const base = calculateEffectiveWeight(exercise, form.weight || 0);
  const effReps = calculateEffectiveReps(form);
  const sets = Math.max(1, form.sets || 1);
  const total = base * effReps * sets;
  // arredonda para 2 casas decimais
  return Math.round(total * 100) / 100;
}

export async function createWorkoutSessionFromForm(
  exercise: Exercise,
  form: WorkoutSessionFormData
): Promise<WorkoutSession> {
  const id = createId();
  const date = new Date();
  const totalLoad = calculateTotalLoad(exercise, form);

  await insertWorkoutSession({
    id,
    exerciseId: exercise.id,
    date: date.toISOString(),
    completeReps: Math.max(0, form.completeReps || 0),
    negativeReps: Math.max(0, form.negativeReps || 0),
    failedReps: Math.max(0, form.failedReps || 0),
    sets: Math.max(1, form.sets || 1),
    weight: form.weight || 0,
    restTime: form.restTime || 80,
    totalLoad,
  });

  const session: WorkoutSession = {
    id,
    exerciseId: exercise.id,
    date,
    repetitionMetrics: {
      completeReps: Math.max(0, form.completeReps || 0),
      negativeReps: Math.max(0, form.negativeReps || 0),
      failedReps: Math.max(0, form.failedReps || 0),
    },
    sets: Math.max(1, form.sets || 1),
    weight: form.weight || 0,
    restTime: form.restTime || 80,
    totalLoad,
  };

  return session;
}

function mapRowToWorkoutSession(row: any): WorkoutSession {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    date: new Date(row.date),
    repetitionMetrics: {
      completeReps: row.completeReps ?? 0,
      negativeReps: row.negativeReps ?? 0,
      failedReps: row.failedReps ?? 0,
    },
    sets: row.sets ?? 0,
    weight: row.weight ?? 0,
    restTime: row.restTime ?? 0,
    totalLoad: row.totalLoad ?? 0,
  };
}

export async function getSessionsByExercise(exerciseId: string): Promise<WorkoutSession[]> {
  const rows = await selectWorkoutSessionsByExercise(exerciseId);
  return rows.map(mapRowToWorkoutSession);
}

export async function getSessionsBetweenDates(
  start: Date,
  end: Date,
  exerciseId?: string
): Promise<WorkoutSession[]> {
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const rows = await selectWorkoutSessionsBetweenDates(startIso, endIso, exerciseId);
  return rows.map(mapRowToWorkoutSession);
}
````

## File: scripts/reset-project.js
````javascript
#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves the /app, /components, /hooks, /scripts, and /constants directories to /app-example based on user input and creates a new /app directory with an index.tsx and _layout.tsx file.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const root = process.cwd();
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];
const exampleDir = "app-example";
const newAppDir = "app";
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput) => {
  try {
    if (userInput === "y") {
      // Create the app-example directory
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    // Move old directories to new app-example directory or delete them
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} moved to /${exampleDir}/${dir}.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} deleted.`);
        }
      } else {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    // Create new /app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 New /app directory created.");

    // Create index.tsx
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 app/index.tsx created.");

    // Create _layout.tsx
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 app/_layout.tsx created.");

    console.log("\n✅ Project reset complete. Next steps:");
    console.log(
      `1. Run \`npx expo start\` to start a development server.\n2. Edit app/index.tsx to edit the main screen.${
        userInput === "y"
          ? `\n3. Delete the /${exampleDir} directory when you're done referencing it.`
          : ""
      }`
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${error.message}`);
  }
};

rl.question(
  "Do you want to move existing files to /app-example instead of deleting them? (Y/n): ",
  (answer) => {
    const userInput = answer.trim().toLowerCase() || "y";
    if (userInput === "y" || userInput === "n") {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
      rl.close();
    }
  }
);
````

## File: types/entities.ts
````typescript
// Tipos base para o aplicativo
export type ExerciseType = 'weight' | 'bodyweight';
export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

// Tipos para cálculo de repetições
export interface RepetitionMetrics {
  completeReps: number;
  negativeReps: number;
  failedReps: number;
}

// Tipos para sessões de treino
export interface WorkoutSession {
  id: string;
  exerciseId: string;
  date: Date;
  repetitionMetrics: RepetitionMetrics;
  sets: number;
  weight: number; // em kg
  restTime: number; // em segundos
  totalLoad: number; // em kg (calculado)
}

// Tipos para exercícios
export interface Exercise {
  id: string;
  title: string;
  description?: string;
  type: ExerciseType;
  bodyweightPercentage?: number; // apenas para tipo 'bodyweight'
  youtubeLink?: string;
  imageUri?: string; // URI da imagem local ou URL
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para estatísticas e progresso
export interface ProgressStats {
  evolutionPercentage: number;
  startingTotalLoad: number;
  endingTotalLoad: number;
  firstSessionDate: Date;
  lastSessionDate: Date;
}

export interface TopSession {
  rank: number;
  session: WorkoutSession;
  exercise: Exercise;
}

export interface DateRange {
  preset: DateRangePreset;
  startDate?: Date; // apenas para 'custom'
  endDate?: Date; // apenas para 'custom'
}

// Tipos para formulários
export interface ExerciseFormData {
  title: string;
  description: string;
  type: ExerciseType;
  bodyweightPercentage?: number;
  youtubeLink?: string;
  imageUri?: string;
}

export interface WorkoutSessionFormData {
  completeReps: number;
  negativeReps: number;
  failedReps: number;
  sets: number;
  weight: number;
  restTime: number; // padrão: 80
}

// Tipos para navegação e estado
export interface StatisticsFilters {
  exerciseId: string;
  dateRange: DateRange;
  topCount: number; // quantidade de tops a mostrar
}

// Utility types para cálculos
export interface CalculatedMetrics {
  effectiveSets: number;
  totalLoad: number;
}
````

## File: .gitignore
````
# Learn more https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files

# dependencies
node_modules/

# Expo
.expo/
dist/
web-build/
expo-env.d.ts

# Native
.kotlin/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env*.local

# typescript
*.tsbuildinfo

app-example

# generated native folders
/ios
/android
````

## File: app.json
````json
{
  "expo": {
    "name": "my-exercise-app1",
    "slug": "my-exercise-app1",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myexerciseapp1",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
````

## File: eslint.config.js
````javascript
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
]);
````

## File: package.json
````json
{
  "name": "my-exercise-app1",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.2",
    "@react-navigation/bottom-tabs": "^7.4.0",
    "@react-navigation/elements": "^2.6.3",
    "@react-navigation/native": "^7.1.8",
    "expo": "~54.0.12",
    "expo-constants": "~18.0.9",
    "expo-font": "~14.0.8",
    "expo-haptics": "~15.0.7",
    "expo-image": "~3.0.8",
    "expo-image-picker": "^17.0.8",
    "expo-linking": "~8.0.8",
    "expo-router": "~6.0.10",
    "expo-splash-screen": "~31.0.10",
    "expo-sqlite": "^16.0.8",
    "expo-status-bar": "~3.0.8",
    "expo-symbols": "~1.0.7",
    "expo-system-ui": "~6.0.7",
    "expo-web-browser": "~15.0.8",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.4",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.5.1"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "eslint": "^9.25.0",
    "eslint-config-expo": "~10.0.0",
    "typescript": "~5.9.2"
  },
  "private": true
}
````

## File: README.md
````markdown
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
````

## File: specifications.md
````markdown
Estou criando um `App EXPO React Native`. Ele será um aplicativo `Android` para registrar meus exercícios de musculação. Ele terá estas abas:

## Exercícios

---

Nesta aba terei uma listagem de todos exercícios. Ao escolher um exercício, irei preencher um formulário com:

```markdown
- Quantas repetições completas
- Quantas repetições negativas (só excêntricas)
- Quantas repetições falharam na concêntrica
- Quantas séries
- Peso utilizado (kg)
- Tempo de descanso (padrão: 80s)
```

`Observação`: séries com repetições negativas valem 60% de uma série completa e com falha concêntrica vale 40%.

Ao colocar em “Gravar sessão”, será gravado uma “sessão de treino”. Que ficará algo assim:

```markdown
- peso total levantado
- data (com horas também)
- tempo de descanso
- repetições
- séries 
```

Ao clicar em um exercício, um FORM será aberto. Antes dos campos terá um LINK que poderei clicar e ver o vídeo no `YouTube` de exemplo. Claro, esse LINK só aparecerá se eu tiver colocado ele na hora da criação ou edição do exercício. 

Outra informação que terá que é lá embaixo antes de eu gravar, terá o quanto de carga total estarei gravando se caso eu clicar em “Gravar Sessão”.

## Edição

---

Aqui será onde irei criar exercícios novos, editar ou deletar. No FORM de criação deve ter:

```markdown
- Título
- Descrição
- Se é peso normal ou peso corporal
- Se for peso corporal quantos por cento cada repetição equivale do peso
- Link do YouTube (opcional)
- Link da imagem ou mesmo carregar do dispositivo (opcional)
```

Como funciona o peso corporal que falei acima: vamos supor que criei o exercício “Flexão” e coloquei que é do tipo `peso corporal` e que equivale a 70% do peso. Se caso, por exemplo, eu gravar uma sessão de 2 flexões e coloquei 100 KILOS no peso levantando, então o cálculo será:

```markdown
 - (70% de 100) * 2 = 140 KILOS
```

## Estatísticas

---

Esta aba é feita para eu ver meu progresso. Nela irei escolher um dos exercícios e um `intervalo de datas` . Esse intervalo de datas terá as opções:

```markdown
- De hoje até 7 dias atrás
- De hoje até 30 dias atrás
- De hoje até 90 dias atrás
- Personalizado (escolher datas)
```

Depois de escolhida as datas, então irá mostrar:

1. Um CARD com informações de progresso deste exercício selecionado.
2. Listagem dos TOPS registros de sessões deste exercício selecionado (escolho a quantidade).

### 1 - CARD de progresso

---

O CARD com informações de progresso terá algo assim: vamos supor, por exemplo, que eu selecionei o período de `“Últimos 7 dias”`. Durante esse período, comecei com uma sessão de `total de carga` de 140 KILOS e terminei com 280 KILOS na última sessão gravada. Neste caso, eu terei um CARD de progresso assim:

```markdown
- Evolução: 100.000% (se for positiva fica verde, se for negativa fica vermelho)
- Começou com carga total: 140 KILOS (data da primeira sessão)
- Terminou com carga total: 280 KILOS (data da última sessão)
```

### 2 - Listagem dos TOPS

---

Aqui irá ficar uma listagem com as sessões por ordem de `carga total puxada`. Por exemplo:

```markdown
# 1
- Exercício: Flexão
- Carga total: 280 KILOS
- Data: 05/10/2025 às 17:00
- Repetições: 2
- Séries: 2
```

```markdown
# 2
- Exercício: Flexão
- Carga total: 140 KILOS
- Data: 03/10/2025 às 17:33
- Repetições: 2
- Séries: 2
```

```markdown
# 3
- Exercício: Flexão
- Carga total: 120 KILOS
- Data: 01/10/2025 às 17:36
- Repetições: 2
- Séries: 2
```

Cada um desses “CARDS” eu posso editar ou deletar ou seja, no fundo estou deletando ou editando uma `sessão gravada`.
````

## File: tsconfig.json
````json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
````
