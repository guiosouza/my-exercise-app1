import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from '@react-navigation/native';
// Removido import do useFocusEffect para evitar carregamento excessivo
import { theme } from "../styles/theme";
import { ExerciseOption, ExerciseRecord } from "../types";
import { getExercises, getExerciseRecords } from "../database/database";

const screenWidth = Dimensions.get("window").width;

export default function StatisticsScreen() {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [topRecords, setTopRecords] = useState<ExerciseRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("3months");
  const [chartPage, setChartPage] = useState<number>(0);
  const [recordsPerPage] = useState<number>(7); // Otimizado para telas pequenas

  // Refs para scroll automático
  const scrollViewRef = useRef<ScrollView>(null);
  const [periodSectionPosition, setPeriodSectionPosition] = useState(0);

  // Períodos disponíveis
  const periods = [
    { label: "Últimos 2 Dias", value: "2days" },
    { label: "Últimos 7 Dias", value: "7days" },
    { label: "Últimos 15 Dias", value: "15days" },
    { label: "Últimos 30 Dias", value: "30days" },
    { label: "Últimos 90 Dias", value: "90days" },
    { label: "Período Todo", value: "all" },
  ];

  useEffect(() => {
    console.log(
      "📊 StatisticsScreen: Componente montado, carregando exercícios..."
    );
    loadExercises();
  }, []);

  useEffect(() => {
    console.log("📊 StatisticsScreen: Exercício ou período mudou:", {
      selectedExercise,
      selectedPeriod,
    });
    if (selectedExercise) {
      loadExerciseRecords();
    }
  }, [selectedExercise, selectedPeriod]);

  // Atualizar header quando exercício é selecionado
  useEffect(() => {
    if (selectedExercise) {
      navigation.setOptions({
        headerTitle: `Estatísticas - ${selectedExercise}`,
      });
    } else {
      navigation.setOptions({
        headerTitle: 'Estatísticas',
      });
    }
  }, [selectedExercise, navigation]);

  // Removido useFocusEffect para evitar carregamento excessivo de dados
  // Os dados são carregados adequadamente pelos useEffect quando necessário

  const loadExercises = () => {
    try {
      console.log("📊 StatisticsScreen: Iniciando carregamento de exercícios...");
      const exerciseList = getExercises();
      console.log(
        "📊 StatisticsScreen: Exercícios carregados:",
        exerciseList.length
      );
      setExercises(exerciseList);
      setFilteredExercises(exerciseList);
      
      // Só selecionar o primeiro exercício se não há nenhum selecionado
      if (exerciseList.length > 0 && !selectedExercise) {
        console.log(
          "📊 StatisticsScreen: Selecionando primeiro exercício:",
          exerciseList[0].label
        );
        setSelectedExercise(exerciseList[0].label);
      } else if (exerciseList.length === 0) {
        console.log("⚠️ StatisticsScreen: Nenhum exercício encontrado!");
      } else {
        console.log(
          "📊 StatisticsScreen: Mantendo exercício já selecionado:",
          selectedExercise
        );
      }
    } catch (error) {
      console.error("❌ StatisticsScreen: Erro ao carregar exercícios:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter(exercise =>
        exercise.label.toLowerCase().includes(query.toLowerCase()) ||
        (exercise.description?.toLowerCase().includes(query.toLowerCase()) || false)
      );
      setFilteredExercises(filtered);
    }
  };

  // Função para calcular evolução do período
  const calculateEvolution = (records: ExerciseRecord[]) => {
    if (records.length === 0) {
      return {
        firstDay: null,
        lastDay: null,
        evolution: 0,
        evolutionColor: theme.colors.textSecondary
      };
    }

    // Ordenar registros por data
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstRecord = sortedRecords[0];
    const lastRecord = sortedRecords[sortedRecords.length - 1];

    // Se só há um registro, não há evolução
    if (sortedRecords.length === 1) {
      return {
        firstDay: firstRecord,
        lastDay: firstRecord,
        evolution: 0,
        evolutionColor: theme.colors.textSecondary
      };
    }

    // Calcular evolução percentual
    const firstLoad = firstRecord.totalLoad;
    const lastLoad = lastRecord.totalLoad;
    const evolution = ((lastLoad - firstLoad) / firstLoad) * 100;

    // Determinar cor baseada na evolução
    let evolutionColor = theme.colors.textSecondary; // Cinza para sem mudança
    if (evolution > 0) {
      evolutionColor = '#4CAF50'; // Verde para evolução positiva
    } else if (evolution < 0) {
      evolutionColor = '#F44336'; // Vermelho para evolução negativa
    }

    return {
      firstDay: firstRecord,
      lastDay: lastRecord,
      evolution,
      evolutionColor
    };
  };

  const loadExerciseRecords = () => {
    try {
      console.log(
        "📊 StatisticsScreen: Carregando registros para exercício:",
        selectedExercise
      );
      const allRecords = getExerciseRecords(selectedExercise);
      console.log(
        "📊 StatisticsScreen: Total de registros encontrados:",
        allRecords.length
      );

      // Filtrar registros por período
      const filteredRecords = filterRecordsByPeriod(allRecords);
      console.log(
        "📊 StatisticsScreen: Registros após filtro de período:",
        filteredRecords.length
      );
      setRecords(filteredRecords);

      // Filtrar top 20 recordes (máximo 4 séries e 2 minutos de descanso)
      const validRecords = filteredRecords.filter(
        (record) => (record.series || 0) <= 4 && record.restTime <= 120
      );
      console.log(
        "📊 StatisticsScreen: Registros válidos para top 20:",
        validRecords.length
      );

      const sortedRecords = validRecords
        .sort((a, b) => b.totalLoad - a.totalLoad)
        .slice(0, 20);

      console.log(
        "📊 StatisticsScreen: Top recordes finais:",
        sortedRecords.length
      );
      setTopRecords(sortedRecords);
    } catch (error) {
      console.error("❌ StatisticsScreen: Erro ao carregar registros:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
    }
  };

  const filterRecordsByPeriod = (records: ExerciseRecord[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    console.log("Total records:", records.length);
    console.log("Selected period:", selectedPeriod);

    switch (selectedPeriod) {
      case "all":
        console.log("Filtered records:", records.length);
        return records;
      case "2days":
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        const filtered2 = records.filter((record) => {
          const recordDate = new Date(record.date);
          const recordDateOnly = new Date(
            recordDate.getFullYear(),
            recordDate.getMonth(),
            recordDate.getDate()
          );
          return recordDateOnly >= twoDaysAgo;
        });
        console.log("Filtered records (2 days):", filtered2.length);
        return filtered2;
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const filtered7 = records.filter((record) => {
          const recordDate = new Date(record.date);
          const recordDateOnly = new Date(
            recordDate.getFullYear(),
            recordDate.getMonth(),
            recordDate.getDate()
          );
          return recordDateOnly >= sevenDaysAgo;
        });
        console.log("Filtered records (7 days):", filtered7.length);
        return filtered7;
      case "15days":
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);
        const filtered15 = records.filter((record) => {
          const recordDate = new Date(record.date);
          const recordDateOnly = new Date(
            recordDate.getFullYear(),
            recordDate.getMonth(),
            recordDate.getDate()
          );
          return recordDateOnly >= fifteenDaysAgo;
        });
        console.log("Filtered records (15 days):", filtered15.length);
        return filtered15;
      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const filtered30 = records.filter((record) => {
          const recordDate = new Date(record.date);
          const recordDateOnly = new Date(
            recordDate.getFullYear(),
            recordDate.getMonth(),
            recordDate.getDate()
          );
          return recordDateOnly >= thirtyDaysAgo;
        });
        console.log("Filtered records (30 days):", filtered30.length);
        return filtered30;
      case "90days":
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        const filtered90 = records.filter((record) => {
          const recordDate = new Date(record.date);
          const recordDateOnly = new Date(
            recordDate.getFullYear(),
            recordDate.getMonth(),
            recordDate.getDate()
          );
          return recordDateOnly >= ninetyDaysAgo;
        });
        return filtered90;
      default:
        return records;
    }
  };

  const getChartData = () => {
    if (records.length === 0) {
      return {
        labels: ["Sem dados"],
        datasets: [
          {
            data: [0],
            color: (opacity = 1) => `rgba(174, 255, 111, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    }

    // Divisão inteligente baseada no período selecionado
    let maxPoints = 7; // Máximo para telas pequenas
    let groupedData: { date: string; totalLoad: number }[] = [];
    
    if (selectedPeriod === "7days") {
      // Para 7 dias: mostrar por dia
      maxPoints = 7;
      groupedData = groupRecordsByDay(records, maxPoints);
    } else if (selectedPeriod === "30days") {
      // Para 30 dias: agrupar por semana (4-5 pontos)
      maxPoints = 5;
      groupedData = groupRecordsByWeek(records, maxPoints);
    } else if (selectedPeriod === "3months") {
      // Para 3 meses: agrupar por mês (3 pontos)
      maxPoints = 3;
      groupedData = groupRecordsByMonth(records, maxPoints);
    } else {
      // Para "all": dividir em períodos inteligentes
      maxPoints = 7;
      groupedData = groupRecordsIntelligently(records, maxPoints);
    }

    const labels = groupedData.map(item => item.date);
    const data = groupedData.map(item => item.totalLoad);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(174, 255, 111, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  // Função para agrupar por dia
  const groupRecordsByDay = (records: ExerciseRecord[], maxDays: number) => {
    const dailyData: { [key: string]: number } = {};
    
    records.forEach(record => {
      const date = new Date(record.date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      dailyData[date] = (dailyData[date] || 0) + record.totalLoad;
    });

    return Object.entries(dailyData)
      .sort((a, b) => new Date(a[0].split('/').reverse().join('-')).getTime() - 
                     new Date(b[0].split('/').reverse().join('-')).getTime())
      .slice(-maxDays)
      .map(([date, totalLoad]) => ({ date, totalLoad }));
  };

  // Função para agrupar por semana
  const groupRecordsByWeek = (records: ExerciseRecord[], maxWeeks: number) => {
    const weeklyData: { [key: string]: number } = {};
    
    records.forEach(record => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + record.totalLoad;
    });

    return Object.entries(weeklyData)
      .sort((a, b) => new Date(a[0].split('/').reverse().join('-')).getTime() - 
                     new Date(b[0].split('/').reverse().join('-')).getTime())
      .slice(-maxWeeks)
      .map(([date, totalLoad]) => ({ date: `Sem ${date}`, totalLoad }));
  };

  // Função para agrupar por mês
  const groupRecordsByMonth = (records: ExerciseRecord[], maxMonths: number) => {
    const monthlyData: { [key: string]: number } = {};
    
    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = date.toLocaleDateString('pt-BR', { 
        month: '2-digit', 
        year: '2-digit' 
      });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + record.totalLoad;
    });

    return Object.entries(monthlyData)
      .sort((a, b) => new Date(`01/${a[0]}`).getTime() - new Date(`01/${b[0]}`).getTime())
      .slice(-maxMonths)
      .map(([date, totalLoad]) => ({ date, totalLoad }));
  };

  // Função para divisão inteligente de todo o período
  const groupRecordsIntelligently = (records: ExerciseRecord[], maxPoints: number) => {
    if (records.length <= maxPoints) {
      // Se temos poucos registros, mostrar individualmente
      return records
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-maxPoints)
        .map(record => ({
          date: new Date(record.date).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit' 
          }),
          totalLoad: record.totalLoad
        }));
    }

    // Para muitos registros, dividir em grupos temporais
    const sortedRecords = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recordsPerGroup = Math.ceil(sortedRecords.length / maxPoints);
    const groupedData: { date: string; totalLoad: number }[] = [];

    for (let i = 0; i < maxPoints; i++) {
      const startIndex = i * recordsPerGroup;
      const endIndex = Math.min(startIndex + recordsPerGroup, sortedRecords.length);
      const groupRecords = sortedRecords.slice(startIndex, endIndex);
      
      if (groupRecords.length > 0) {
        const totalLoad = groupRecords.reduce((sum, record) => sum + record.totalLoad, 0);
        const firstDate = new Date(groupRecords[0].date);
        const lastDate = new Date(groupRecords[groupRecords.length - 1].date);
        
        let dateLabel;
        if (groupRecords.length === 1) {
          dateLabel = firstDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        } else {
          dateLabel = `${firstDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}-${lastDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
        }
        
        groupedData.push({ date: dateLabel, totalLoad });
      }
    }

    return groupedData;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <Text style={styles.title}>Estatísticas</Text>

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
                selectedExercise === exercise.label && styles.exerciseCardSelected
              ]}
              onPress={() => {
                console.log(
                  "📊 StatisticsScreen: Exercício selecionado mudou de",
                  selectedExercise,
                  "para",
                  exercise.label
                );
                setSelectedExercise(exercise.label);
                // Scroll automático para a seção de período
                setTimeout(() => {
                  if (scrollViewRef.current && periodSectionPosition > 0) {
                    scrollViewRef.current.scrollTo({ y: periodSectionPosition - 20, animated: true });
                  }
                }, 100);
              }}
            >
              {exercise.image ? (
                <Image source={{ uri: exercise.image }} style={styles.exerciseCardImage} />
              ) : (
                <View style={styles.exerciseCardPlaceholder}>
                  <Text style={styles.exerciseCardPlaceholderText}>🏋️</Text>
                </View>
              )}
              {exercise.video && (
                 <View style={styles.videoIndicator}>
                   <Text style={styles.videoIndicatorText}>▶️</Text>
                 </View>
               )}
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

      {/* Seleção de Período */}
      <View 
        style={styles.section}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          setPeriodSectionPosition(y);
        }}
      >
        <Text style={styles.sectionTitle}>Período</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedPeriod}
            onValueChange={(value) => {
              console.log(
                "📊 StatisticsScreen: Período selecionado mudou de",
                selectedPeriod,
                "para",
                value
              );
              setSelectedPeriod(value);
            }}
            style={styles.picker}
            dropdownIconColor={theme.colors.primary}
          >
            {periods.map((period) => (
              <Picker.Item
                key={period.value}
                label={period.label}
                value={period.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {selectedExercise && (
        <>
          {/* Seção de Evolução do Período */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolução do Período</Text>
            {(() => {
              const evolution = calculateEvolution(records);
              
              if (!evolution.firstDay || !evolution.lastDay) {
                return <Text style={styles.noDataText}>Nenhum registro encontrado</Text>;
              }

              const formatEvolution = (value: number) => {
                if (value === 0) return "0%";
                const sign = value > 0 ? "+" : "";
                return `${sign}${value.toFixed(1)}%`;
              };

              return (
                <View style={styles.evolutionContainer}>
                  <View style={styles.evolutionRow}>
                    <Text style={styles.evolutionLabel}>Primeiro dia:</Text>
                    <Text style={styles.evolutionValue}>{evolution.firstDay.totalLoad.toFixed(1)} kg</Text>
                  </View>
                  
                  <View style={styles.evolutionRow}>
                    <Text style={styles.evolutionLabel}>Último dia:</Text>
                    <Text style={styles.evolutionValue}>{evolution.lastDay.totalLoad.toFixed(1)} kg</Text>
                  </View>
                  
                  <View style={styles.evolutionRow}>
                    <Text style={styles.evolutionLabel}>Evolução:</Text>
                    <Text style={[styles.evolutionPercentage, { color: evolution.evolutionColor }]}>
                      {formatEvolution(evolution.evolution)}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>

          {/* Seção de Recordes Editáveis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 20 Recordes</Text>
            <Text style={styles.subtitle}>
              (Máximo 4 séries e 2 minutos de descanso) - Toque para editar
            </Text>

            {topRecords.length > 0 ? (
              topRecords.map((record, index) => (
                <TouchableOpacity 
                  key={record.id} 
                  style={styles.recordCard}
                  onPress={() => {
                    // TODO: Implementar edição de registro
                    console.log("Editar registro:", record.id);
                  }}
                >
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordRank}>#{index + 1}</Text>
                    <Text style={styles.recordExercise}>{record.exercise}</Text>
                    <Text style={styles.editHint}>✏️</Text>
                  </View>

                  {record.image && (
                    <Image
                      source={{ uri: record.image }}
                      style={styles.recordImage}
                    />
                  )}

                  <View style={styles.recordStats}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Carga Total:</Text>
                      <Text style={styles.statValue}>
                        {record.totalLoad.toFixed(1)} kg
                      </Text>
                    </View>

                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Data:</Text>
                      <Text style={styles.statValue}>
                        {formatDate(record.date)}
                      </Text>
                    </View>

                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Repetições:</Text>
                      <Text style={styles.statValue}>{record.totalReps}</Text>
                    </View>

                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Falhas:</Text>
                      <Text style={styles.statValue}>{record.repsFailed}</Text>
                    </View>

                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Descanso:</Text>
                      <Text style={styles.statValue}>{record.restTime}s</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>
                Nenhum recorde válido encontrado
              </Text>
            )}
          </View>
        </>
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
    textAlign: "center",
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
  subtitle: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.md,
    fontStyle: "italic",
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
  exerciseCardsContainer: {
    gap: theme.spacing.sm,
  },
  exerciseCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  exerciseCardImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
  },
  exerciseCardPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  exerciseCardPlaceholderText: {
    fontSize: 24,
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
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  videoIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: 4,
  },
  videoIndicatorText: {
    fontSize: 12,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  chartHeader: {
    marginBottom: theme.spacing.md,
  },
  chartInfo: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  noDataText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    padding: theme.spacing.lg,
  },
  recordCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  recordRank: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
    minWidth: 40,
  },
  recordExercise: {
    ...theme.typography.h3,
    flex: 1,
  },
  recordImage: {
    width: "100%",
    height: 120,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    resizeMode: "cover",
  },
  recordStats: {
    gap: theme.spacing.xs,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  statValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "600",
  },
  editHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  evolutionContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  evolutionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    minHeight: 40,
  },
  evolutionLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    width: 100,
    marginRight: theme.spacing.sm,
  },
  evolutionValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    minWidth: 80,
  },
  evolutionPercentage: {
    ...theme.typography.h2,
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
    minWidth: 100,
  },
});
