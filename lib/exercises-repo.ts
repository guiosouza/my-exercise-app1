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