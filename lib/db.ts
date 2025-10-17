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

  // Tabela de sessões de treino
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
      totalLoad REAL NOT NULL,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE RESTRICT
    );
  `);
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