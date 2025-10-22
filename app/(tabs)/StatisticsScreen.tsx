import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View, Pressable, ScrollView, TextInput, TouchableWithoutFeedback } from 'react-native'

import ParallaxScrollView from '@/components/parallax-scroll-view'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { db } from '@/lib/db'
import { ensureDb as ensureWorkoutDb } from '@/lib/workout-sessions-repo'
import { getAllExercises, ensureDb as ensureExercisesDb } from '@/lib/exercises-repo'

export default function StatisticsScreen() {
  const colorScheme = useColorScheme() ?? 'light'

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [records, setRecords] = useState<Array<{
    id: string
    rank: number
    exerciseTitle: string
    date: Date
    completeReps: number
    sets: number
    totalLoad: number
  }>>([])
  const [exercises, setExercises] = useState<Array<{id: string, title: string}>>([])
  const [selectedExercise, setSelectedExercise] = useState<string>('Todos')
  const [searchText, setSearchText] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const [filteredExercises, setFilteredExercises] = useState<Array<{id: string, title: string}>>([])
  const [selectedExerciseTitle, setSelectedExerciseTitle] = useState<string>('Todos')

  async function fetchRecords(exerciseFilter: string) {
    setLoading(true)
    setError(null)
    try {
      ensureWorkoutDb()
      const where = exerciseFilter === 'Todos' ? '' : 'WHERE ex.id = ?'
      const params = exerciseFilter === 'Todos' ? [] : [exerciseFilter]
      const rows = await (db as any).getAllAsync?.(
        `SELECT ws.id, ws.exerciseId, ws.date, ws.completeReps, ws.sets, ws.totalLoad, ex.title as exerciseTitle
         FROM workout_sessions ws
         JOIN exercises ex ON ex.id = ws.exerciseId
         ${where}
         ORDER BY ws.totalLoad DESC
         LIMIT 30;`,
         params
      )
      const arr = (rows ?? []).map((r: any, idx: number) => ({
        id: r.id,
        rank: idx + 1,
        exerciseTitle: r.exerciseTitle,
        date: new Date(r.date),
        completeReps: Number(r.completeReps ?? 0),
        sets: Number(r.sets ?? 0),
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
    <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
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
              </ThemedView>
            );
          })}
        </View>
      )}
      </ParallaxScrollView>
    </TouchableWithoutFeedback>
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
  }
})