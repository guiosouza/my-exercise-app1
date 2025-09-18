import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { ExerciseOption, ExerciseRecord, WorkoutPlan } from '../types';
import { getExercises, insertExerciseRecord, getWorkoutPlans, getExerciseRecords } from '../database/database';

export default function ExercisesScreen() {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null);
  const [weight, setWeight] = useState('');
  const [totalReps, setTotalReps] = useState('');
  const [series, setSeries] = useState('');
  const [repsFailed, setRepsFailed] = useState('0');
  const [restTime, setRestTime] = useState('90');
  const [todayWorkout, setTodayWorkout] = useState<WorkoutPlan[]>([]);

  // Refs para scroll automático
  const scrollViewRef = useRef<ScrollView>(null);
  const [formSectionPosition, setFormSectionPosition] = useState(0);

  useEffect(() => {
    console.log("🏋️ ExercisesScreen: Componente montado, carregando dados...");
    try {
      loadExercises();
      loadTodayWorkout();
    } catch (error) {
      console.error("❌ ExercisesScreen: Erro no useEffect inicial:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
    }
  }, []);

  // Atualizar header quando exercício é selecionado
  useEffect(() => {
    if (selectedExercise) {
      navigation.setOptions({
        headerTitle: `Exercícios - ${selectedExercise.label}`,
      });
    } else {
      navigation.setOptions({
        headerTitle: 'Exercícios',
      });
    }
  }, [selectedExercise, navigation]);

  const loadExercises = () => {
    try {
      const exerciseList = getExercises();
      setExercises(exerciseList);
      setFilteredExercises(exerciseList);
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
    }
  };

  const loadTodayWorkout = () => {
    try {
      const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
      const dayMap: { [key: string]: string } = {
        'segunda-feira': 'Segunda',
        'terça-feira': 'Terça',
        'quarta-feira': 'Quarta',
        'quinta-feira': 'Quinta',
        'sexta-feira': 'Sexta',
        'sábado': 'Sábado',
        'domingo': 'Domingo',
      };
      const dayOfWeek = dayMap[today] || 'Segunda';
      const workout = getWorkoutPlans(dayOfWeek);
      setTodayWorkout(workout);
    } catch (error) {
      console.error('Erro ao carregar treino do dia:', error);
    }
  };

  const calculateTotalLoad = () => {
    const weightNum = parseFloat(weight) || 0;
    const repsNum = parseInt(totalReps) || 0;
    const failedNum = parseInt(repsFailed) || 0;
    
    const successfulReps = repsNum - failedNum;
    const failedLoad = failedNum * weightNum * 0.4; // 40% do valor para repetições falhadas
    const successfulLoad = successfulReps * weightNum;
    
    return successfulLoad + failedLoad;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter(exercise =>
        exercise.label.toLowerCase().includes(query.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(query.toLowerCase()) ||
        false
      );
      setFilteredExercises(filtered);
    }
  };

  const handleSaveExercise = () => {
    if (!selectedExercise || !weight || !totalReps) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    // Verificar se já existe um exercício com o mesmo nome hoje
    try {
      const existingRecords = getExerciseRecords(selectedExercise.label);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const todayRecords = existingRecords.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === today;
      });

      if (todayRecords.length > 0) {
        Alert.alert(
          'Exercício Duplicado',
          `Você já gravou o exercício "${selectedExercise.label}" hoje. Deseja gravar mesmo assim?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Gravar Mesmo Assim', onPress: () => saveExercise() }
          ]
        );
        return;
      }

      saveExercise();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao verificar exercícios duplicados');
      console.error(error);
    }
  };

  const saveExercise = () => {
    const record: Omit<ExerciseRecord, 'id'> = {
      exercise: selectedExercise!.label,
      totalLoad: calculateTotalLoad(),
      totalReps: parseInt(totalReps),
      weightUsed: parseFloat(weight),
      date: new Date().toISOString(),
      restTime: parseInt(restTime),
      repsFailed: parseInt(repsFailed),
      series: parseInt(series) || 0,
      description: selectedExercise!.description,
      image: selectedExercise!.image,
      video: selectedExercise!.video,
    };

    try {
      insertExerciseRecord(record);
      Alert.alert('Sucesso', 'Exercício gravado com sucesso!');
      
      // Limpar campos
      setWeight('');
      setTotalReps('');
      setSeries('');
      setRepsFailed('0');
      setRestTime('90');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao gravar exercício');
      console.error(error);
    }
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Text style={styles.title}>Exercícios</Text>
      
      {/* Seleção de Exercício */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selecionar Exercício</Text>
        
        {/* Campo de Pesquisa */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pesquisar Exercício</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome do exercício..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        
        <View style={styles.exerciseCardsContainer}>
          {filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.label}
              style={[
                styles.exerciseCard,
                selectedExercise?.label === exercise.label && styles.exerciseCardSelected
              ]}
              onPress={() => {
                setSelectedExercise(exercise);
                if (exercise.defaultRestTime) {
                  setRestTime(exercise.defaultRestTime.toString());
                }
                // Scroll automático para o formulário
                setTimeout(() => {
                  if (scrollViewRef.current && formSectionPosition > 0) {
                    scrollViewRef.current.scrollTo({ y: formSectionPosition - 20, animated: true });
                  }
                }, 100);
              }}
            >
              <View style={styles.exerciseCardImageContainer}>
                {exercise.image ? (
                  <Image 
                    source={{ uri: exercise.image }} 
                    style={styles.exerciseCardImage}
                  />
                ) : (
                  <View style={styles.exerciseCardImagePlaceholder}>
                    <Text style={styles.exerciseCardImagePlaceholderText}>🏋️</Text>
                  </View>
                )}
                {exercise.video && (
                  <View style={styles.videoIndicator}>
                    <Text style={styles.videoIndicatorText}>▶️</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.exerciseCardContent}>
                <Text style={styles.exerciseCardTitle}>{exercise.label}</Text>
                {exercise.description && (
                  <Text style={styles.exerciseCardDescription} numberOfLines={2}>
                    {exercise.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Informações do Exercício */}
      {selectedExercise && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Exercício</Text>
          <Text style={styles.exerciseName}>{selectedExercise.label}</Text>
          {selectedExercise.description && (
            <Text style={styles.exerciseDescription}>{selectedExercise.description}</Text>
          )}
          {selectedExercise.image && (
            <Image source={{ uri: selectedExercise.image }} style={styles.exerciseImage} />
          )}
        </View>
      )}

      {/* Dados do Treino */}
      <View 
        style={styles.section}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          setFormSectionPosition(y);
        }}
      >
        <Text style={styles.sectionTitle}>Dados do Treino</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Repetições Totais</Text>
          <TextInput
            style={styles.input}
            value={totalReps}
            onChangeText={setTotalReps}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Séries</Text>
          <TextInput
            style={styles.input}
            value={series}
            onChangeText={setSeries}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Repetições Falhadas/Negativas</Text>
          <TextInput
            style={styles.input}
            value={repsFailed}
            onChangeText={setRepsFailed}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tempo de Descanso (segundos)</Text>
          <TextInput
            style={styles.input}
            value={restTime}
            onChangeText={setRestTime}
            keyboardType="numeric"
            placeholder="90"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {weight && totalReps && (
          <View style={styles.totalLoadContainer}>
            <Text style={styles.totalLoadLabel}>Carga Total:</Text>
            <Text style={styles.totalLoadValue}>{calculateTotalLoad().toFixed(1)} kg</Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveExercise}>
          <Text style={styles.saveButtonText}>Gravar</Text>
        </TouchableOpacity>
      </View>

      {/* Ficha do Dia */}
      {todayWorkout.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ficha de Hoje</Text>
          <View style={styles.workoutTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Exercício</Text>
              <Text style={styles.tableHeaderText}>Reps</Text>
              <Text style={styles.tableHeaderText}>Séries</Text>
              <Text style={styles.tableHeaderText}>Descanso</Text>
            </View>
            {todayWorkout.map((plan, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{plan.exercise}</Text>
                <Text style={styles.tableCell}>{plan.minReps}-{plan.maxReps}</Text>
                <Text style={styles.tableCell}>{plan.series}</Text>
                <Text style={styles.tableCell}>{plan.restTime}s</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  pickerContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  picker: {
    color: theme.colors.text,
    height: 50,
  },
  exerciseName: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  exerciseDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    resizeMode: 'cover',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.body,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
  },
  totalLoadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  totalLoadLabel: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  totalLoadValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...theme.typography.h3,
    color: theme.colors.background,
  },
  workoutTable: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    color: theme.colors.background,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tableCell: {
    flex: 1,
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 14,
  },
  exerciseCardsContainer: {
    gap: theme.spacing.md,
  },
  exerciseCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  exerciseCardImageContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  exerciseCardImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    resizeMode: 'cover',
  },
  exerciseCardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseCardImagePlaceholderText: {
    fontSize: 32,
  },
  videoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicatorText: {
    fontSize: 12,
    color: 'white',
  },
  exerciseCardContent: {
    flex: 1,
  },
  exerciseCardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  exerciseCardDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});