// Tipos base para o aplicativo
export type ExerciseType = 'weight' | 'bodyweight';
export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

// Tipos para cálculo de repetições
export interface RepetitionMetrics {
  completeReps: number;
  negativeReps: number;
  failedReps: number;
}

// Tipos para sessões de treino
export interface WorkoutSession {
  id: string;
  exerciseId: string;
  date: Date;
  repetitionMetrics: RepetitionMetrics;
  sets: number;
  weight: number; // em kg
  restTime: number; // em segundos
  totalLoad: number; // em kg (calculado)
}

// Tipos para exercícios
export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: ExerciseType;
  bodyweightPercentage?: number; // apenas para tipo 'bodyweight'
  youtubeLink?: string;
  imageUri?: string; // URI da imagem local ou URL
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para estatísticas e progresso
export interface ProgressStats {
  evolutionPercentage: number;
  startingTotalLoad: number;
  endingTotalLoad: number;
  firstSessionDate: Date;
  lastSessionDate: Date;
}

export interface TopSession {
  rank: number;
  session: WorkoutSession;
  exercise: Exercise;
}

export interface DateRange {
  preset: DateRangePreset;
  startDate?: Date; // apenas para 'custom'
  endDate?: Date; // apenas para 'custom'
}

// Tipos para formulários
export interface ExerciseFormData {
  title: string;
  description: string;
  type: ExerciseType;
  bodyweightPercentage?: number;
  youtubeLink?: string;
  imageUri?: string;
}

export interface WorkoutSessionFormData {
  completeReps: number;
  negativeReps: number;
  failedReps: number;
  sets: number;
  weight: number;
  restTime: number; // padrão: 80
}

// Tipos para navegação e estado
export interface StatisticsFilters {
  exerciseId: string;
  dateRange: DateRange;
  topCount: number; // quantidade de tops a mostrar
}

// Utility types para cálculos
export interface CalculatedMetrics {
  effectiveSets: number;
  totalLoad: number;
}