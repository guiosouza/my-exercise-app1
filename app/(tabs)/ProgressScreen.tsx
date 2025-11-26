import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDb } from '@/lib/db';
import { ensureDb as ensureExercisesDb, getAllExercises } from '@/lib/exercises-repo';
import { getSessionsBetweenDates } from '@/lib/workout-sessions-repo';
import type { Exercise, WorkoutSession } from '@/types/entities';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [reloading, setReloading] = useState<boolean>(false);
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

  async function reloadExercises() {
    try {
      setReloading(true);
      const list = await getAllExercises();
      setExercises(list);
      if (selectedExerciseId && !list.some((e) => e.id === selectedExerciseId)) {
        setSelectedExerciseId(null);
      }
    } catch (e) {
      // noop
    } finally {
      setReloading(false);
    }
  }

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
      // headerImage={<ThemedView style={{ height: 1 }} />}
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
          <View style={[styles.row, { marginTop: 8, justifyContent: 'flex-end' }]}>
            <TouchableOpacity style={styles.clearBtn} onPress={reloadExercises} disabled={reloading}>
              <ThemedText style={{ color: '#FFFFFF' }}>{reloading ? 'Recarregando...' : 'Recarregar exercícios'}</ThemedText>
            </TouchableOpacity>
          </View>
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