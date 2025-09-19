import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../styles/theme';
import { ExerciseOption, WorkoutPlan } from '../types';
import { 
  getExercises, 
  getWorkoutPlans, 
  deleteExercise, 
  recreateDefaultExercises,
  insertWorkoutPlan,
  insertExercise,
  updateExercise
} from '../database/database';

const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export default function WorkoutPlanScreen() {
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  
  // Estados para adicionar treino
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedDay, setSelectedDay] = useState('Segunda');
  const [minReps, setMinReps] = useState('');
  const [maxReps, setMaxReps] = useState('');
  const [series, setSeries] = useState('');
  const [restTime, setRestTime] = useState('90');

  // Estados para adicionar exercício
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseDescription, setNewExerciseDescription] = useState('');
  const [newExerciseImage, setNewExerciseImage] = useState('');
  const [newExerciseVideo, setNewExerciseVideo] = useState('');
  const [newExerciseRestTime, setNewExerciseRestTime] = useState('80');
  
  // Estados para edição de exercício
  const [editingExercise, setEditingExercise] = useState<ExerciseOption | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  useEffect(() => {
    console.log("📋 WorkoutPlanScreen: Componente montado, carregando dados...");
    try {
      loadData();
    } catch (error) {
      console.error("❌ WorkoutPlanScreen: Erro no useEffect inicial:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
    }
  }, []);

  const loadData = async () => {
    try {
      const exerciseList = await getExercises();
      const planList = await getWorkoutPlans();
      
      console.log(`📊 FICHAS - Carregando ${exerciseList.length} exercícios:`, exerciseList.map(e => e.label));
      
      setExercises(exerciseList);
      setWorkoutPlans(planList);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleRecreateExercises = async () => {
    try {
      const count = recreateDefaultExercises();
      console.log(`🔄 Exercícios recriados: ${count}`);
      await loadData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao recriar exercícios:', error);
    }
  };

  // Filtrar exercícios baseado na pesquisa
  const filteredExercises = exercises.filter(exercise =>
    exercise.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddWorkoutPlan = () => {
    if (!selectedExercise || !minReps || !maxReps || !series) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const plan: Omit<WorkoutPlan, 'id'> = {
      exercise: selectedExercise,
      dayOfWeek: selectedDay,
      minReps: parseInt(minReps),
      maxReps: parseInt(maxReps),
      series: parseInt(series),
      restTime: parseInt(restTime),
    };

    try {
      insertWorkoutPlan(plan);
      Alert.alert('Sucesso', 'Treino adicionado à ficha!');
      
      // Limpar campos e recarregar dados
      setMinReps('');
      setMaxReps('');
      setSeries('');
      setRestTime('90');
      setShowAddModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao adicionar treino');
      console.error(error);
    }
  };

  const handleAddExercise = () => {
    if (!newExerciseName || !newExerciseDescription) {
      Alert.alert('Erro', 'Nome e descrição são obrigatórios');
      return;
    }

    const exercise: Omit<ExerciseOption, 'id'> = {
      label: newExerciseName,
      description: newExerciseDescription,
      image: newExerciseImage || undefined,
      video: newExerciseVideo || undefined,
      defaultRestTime: parseInt(newExerciseRestTime) || 80,
    };

    try {
      insertExercise(exercise);
      Alert.alert('Sucesso', 'Exercício criado com sucesso!');
      
      // Limpar campos e recarregar dados
      setNewExerciseName('');
      setNewExerciseDescription('');
      setNewExerciseImage('');
      setNewExerciseVideo('');
      setNewExerciseRestTime('80');
      setShowExerciseModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar exercício');
      console.error(error);
    }
  };

  const handleEditExercise = (exercise: ExerciseOption) => {
    setEditingExercise(exercise);
    setNewExerciseName(exercise.label);
    setNewExerciseDescription(exercise.description || '');
    setNewExerciseImage(exercise.image || '');
    setNewExerciseVideo(exercise.video || '');
    setNewExerciseRestTime(exercise.defaultRestTime?.toString() || '80');
    setShowEditModal(true);
  };

  const handleUpdateExercise = () => {
    if (!editingExercise || !newExerciseName || !newExerciseDescription) {
      Alert.alert('Erro', 'Nome e descrição são obrigatórios');
      return;
    }

    const updatedExercise: Partial<ExerciseOption> = {
      label: newExerciseName,
      description: newExerciseDescription,
      image: newExerciseImage || undefined,
      video: newExerciseVideo || undefined,
      defaultRestTime: parseInt(newExerciseRestTime) || 80,
    };

    try {
      updateExercise(editingExercise.id!, updatedExercise);
      Alert.alert('Sucesso', 'Exercício atualizado com sucesso!');
      
      // Limpar campos e recarregar dados
      setEditingExercise(null);
      setNewExerciseName('');
      setNewExerciseDescription('');
      setNewExerciseImage('');
      setNewExerciseVideo('');
      setNewExerciseRestTime('80');
      setShowEditModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar exercício');
      console.error(error);
    }
  };

  const handleDeleteExercise = (exercise: ExerciseOption) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar o exercício "${exercise.label}"?\n\nEsta ação irá remover:\n• O exercício\n• Todos os registros de treino\n• Todos os planos de treino\n\nEsta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: () => {
            try {
              deleteExercise(exercise.id!);
              Alert.alert('Sucesso', 'Exercício deletado com sucesso!');
              loadData();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao deletar exercício');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const getWorkoutsByDay = (day: string) => {
    return workoutPlans.filter(plan => plan.dayOfWeek === day);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ficha de Treino</Text>
      
      {/* Botões de Ação */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.actionButtonText}>Adicionar Treino</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowExerciseModal(true)}
        >
          <Text style={styles.actionButtonText}>Novo Exercício</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Exercícios para Edição */}
      <View style={styles.exerciseListSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercícios Disponíveis</Text>
          <Text style={styles.exerciseCounter}>({filteredExercises.length} exercícios)</Text>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Pesquisar exercícios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity 
          style={styles.recreateButton}
          onPress={handleRecreateExercises}
        >
          <Text style={styles.recreateButtonText}>🔄 Recriar Exercícios</Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseList}>
          {filteredExercises.map((exercise, index) => {
            console.log(`🎯 FICHAS - Renderizando card ${index + 1}/${filteredExercises.length}: ${exercise.label}`);
            return (
            <TouchableOpacity 
              key={index} 
              style={styles.exerciseCard}
              onPress={() => handleEditExercise(exercise)}
            >
              <View style={styles.exerciseCardContent}>
                <Text style={styles.exerciseCardTitle}>{exercise.label}</Text>
                <Text style={styles.exerciseCardDescription} numberOfLines={3}>
                  {exercise.description || 'Sem descrição'}
                </Text>
              </View>
              <View style={styles.exerciseCardActions}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteExercise(exercise)}
                >
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.editText}>Toque para editar</Text>
            </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ficha Semanal */}
      {daysOfWeek.map(day => (
        <View key={day} style={styles.daySection}>
          <Text style={styles.dayTitle}>{day}</Text>
          
          {getWorkoutsByDay(day).length > 0 ? (
            <View style={styles.workoutTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Exercício</Text>
                <Text style={styles.tableHeaderText}>Reps</Text>
                <Text style={styles.tableHeaderText}>Séries</Text>
                <Text style={styles.tableHeaderText}>Descanso</Text>
              </View>
              
              {getWorkoutsByDay(day).map((plan, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{plan.exercise}</Text>
                  <Text style={styles.tableCell}>{plan.minReps}-{plan.maxReps}</Text>
                  <Text style={styles.tableCell}>{plan.series}</Text>
                  <Text style={styles.tableCell}>{plan.restTime}s</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noWorkoutText}>Nenhum treino programado</Text>
          )}
        </View>
      ))}

      {/* Modal Adicionar Treino */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Treino</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exercício</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedExercise}
                  onValueChange={setSelectedExercise}
                  style={styles.picker}
                >
                  {exercises.map((exercise) => (
                    <Picker.Item
                      key={exercise.label}
                      label={exercise.label}
                      value={exercise.label}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dia da Semana</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDay}
                  onValueChange={setSelectedDay}
                  style={styles.picker}
                >
                  {daysOfWeek.map((day) => (
                    <Picker.Item key={day} label={day} value={day} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Min Reps</Text>
                <TextInput
                  style={styles.input}
                  value={minReps}
                  onChangeText={setMinReps}
                  keyboardType="numeric"
                  placeholder="8"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Max Reps</Text>
                <TextInput
                  style={styles.input}
                  value={maxReps}
                  onChangeText={setMaxReps}
                  keyboardType="numeric"
                  placeholder="12"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Séries</Text>
                <TextInput
                  style={styles.input}
                  value={series}
                  onChangeText={setSeries}
                  keyboardType="numeric"
                  placeholder="3"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Descanso (s)</Text>
                <TextInput
                  style={styles.input}
                  value={restTime}
                  onChangeText={setRestTime}
                  keyboardType="numeric"
                  placeholder="90"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleAddWorkoutPlan}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Novo Exercício */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Novo Exercício</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  value={newExerciseName}
                  onChangeText={setNewExerciseName}
                  placeholder="Nome do exercício"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descrição *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newExerciseDescription}
                  onChangeText={setNewExerciseDescription}
                  placeholder="Descrição do exercício"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Imagem (URL)</Text>
                <TextInput
                  style={styles.input}
                  value={newExerciseImage}
                  onChangeText={setNewExerciseImage}
                  placeholder="https://exemplo.com/imagem.jpg"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vídeo (YouTube URL)</Text>
                <TextInput
                  style={styles.input}
                  value={newExerciseVideo}
                  onChangeText={setNewExerciseVideo}
                  placeholder="https://youtube.com/watch?v=..."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tempo de Descanso Padrão (s)</Text>
                <TextInput
                  style={styles.input}
                  value={newExerciseRestTime}
                  onChangeText={setNewExerciseRestTime}
                  keyboardType="numeric"
                  placeholder="80"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowExerciseModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleAddExercise}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Exercício */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Editar Exercício</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome do Exercício</Text>
                <TextInput
                  style={styles.input}
                  value={newExerciseName}
                  onChangeText={setNewExerciseName}
                  placeholder="Ex: Flexão"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newExerciseDescription}
                  onChangeText={setNewExerciseDescription}
                  placeholder="Descrição do exercício..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Imagem (URL ou local)</Text>
                <TextInput
                  style={styles.input}
                  value={newExerciseImage}
                  onChangeText={setNewExerciseImage}
                  placeholder="https://exemplo.com/imagem.jpg"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vídeo YouTube (URL)</Text>
                <TextInput
                  style={styles.input}
                  value={newExerciseVideo}
                  onChangeText={setNewExerciseVideo}
                  placeholder="https://youtube.com/watch?v=..."
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tempo de Descanso Padrão (s)</Text>
                <TextInput
                  style={styles.input}
                  value={newExerciseRestTime}
                  onChangeText={setNewExerciseRestTime}
                  keyboardType="numeric"
                  placeholder="80"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setShowEditModal(false);
                    setEditingExercise(null);
                    setNewExerciseName('');
                    setNewExerciseDescription('');
                    setNewExerciseImage('');
                    setNewExerciseVideo('');
                    setNewExerciseRestTime('80');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleUpdateExercise}
                >
                  <Text style={styles.saveButtonText}>Atualizar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  daySection: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
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
  noWorkoutText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  row: {
    flexDirection: 'row',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.border,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  exerciseListSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseCounter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  exerciseList: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseCard: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 18,
    marginRight: 15,
    minWidth: 180,
    minHeight: 140,
    borderWidth: 0,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  recreateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  recreateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    flex: 1,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseCardNumber: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    textAlign: 'center',
  },
  exerciseCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseCardDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: theme.spacing.sm,
  },
  editText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  exerciseCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
});