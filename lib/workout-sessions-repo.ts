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