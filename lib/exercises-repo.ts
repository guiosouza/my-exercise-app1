import { ExerciseFormData, Exercise } from '@/types/entities';
import { initDb, insertExercise } from '@/lib/db';

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