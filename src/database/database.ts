import * as SQLite from 'expo-sqlite';
import { ExerciseRecord, WorkoutPlan, ExerciseOption } from '../types';

const db = SQLite.openDatabaseSync('exercise_app.db');

export const cleanDuplicateExercises = () => {
  try {
    // Remove exercícios duplicados mantendo apenas o primeiro de cada nome
    db.execSync(`
      DELETE FROM exercises 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM exercises 
        GROUP BY label
      )
    `);
    console.log('Duplicate exercises cleaned successfully');
  } catch (error) {
    console.error('Error cleaning duplicate exercises:', error);
  }
};

export const initDatabase = () => {
  try {
    console.log('🔧 Criando tabelas do banco de dados...');
    
    // Tabela de exercícios
    db.execSync(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL UNIQUE,
        description TEXT,
        image TEXT,
        video TEXT,
        defaultRestTime INTEGER DEFAULT 80
      );
    `);
    console.log('✅ Tabela exercises criada/verificada');

    // Tabela de registros de exercícios
    db.execSync(`
      CREATE TABLE IF NOT EXISTS exercise_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise TEXT NOT NULL,
        totalLoad REAL NOT NULL,
        totalReps INTEGER NOT NULL,
        weightUsed REAL NOT NULL,
        date TEXT NOT NULL,
        restTime INTEGER NOT NULL,
        repsFailed INTEGER DEFAULT 0,
        series INTEGER,
        description TEXT,
        image TEXT,
        video TEXT
      );
    `);
    console.log('✅ Tabela exercise_records criada/verificada');

    // Tabela de planos de treino
    db.execSync(`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise TEXT NOT NULL,
        dayOfWeek TEXT NOT NULL,
        minReps INTEGER NOT NULL,
        maxReps INTEGER NOT NULL,
        series INTEGER NOT NULL,
        restTime INTEGER NOT NULL
      );
    `);
    console.log('✅ Tabela workout_plans criada/verificada');

    // Verificar se já existem exercícios para evitar duplicatas
    let exerciseCount = 0;
    try {
      console.log('🔍 Verificando exercícios existentes...');
      const result = db.getAllSync('SELECT COUNT(*) as count FROM exercises');
      exerciseCount = result && result.length > 0 ? (result as any)[0].count : 0;
      console.log(`📊 Exercícios encontrados: ${exerciseCount}`);
    } catch (countError) {
      console.error('⚠️ Erro ao contar exercícios:', countError);
      exerciseCount = 0;
    }

    // Limpar exercícios duplicados se existirem
    if (exerciseCount > 0) {
      console.log('🧹 Limpando exercícios duplicados...');
      cleanDuplicateExercises();
    }

    if (exerciseCount === 0) {
      console.log('📝 Inserindo exercícios padrão...');
      // Inserir exercícios padrão apenas se não existirem
      const defaultExercises = [
        { label: "Flexão", description: "Exercício de flexão tradicional" },
        { label: "Flexão declinada (30°)", description: "Flexão com pés elevados" },
        { label: "Barra", description: "Exercício de barra fixa" },
        { label: "Abdominal", description: "Exercício abdominal tradicional" },
        { label: "Agachamento", description: "Agachamento livre" },
        { label: "Agachamento (1 perna)", description: "Agachamento unilateral" },
        { label: "Levantamento lateral (1 perna)", description: "Levantamento lateral unilateral" },
        { label: "Bícepes", description: "Exercício para bíceps" },
        { label: "Rosca", description: "Rosca para bíceps" },
        { label: "Rosca alternada", description: "Rosca alternada para bíceps" },
        { label: "Rosca direta", description: "Rosca direta para bíceps" },
        { label: "Rosca concentrada", description: "Rosca concentrada para bíceps" },
        { label: "Rosca martelo", description: "Rosca martelo para bíceps" },
        { label: "Trícepes", description: "Exercício para tríceps" },
        { label: "Ombro - Elevação frontal (pronada)", description: "Elevação frontal pronada" },
        { label: "Ombro - Elevação frontal (neutra)", description: "Elevação frontal neutra" },
        { label: "Costas", description: "Exercício para costas" },
        { label: "Antebraço", description: "Exercício para antebraço" },
        { label: "Nádegas", description: "Exercício para glúteos" },
        { label: "Elevação pélvica", description: "Elevação pélvica para glúteos" },
        { label: "Panturrilha", description: "Exercício para panturrilha" },
        { label: "Peitoral", description: "Exercício para peitoral" },
        { label: "Supino", description: "Supino reto" },
        { label: "Supino inclinado", description: "Supino inclinado" },
        { label: "Crucifixo", description: "Crucifixo para peitoral" },
        { label: "Mergulho", description: "Mergulho em paralelas" },
        { label: "Desenvolvimento", description: "Desenvolvimento de ombros" },
        { label: "Remada", description: "Remada para costas" },
        { label: "Pulldown", description: "Puxada alta" },
        { label: "Desenvolvimento", description: "Desenvolvimento de ombros" },
        { label: "Elevação lateral", description: "Elevação lateral de ombros" }
      ];

      defaultExercises.forEach((exercise, index) => {
        try {
          db.runSync(
            'INSERT OR IGNORE INTO exercises (label, description) VALUES (?, ?)',
            [exercise.label, exercise.description]
          );
          if ((index + 1) % 10 === 0) {
            console.log(`📝 Inseridos ${index + 1}/${defaultExercises.length} exercícios`);
          }
        } catch (insertError) {
          console.error(`❌ Erro ao inserir exercício "${exercise.label}":`, insertError);
        }
      });
      
      console.log('✅ Exercícios padrão inseridos com sucesso');
    }

    console.log('🎉 Inicialização do banco de dados concluída com sucesso');
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na inicialização do banco de dados:', error);
    throw error; // Re-throw para que o App.tsx possa capturar
  }
};

export const insertExerciseRecord = (record: Omit<ExerciseRecord, 'id'>) => {
  try {
    const stmt = db.prepareSync(
      `INSERT INTO exercise_records 
       (exercise, totalLoad, totalReps, weightUsed, date, restTime, repsFailed, series, description, image, video) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = stmt.executeSync([
      record.exercise,
      record.totalLoad,
      record.totalReps,
      record.weightUsed,
      record.date,
      record.restTime,
      record.repsFailed || 0,
      record.series || null,
      record.description || null,
      record.image || null,
      record.video || null
    ]);

    stmt.finalizeSync();
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting exercise record:', error);
    throw error;
  }
};

export const getExerciseRecords = (exercise?: string): ExerciseRecord[] => {
  try {
    let query = 'SELECT * FROM exercise_records';
    let params: any[] = [];

    if (exercise) {
      query += ' WHERE exercise = ?';
      params = [exercise];
    }

    query += ' ORDER BY date DESC';

    const stmt = db.prepareSync(query);
    const result = stmt.executeSync(params);
    const records: ExerciseRecord[] = [];

    for (const row of result) {
      records.push(row as ExerciseRecord);
    }

    stmt.finalizeSync();
    return records;
  } catch (error) {
    console.error('Error getting exercise records:', error);
    return [];
  }
};

export const getExercises = (): ExerciseOption[] => {
  try {
    console.log('🔍 Buscando exercícios no banco...');
    const stmt = db.prepareSync('SELECT * FROM exercises ORDER BY label');
    const result = stmt.executeSync();
    const exercises: ExerciseOption[] = [];

    for (const row of result) {
      exercises.push(row as ExerciseOption);
    }

    stmt.finalizeSync();
    console.log(`✅ ${exercises.length} exercícios encontrados`);
    return exercises;
  } catch (error) {
    console.error('❌ ERRO ao buscar exercícios:', error);
    return [];
  }
};

export const insertWorkoutPlan = (plan: Omit<WorkoutPlan, 'id'>) => {
  try {
    const stmt = db.prepareSync(
      `INSERT INTO workout_plans 
       (exercise, dayOfWeek, minReps, maxReps, series, restTime) 
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const result = stmt.executeSync([
      plan.exercise,
      plan.dayOfWeek,
      plan.minReps,
      plan.maxReps,
      plan.series,
      plan.restTime
    ]);

    stmt.finalizeSync();
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting workout plan:', error);
    throw error;
  }
};

export const insertExercise = (exercise: Omit<ExerciseOption, 'id'>) => {
  try {
    const stmt = db.prepareSync(
      `INSERT INTO exercises 
       (label, description, image, video, defaultRestTime) 
       VALUES (?, ?, ?, ?, ?)`
    );

    const result = stmt.executeSync([
      exercise.label,
      exercise.description || null,
      exercise.image || null,
      exercise.video || null,
      exercise.defaultRestTime || 80
    ]);

    stmt.finalizeSync();
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting exercise:', error);
    throw error;
  }
};

export const updateExercise = (id: number, exercise: Partial<ExerciseOption>) => {
  try {
    const stmt = db.prepareSync(
      `UPDATE exercises 
       SET label = ?, description = ?, image = ?, video = ?, defaultRestTime = ?
       WHERE id = ?`
    );

    const result = stmt.executeSync([
      exercise.label || '',
      exercise.description || null,
      exercise.image || null,
      exercise.video || null,
      exercise.defaultRestTime || 80,
      id!
    ]);

    stmt.finalizeSync();
    return result.changes;
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw error;
  }
};

export const getWorkoutPlans = (dayOfWeek?: string): WorkoutPlan[] => {
  try {
    console.log(`🔍 Buscando planos de treino${dayOfWeek ? ` para ${dayOfWeek}` : ''}...`);
    let query = 'SELECT * FROM workout_plans';
    let params: any[] = [];

    if (dayOfWeek) {
      query += ' WHERE dayOfWeek = ?';
      params = [dayOfWeek];
    }

    query += ' ORDER BY exercise';

    const stmt = db.prepareSync(query);
    const result = stmt.executeSync(params);
    const plans: WorkoutPlan[] = [];

    for (const row of result) {
      plans.push(row as WorkoutPlan);
    }

    stmt.finalizeSync();
    console.log(`✅ ${plans.length} planos de treino encontrados`);
    return plans;
  } catch (error) {
    console.error('❌ ERRO ao buscar planos de treino:', error);
    return [];
  }
};

export const importExerciseRecords = (records: ExerciseRecord[]) => {
  try {
    // Limpar dados existentes
    db.execSync('DELETE FROM exercise_records');
    
    // Inserir novos dados
    records.forEach(record => {
      db.runSync(
        `INSERT INTO exercise_records 
         (exercise, totalLoad, totalReps, weightUsed, date, restTime, repsFailed, series, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.exercise,
          record.totalLoad,
          record.totalReps,
          record.weightUsed,
          record.date,
          record.restTime,
          record.repsFailed || 0,
          record.series || 1,
          record.description || ''
        ]
      );
    });
    
    console.log(`Imported ${records.length} exercise records successfully`);
  } catch (error) {
    console.error('Error importing exercise records:', error);
    throw error;
  }
};

export const deleteExercise = (exerciseId: number) => {
  try {
    console.log(`🗑️ Iniciando deleção do exercício ID: ${exerciseId}`);
    
    // Primeiro, buscar o nome do exercício para deletar registros relacionados
    const exerciseStmt = db.prepareSync('SELECT label FROM exercises WHERE id = ?');
    const exerciseResult = exerciseStmt.executeSync([exerciseId]);
    let exerciseName = '';
    
    for (const row of exerciseResult) {
      exerciseName = (row as any).label;
      break;
    }
    exerciseStmt.finalizeSync();
    
    if (!exerciseName) {
      throw new Error('Exercício não encontrado');
    }
    
    console.log(`🗑️ Deletando registros relacionados ao exercício: ${exerciseName}`);
    
    // Deletar registros de treino (exercise_records) relacionados
    const deleteRecordsStmt = db.prepareSync('DELETE FROM exercise_records WHERE exercise = ?');
    const recordsResult = deleteRecordsStmt.executeSync([exerciseName]);
    deleteRecordsStmt.finalizeSync();
    console.log(`🗑️ ${recordsResult.changes} registros de treino deletados`);
    
    // Deletar planos de treino (workout_plans) relacionados
    const deletePlansStmt = db.prepareSync('DELETE FROM workout_plans WHERE exercise = ?');
    const plansResult = deletePlansStmt.executeSync([exerciseName]);
    deletePlansStmt.finalizeSync();
    console.log(`🗑️ ${plansResult.changes} planos de treino deletados`);
    
    // Finalmente, deletar o exercício
    const deleteExerciseStmt = db.prepareSync('DELETE FROM exercises WHERE id = ?');
    const exerciseDeleteResult = deleteExerciseStmt.executeSync([exerciseId]);
    deleteExerciseStmt.finalizeSync();
    
    if (exerciseDeleteResult.changes === 0) {
      throw new Error('Exercício não foi deletado');
    }
    
    console.log(`✅ Exercício "${exerciseName}" deletado com sucesso junto com todos os registros relacionados`);
    return exerciseDeleteResult.changes;
  } catch (error) {
    console.error('❌ ERRO ao deletar exercício:', error);
    throw error;
  }
};

export const clearAllData = () => {
  try {
    db.execSync('DELETE FROM exercise_records');
    db.execSync('DELETE FROM workout_plans');
    db.execSync('DELETE FROM exercises');
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

export const recreateDefaultExercises = () => {
  try {
    console.log('🔄 Recriando exercícios padrão...');
    
    // Primeiro, limpar exercícios existentes
    db.runSync('DELETE FROM exercises');
    console.log('🗑️ Exercícios existentes removidos');
    
    // Inserir exercícios padrão
    const defaultExercises = [
      { label: "Flexão", description: "Exercício de flexão tradicional" },
      { label: "Flexão declinada (30°)", description: "Flexão com pés elevados" },
      { label: "Barra", description: "Exercício de barra fixa" },
      { label: "Abdominal", description: "Exercício abdominal tradicional" },
      { label: "Agachamento", description: "Agachamento livre" },
      { label: "Agachamento (1 perna)", description: "Agachamento unilateral" },
      { label: "Levantamento lateral (1 perna)", description: "Levantamento lateral unilateral" },
      { label: "Bícepes", description: "Exercício para bíceps" },
      { label: "Rosca", description: "Rosca para bíceps" },
      { label: "Rosca alternada", description: "Rosca alternada para bíceps" },
      { label: "Rosca direta", description: "Rosca direta para bíceps" },
      { label: "Rosca concentrada", description: "Rosca concentrada para bíceps" },
      { label: "Rosca martelo", description: "Rosca martelo para bíceps" },
      { label: "Trícepes", description: "Exercício para tríceps" },
      { label: "Ombro - Elevação frontal (pronada)", description: "Elevação frontal pronada" },
      { label: "Ombro - Elevação frontal (neutra)", description: "Elevação frontal neutra" },
      { label: "Costas", description: "Exercício para costas" },
      { label: "Antebraço", description: "Exercício para antebraço" },
      { label: "Nádegas", description: "Exercício para glúteos" },
      { label: "Elevação pélvica", description: "Elevação pélvica para glúteos" },
      { label: "Panturrilha", description: "Exercício para panturrilha" },
      { label: "Peitoral", description: "Exercício para peitoral" },
      { label: "Supino", description: "Supino reto" },
      { label: "Supino inclinado", description: "Supino inclinado" },
      { label: "Crucifixo", description: "Crucifixo para peitoral" },
      { label: "Mergulho", description: "Mergulho em paralelas" },
      { label: "Desenvolvimento", description: "Desenvolvimento para ombros" },
      { label: "Remada", description: "Remada para costas" },
      { label: "Leg Press", description: "Leg press para pernas" },
      { label: "Extensão de pernas", description: "Extensão de pernas no aparelho" }
    ];

    const insertStmt = db.prepareSync('INSERT INTO exercises (label, description) VALUES (?, ?)');
    
    for (const exercise of defaultExercises) {
      insertStmt.executeSync([exercise.label, exercise.description]);
    }
    
    insertStmt.finalizeSync();
    console.log(`✅ ${defaultExercises.length} exercícios padrão recriados com sucesso!`);
    
    return defaultExercises.length;
  } catch (error) {
    console.error('❌ Erro ao recriar exercícios padrão:', error);
    return 0;
  }
};