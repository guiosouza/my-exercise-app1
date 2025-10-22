import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import ParallaxScrollView from '@/components/parallax-scroll-view'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { db } from '@/lib/db'
import { ensureDb as ensureWorkoutDb } from '@/lib/workout-sessions-repo'

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

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        ensureWorkoutDb()
        const rows = await (db as any).getAllAsync?.(
          `SELECT ws.id, ws.exerciseId, ws.date, ws.completeReps, ws.sets, ws.totalLoad, ex.title as exerciseTitle
           FROM workout_sessions ws
           JOIN exercises ex ON ex.id = ws.exerciseId
           ORDER BY ws.totalLoad DESC
           LIMIT 30;`
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
    load()
  }, [])

  const secondLoad = records.length > 1 ? records[1].totalLoad : 0
  const firstImprovementPct = records.length > 1 && secondLoad > 0
    ? Math.round(((records[0].totalLoad - secondLoad) / secondLoad) * 1000) / 10 // 0.1% precision
    : null

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0F172A', dark: '#0F172A' }}
      headerImage={<ThemedView style={{ height: 1 }} />}
      contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
    >
      <ThemedView style={styles.section}>
        <ThemedText type="title">Top 30 Recordes de exercício</ThemedText>
        <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">Ordenado por peso total puxado</ThemedText>
      </ThemedView>

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
        <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">Nenhuma sessão registrada ainda.</ThemedText>
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