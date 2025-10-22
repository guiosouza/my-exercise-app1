import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

import ParallaxScrollView from '@/components/parallax-scroll-view'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { db } from '@/lib/db'
import { ensureDb as ensureExercisesDb, getAllExercises } from '@/lib/exercises-repo'
import { calculateTotalLoad, ensureDb as ensureWorkoutDb } from '@/lib/workout-sessions-repo'

export default function StatisticsScreen() {
  const colorScheme = useColorScheme() ?? 'light'

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [records, setRecords] = useState<Array<{
    id: string
    exerciseId: string
    rank: number
    exerciseTitle: string
    exerciseType: string | null
    exerciseBodyweightPercentage: number | null
    date: Date
    completeReps: number
    negativeReps: number
    failedReps: number
    sets: number
    weight: number
    restTime: number
    totalLoad: number
  }>>([])
  const [exercises, setExercises] = useState<Array<{id: string, title: string}>>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('Todos')
  const [searchText, setSearchText] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const [filteredExercises, setFilteredExercises] = useState<Array<{id: string, title: string}>>([])
  const [selectedExerciseTitle, setSelectedExerciseTitle] = useState<string>('Todos')

  // Edição de sessão
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [editForm, setEditForm] = useState<{ completeReps: number, negativeReps: number, failedReps: number, sets: number, weight: number, restTime: number }>({ completeReps: 0, negativeReps: 0, failedReps: 0, sets: 0, weight: 0, restTime: 80 })
  const [editWeightInput, setEditWeightInput] = useState<string>('0')
  const [savingEdit, setSavingEdit] = useState<boolean>(false)

  async function fetchRecords(exerciseFilter: string) {
    setLoading(true)
    setError(null)
    try {
      ensureWorkoutDb()
      const where = exerciseFilter === 'Todos' ? '' : 'WHERE ex.id = ?'
      const params = exerciseFilter === 'Todos' ? [] : [exerciseFilter]
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
      )
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
      }))
      setRecords(arr)
    } catch (e) {
      setError('Não foi possível carregar estatísticas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true)
      setError(null)
      try {
        ensureExercisesDb()
        const exs = await getAllExercises()
        const exerciseList = exs.map(e => ({id: e.id, title: e.title})).sort((a, b) => a.title.localeCompare(b.title))
        const allExercises = [{id: 'Todos', title: 'Todos'}, ...exerciseList]
        setExercises(allExercises)
        setFilteredExercises(allExercises)
        setSearchText('Todos')
        await fetchRecords(selectedExercise)
      } catch (e) {
        setError('Não foi possível carregar estatísticas e tipos.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    fetchRecords(selectedExercise)
  }, [selectedExercise])

  // Função para filtrar exercícios baseado no texto de busca
  const handleSearchChange = (text: string) => {
    setSearchText(text)
    if (text.trim() === '') {
      setFilteredExercises(exercises)
    } else {
      const filtered = exercises.filter(ex => 
        ex.title.toLowerCase().includes(text.toLowerCase())
      )
      setFilteredExercises(filtered)
    }
    setShowDropdown(true)
  }

  // Função para selecionar um exercício
  const handleSelectExercise = (exercise: {id: string, title: string}) => {
    setSelectedExercise(exercise.id)
    setSelectedExerciseTitle(exercise.title)
    setSearchText(exercise.title)
    setShowDropdown(false)
  }

  const secondLoad = records.length > 1 ? records[1].totalLoad : 0
  const firstImprovementPct = records.length > 1 && secondLoad > 0
    ? Math.round(((records[0].totalLoad - secondLoad) / secondLoad) * 1000) / 10 // 0.1% precision
    : null

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#0F172A', dark: '#0F172A' }}
        headerImage={<ThemedView style={{ height: 1 }} />}
        contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
      >
        <ThemedView style={styles.section}>
          <ThemedText type="title">Top 30 Recordes de exercício</ThemedText>
          <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">Ordenado por peso total puxado</ThemedText>
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
              setShowDropdown(true)
              if (searchText === selectedExerciseTitle) {
                setSearchText('')
                setFilteredExercises(exercises)
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
                     style={[styles.dropdownItem, selectedExercise === item.id && styles.dropdownItemSelected]}
                     onPress={() => handleSelectExercise(item)}
                   >
                     <ThemedText style={[styles.dropdownText, selectedExercise === item.id && styles.dropdownTextSelected]}>
                       {item.title}
                     </ThemedText>
                   </Pressable>
                 ))}
               </ScrollView>
             </View>
           )}
        </View>
        <Pressable onPress={() => fetchRecords(selectedExercise)} style={styles.reloadButton}>
          <ThemedText style={styles.reloadText}>Recarregar</ThemedText>
        </Pressable>
      </View>

      {loading && (
        <View style={[styles.row, { alignItems: 'center' }] }>
          <ActivityIndicator />
          <ThemedText style={{ marginLeft: 8 }}>Carregando...</ThemedText>
        </View>
      )}

      {!!error && (
        <ThemedText style={{ color: '#EF4444' }}>{error}</ThemedText>
      )}

      {!loading && !error && records.length === 0 && (
        <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">Nenhuma sessão registrada para este filtro.</ThemedText>
      )}

      {!loading && !error && records.length > 0 && (
        <View style={{ gap: 12 }}>
          {records.map((rec, idx) => {
            const next = records[idx + 1];
            const improvementPct = next && next.totalLoad > 0
              ? Math.round(((rec.totalLoad - next.totalLoad) / next.totalLoad) * 1000) / 10
              : null;
            return (
              <ThemedView key={rec.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <ThemedText style={styles.rankText}>#{rec.rank}</ThemedText>
                  <ThemedText type="defaultSemiBold">{rec.exerciseTitle}</ThemedText>
                </View>
                <View style={{ gap: 4 }}>
                  <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">Data: {rec.date.toLocaleDateString()}</ThemedText>
                  <View style={styles.row}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Repetições completas: {rec.completeReps}</ThemedText>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF"> · Séries: {rec.sets}</ThemedText>
                  </View>
                  <View style={styles.totalRow}>
                    <ThemedText style={styles.totalLabel}>Peso total puxado</ThemedText>
                    <ThemedText style={styles.totalValue}>{rec.totalLoad} kg</ThemedText>
                  </View>
                  {improvementPct !== null && (
                    <ThemedText style={styles.improvementText}>
                      {improvementPct}% melhor que o #{rec.rank + 1} lugar
                    </ThemedText>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => {
                    setEditingRecord(rec)
                    setEditForm({
                      completeReps: rec.completeReps,
                      negativeReps: rec.negativeReps ?? 0,
                      failedReps: rec.failedReps ?? 0,
                      sets: rec.sets,
                      weight: rec.weight ?? 0,
                      restTime: rec.restTime ?? 80,
                    })
                    setEditWeightInput(String(rec.weight ?? 0))
                    setIsEditModalVisible(true)
                  }}>
                    <ThemedText style={styles.editButtonText}>Editar</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => {
                    Alert.alert('Confirmar', 'Deseja excluir esta sessão?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: async () => {
                        try {
                          await (db as any).runAsync?.('DELETE FROM workout_sessions WHERE id = ?;', [rec.id])
                          await fetchRecords(selectedExercise)
                        } catch (e) {
                          Alert.alert('Erro', 'Não foi possível excluir a sessão.')
                        }
                      } },
                    ])
                  }}>
                    <ThemedText style={styles.deleteButtonText}>Excluir</ThemedText>
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
            <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">Editar sessão</ThemedText>
 
            {editingRecord && (
              <>
                <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">{editingRecord.exerciseTitle} · {editingRecord.date.toLocaleDateString()}</ThemedText>
 
                <View style={styles.field}>
                  <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Repetições completas</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={String(editForm.completeReps ?? 0)}
                    onChangeText={(t) => setEditForm((p) => ({ ...p, completeReps: Number(t.replace(/\D/g, '')) || 0 }))}
                  />
                </View>
 
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Negativas</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={String(editForm.negativeReps ?? 0)}
                      onChangeText={(t) => setEditForm((p) => ({ ...p, negativeReps: Number(t.replace(/\D/g, '')) || 0 }))}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Falhas</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={String(editForm.failedReps ?? 0)}
                      onChangeText={(t) => setEditForm((p) => ({ ...p, failedReps: Number(t.replace(/\D/g, '')) || 0 }))}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Séries</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={String(editForm.sets ?? 0)}
                      onChangeText={(t) => setEditForm((p) => ({ ...p, sets: Number(t.replace(/\D/g, '')) || 0 }))}
                    />
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Peso (kg)</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                      value={editWeightInput}
                      onChangeText={(t) => {
                        let normalized = t.replace(',', '.').replace(/[^0-9.]/g, '');
                        const dotIndex = normalized.indexOf('.');
                        if (dotIndex !== -1) {
                          normalized = normalized.slice(0, dotIndex + 1) + normalized.slice(dotIndex + 1).replace(/\./g, '');
                        }
                        if (normalized.startsWith('.')) normalized = '0' + normalized;
                        setEditWeightInput(normalized);
                        setEditForm((p) => ({ ...p, weight: normalized === '' || normalized === '.' ? 0 : parseFloat(normalized) }));
                      }}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Descanso (s)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="80"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={String(editForm.restTime ?? 80)}
                    onChangeText={(t) => setEditForm((p) => ({ ...p, restTime: Number(t.replace(/\D/g, '')) || 80 }))}
                  />
                </View>

                {/* Prévia do totalLoad */}
                <ThemedView style={styles.previewCard}>
                  <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF" style={{ fontWeight: '700' }}>Prévia da carga total</ThemedText>
                  <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">
                    {(() => {
                      const ex = { id: editingRecord.exerciseId, title: editingRecord.exerciseTitle, type: editingRecord.exerciseType, bodyweightPercentage: editingRecord.exerciseBodyweightPercentage, description: undefined, youtubeLink: undefined, imageUri: undefined, createdAt: new Date(), updatedAt: new Date() } as any
                      return calculateTotalLoad(ex, editForm)
                    })()} kg
                  </ThemedText>
                </ThemedView>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditModalVisible(false)} disabled={savingEdit}>
                    <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={async () => {
                    if (!editingRecord) return
                    try {
                      setSavingEdit(true)
                      const ex = { id: editingRecord.exerciseId, title: editingRecord.exerciseTitle, type: editingRecord.exerciseType, bodyweightPercentage: editingRecord.exerciseBodyweightPercentage, description: undefined, youtubeLink: undefined, imageUri: undefined, createdAt: new Date(), updatedAt: new Date() } as any
                      const newTotal = calculateTotalLoad(ex, editForm)
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
                      )
                      setIsEditModalVisible(false)
                      setSavingEdit(false)
                      await fetchRecords(selectedExercise)
                    } catch (e) {
                      setSavingEdit(false)
                      Alert.alert('Erro', 'Não foi possível salvar alterações.')
                    }
                  }} disabled={savingEdit}>
                    <ThemedText style={styles.saveButtonText}>{savingEdit ? 'Salvando...' : 'Salvar'}</ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>
    </View>
   )
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  autocompleteContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#374151',
  },
  dropdown: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
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
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#EBF4FF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  reloadButton: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  reloadText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  recordCard: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.08)'
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  rankText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
  },
  totalLabel: {
    color: '#9CA3AF',
  },
  totalValue: {
    color: Colors['light'].tint,
    fontWeight: '700',
    fontSize: 18,
  },
  improvementText: {
    color: '#10B981',
    marginTop: 6,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '700',
  },
  // Estilos do modal de edição
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
    padding: 12,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 6,
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
  previewCard: {
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
})