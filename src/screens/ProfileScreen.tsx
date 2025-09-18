import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '../styles/theme';
import { UserStats, ExerciseRecord } from '../types';
import { getExerciseRecords, clearAllData, importExerciseRecords } from '../database/database';

export default function ProfileScreen() {
  const [stats, setStats] = useState<UserStats>({
    totalWorkouts: 0,
    totalLoad: 0,
    favoriteExercise: 'Nenhum',
    longestStreak: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    console.log("👤 ProfileScreen: Componente montado, carregando estatísticas...");
    try {
      loadUserStats();
    } catch (error) {
      console.error("❌ ProfileScreen: Erro no useEffect inicial:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
    }
  }, []);

  const loadUserStats = () => {
    try {
      const records = getExerciseRecords();
      
      if (records.length === 0) {
        return;
      }

      // Calcular estatísticas
      const totalWorkouts = records.length;
      const totalLoad = records.reduce((sum, record) => sum + record.totalLoad, 0);
      
      // Exercício favorito (mais praticado)
      const exerciseCount: { [key: string]: number } = {};
      records.forEach(record => {
        exerciseCount[record.exercise] = (exerciseCount[record.exercise] || 0) + 1;
      });
      
      const favoriteExercise = Object.keys(exerciseCount).reduce((a, b) => 
        exerciseCount[a] > exerciseCount[b] ? a : b
      ) || 'Nenhum';

      // Calcular streaks (sequência de dias consecutivos)
      const workoutDates = records
        .map(record => new Date(record.date).toDateString())
        .filter((date, index, array) => array.indexOf(date) === index)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Verificar streak atual
      if (workoutDates.length > 0) {
        const lastWorkout = new Date(workoutDates[0]);
        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();
        
        if (lastWorkout.toDateString() === todayStr || lastWorkout.toDateString() === yesterdayStr) {
          currentStreak = 1;
          
          for (let i = 1; i < workoutDates.length; i++) {
            const currentDate = new Date(workoutDates[i - 1]);
            const nextDate = new Date(workoutDates[i]);
            const diffTime = currentDate.getTime() - nextDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      // Calcular maior streak
      for (let i = 0; i < workoutDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const currentDate = new Date(workoutDates[i - 1]);
          const nextDate = new Date(workoutDates[i]);
          const diffTime = currentDate.getTime() - nextDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      setStats({
        totalWorkouts,
        totalLoad,
        favoriteExercise,
        longestStreak,
        currentStreak,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const records = getExerciseRecords();
      
      if (records.length === 0) {
        Alert.alert('Aviso', 'Não há dados para exportar');
        return;
      }

      // Criar CSV
      const csvHeader = 'Exercício,Carga Total,Repetições,Peso Usado,Data,Tempo Descanso,Repetições Falhadas,Séries,Descrição\n';
      const csvData = records.map(record => {
        const date = new Date(record.date).toLocaleDateString('pt-BR');
        return `"${record.exercise}",${record.totalLoad},${record.totalReps},${record.weightUsed},"${date}",${record.restTime},${record.repsFailed || 0},${record.series || 1},"${record.description || ''}"`;
      }).join('\n');

      const csvContent = csvHeader + csvData;
      const fileName = `exercicios_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Usar expo-sharing para permitir que o usuário escolha onde salvar
      if (await Sharing.isAvailableAsync()) {
        // Criar arquivo temporário para compartilhamento
        const file = new File(Paths.cache, fileName);
        await file.write(csvContent);
        
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Salvar arquivo de exercícios',
          UTI: 'public.comma-separated-values-text'
        });
        
        Alert.alert(
          'Dados Exportados',
          'Arquivo CSV criado com sucesso! Você pode escolher onde salvá-lo (Downloads, Google Drive, etc.).',
          [{ text: 'OK' }]
        );
      } else {
        // Fallback: criar arquivo no diretório de documentos
        const file = new File(Paths.document, fileName);
        await file.write(csvContent);
        
        Alert.alert(
          'Dados Exportados',
          `Dados exportados em formato CSV para: ${fileName}\nLocalização: ${file.uri}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar dados');
      console.error('❌ Erro na exportação:', error);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name || '';
        
        // Verificar se é um arquivo CSV
        if (!fileName.toLowerCase().endsWith('.csv')) {
          Alert.alert('Erro', 'Por favor, selecione um arquivo CSV válido (.csv)');
          return;
        }
        
        const file = new File(fileUri);
        const fileContent = await file.text();
        
        // Parse CSV
        const lines = fileContent.split('\n');
        if (lines.length < 2) {
          Alert.alert('Erro', 'Arquivo CSV vazio ou inválido');
          return;
        }

        // Remover cabeçalho
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');
        const records: ExerciseRecord[] = [];

        for (const line of dataLines) {
          try {
            // Parse CSV line melhorado (considerando aspas e vírgulas dentro de campos)
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim()); // Adicionar último valor
            
            if (values.length >= 8) {
              const record: ExerciseRecord = {
                exercise: values[0],
                totalLoad: parseFloat(values[1]) || 0,
                totalReps: parseInt(values[2]) || 0,
                weightUsed: parseFloat(values[3]) || 0,
                date: new Date(values[4].split('/').reverse().join('-')).toISOString(),
                restTime: parseInt(values[5]) || 80,
                repsFailed: parseInt(values[6]) || 0,
                series: parseInt(values[7]) || 1,
                description: values[8] || ''
              };
              records.push(record);
            }
          } catch (parseError) {
            console.warn('Erro ao processar linha:', line, parseError);
          }
        }

        if (records.length === 0) {
          Alert.alert('Erro', 'Nenhum registro válido encontrado no arquivo CSV');
          return;
        }

        Alert.alert(
          'Importar Dados',
          `⚠️ ATENÇÃO: Esta ação irá substituir TODOS os seus dados atuais!\n\nEncontrados ${records.length} registros no arquivo CSV.\n\nDeseja continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Importar', 
              style: 'destructive',
              onPress: async () => {
                try {
                  await importExerciseRecords(records);
                  Alert.alert(
                    'Sucesso', 
                    `${records.length} registros importados com sucesso!`,
                    [{ text: 'OK', onPress: () => loadUserStats() }]
                  );
                } catch (importError) {
                  Alert.alert('Erro', 'Erro ao importar dados para o banco');
                  console.error(importError);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao importar dados');
      console.error(error);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Esta ação irá apagar TODOS os seus dados de treino. Esta ação não pode ser desfeita!',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'APAGAR TUDO', 
          style: 'destructive',
          onPress: async () => {
            try {
              clearAllData();
              await AsyncStorage.clear();
              setStats({
                totalWorkouts: 0,
                totalLoad: 0,
                favoriteExercise: 'Nenhum',
                longestStreak: 0,
                currentStreak: 0,
              });
              Alert.alert('Sucesso', 'Todos os dados foram apagados');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao limpar dados');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const StatCard = ({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle} numberOfLines={2}>{title}</Text>
      <Text style={styles.statValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle} numberOfLines={2}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      
      {/* Botão de Recarregar Dados */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadUserStats}>
        <Text style={styles.refreshButtonText}>🔄 Atualizar Dados</Text>
      </TouchableOpacity>
      
      {/* Estatísticas Principais */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suas Estatísticas</Text>
        
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total de Treinos" 
            value={stats.totalWorkouts}
            subtitle="exercícios realizados"
          />
          
          <StatCard 
            title="Carga Total Movimentada" 
            value={`${stats.totalLoad.toFixed(1)} kg`}
            subtitle="peso total levantado"
          />
          
          <StatCard 
            title="Exercício Favorito" 
            value={stats.favoriteExercise}
            subtitle="mais praticado"
          />
          
          <StatCard 
            title="Sequência Atual" 
            value={`${stats.currentStreak} dias`}
            subtitle="consecutivos treinando"
          />
          
          <StatCard 
            title="Maior Sequência" 
            value={`${stats.longestStreak} dias`}
            subtitle="recorde pessoal"
          />
          
          <StatCard 
            title="Média por Treino" 
            value={stats.totalWorkouts > 0 ? `${(stats.totalLoad / stats.totalWorkouts).toFixed(1)} kg` : '0 kg'}
            subtitle="carga média"
          />
        </View>
      </View>

      {/* Conquistas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conquistas</Text>
        
        <View style={styles.achievementsList}>
          <View style={[styles.achievement, stats.totalWorkouts >= 10 && styles.achievementUnlocked]}>
            <Text style={styles.achievementIcon}>🏋️</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Iniciante</Text>
              <Text style={styles.achievementDescription}>Complete 10 treinos</Text>
            </View>
            <Text style={styles.achievementStatus}>
              {stats.totalWorkouts >= 10 ? '✅' : `${stats.totalWorkouts}/10`}
            </Text>
          </View>

          <View style={[styles.achievement, stats.totalWorkouts >= 50 && styles.achievementUnlocked]}>
            <Text style={styles.achievementIcon}>💪</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Dedicado</Text>
              <Text style={styles.achievementDescription}>Complete 50 treinos</Text>
            </View>
            <Text style={styles.achievementStatus}>
              {stats.totalWorkouts >= 50 ? '✅' : `${stats.totalWorkouts}/50`}
            </Text>
          </View>

          <View style={[styles.achievement, stats.longestStreak >= 7 && styles.achievementUnlocked]}>
            <Text style={styles.achievementIcon}>🔥</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Consistente</Text>
              <Text style={styles.achievementDescription}>7 dias consecutivos</Text>
            </View>
            <Text style={styles.achievementStatus}>
              {stats.longestStreak >= 7 ? '✅' : `${stats.longestStreak}/7`}
            </Text>
          </View>

          <View style={[styles.achievement, stats.totalLoad >= 1000 && styles.achievementUnlocked]}>
            <Text style={styles.achievementIcon}>🏆</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Forte</Text>
              <Text style={styles.achievementDescription}>1000kg movimentados</Text>
            </View>
            <Text style={styles.achievementStatus}>
              {stats.totalLoad >= 1000 ? '✅' : `${stats.totalLoad.toFixed(0)}/1000`}
            </Text>
          </View>
        </View>
      </View>

      {/* Gerenciamento de Dados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciar Dados</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
          <Text style={styles.actionButtonText}>📤 Exportar Dados</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleImportData}>
          <Text style={styles.actionButtonText}>📥 Importar Dados</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearAllData}>
          <Text style={styles.dangerButtonText}>🗑️ Limpar Todos os Dados</Text>
        </TouchableOpacity>
      </View>
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
  statsGrid: {
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  statCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    width: '100%',
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexShrink: 1,
  },
  statTitle: {
    ...theme.typography.caption,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  statSubtitle: {
    ...theme.typography.caption,
    textAlign: 'center',
    fontSize: 12,
    flexWrap: 'wrap',
  },
  achievementsList: {
    gap: theme.spacing.md,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.6,
  },
  achievementUnlocked: {
    opacity: 1,
    borderColor: theme.colors.primary,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  achievementDescription: {
    ...theme.typography.caption,
  },
  achievementStatus: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  actionButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  refreshButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
});