export interface ExerciseOption {
  id?: number;
  label: string;
  description?: string;
  image?: string;
  video?: string;
  defaultRestTime?: number;
}

export interface ExerciseRecord {
  id?: number;
  exercise: string;
  totalLoad: number;
  totalReps: number;
  weightUsed: number;
  date: string;
  restTime: number;
  repsFailed: number;
  series?: number;
  description?: string;
  image?: string;
  video?: string;
}

export interface WorkoutPlan {
  id?: number;
  exercise: string;
  dayOfWeek: string;
  minReps: number;
  maxReps: number;
  series: number;
  restTime: number;
}

export interface UserStats {
  totalWorkouts: number;
  totalLoad: number;
  favoriteExercise: string;
  longestStreak: number;
  currentStreak: number;
}

export type TabParamList = {
  Exercícios: undefined;
  Estatísticas: undefined;
  Ficha: undefined;
  Perfil: undefined;
};