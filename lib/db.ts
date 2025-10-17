import * as SQLite from 'expo-sqlite';

const DB_NAME = 'my-exercise-app1.db';

// Abre (ou cria) o banco usando a API nova do expo-sqlite
export const db = SQLite.openDatabaseSync(DB_NAME);

// Cria a tabela de exercícios (caso não exista)
export async function initDb() {
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