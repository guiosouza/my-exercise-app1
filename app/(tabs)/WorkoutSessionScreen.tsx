import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ExerciseCard } from "@/components/exercise-card";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ensureDb as ensureExerciseDb,
  getAllExercises,
} from "@/lib/exercises-repo";
import {
  calculateEffectiveWeight,
  calculateTotalLoad,
  createWorkoutSessionFromForm,
} from "@/lib/workout-sessions-repo";
import type { Exercise, WorkoutSessionFormData } from "@/types/entities";

export default function WorkoutSessionScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const placeholderColor = Colors[colorScheme].icon;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState<WorkoutSessionFormData>({
    completeReps: 0,
    negativeReps: 0,
    failedReps: 0,
    sets: 4,
    weight: 0,
    restTime: 80,
  });
  const [weightInput, setWeightInput] = useState<string>("0");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    ensureExerciseDb();
    reloadExercises();
  }, []);

  async function reloadExercises() {
    setLoading(true);
    try {
      const list = await getAllExercises();
      setExercises(list);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }

  function openFormFor(ex: Exercise) {
    setSelectedExercise(ex);
    setForm({
      completeReps: 0,
      negativeReps: 0,
      failedReps: 0,
      sets: 4,
      weight: 0,
      restTime: 80,
    });
    setWeightInput("0");
    setIsModalVisible(true);
  }

  const previewTotalLoad = useMemo(() => {
    if (!selectedExercise) return 0;
    return calculateTotalLoad(selectedExercise, form);
  }, [selectedExercise, form]);

  const previewEffectiveWeight = useMemo(() => {
    if (!selectedExercise) return 0;
    return (
      Math.round(
        calculateEffectiveWeight(selectedExercise, form.weight || 0) * 100
      ) / 100
    );
  }, [selectedExercise, form.weight]);

  async function handleSave() {
    if (!selectedExercise) return;
    try {
      setSaving(true);
      await createWorkoutSessionFromForm(selectedExercise, form);
      setSaving(false);
      setIsModalVisible(false);
      Alert.alert("Sucesso", "Sessão de treino gravada.");
    } catch (error) {
      setSaving(false);
      Alert.alert("Erro", `Não foi possível gravar a sessão. Tente recarregar a lista de exercício. Eis o motivo do erro: ${error}`);
    }
  }

  const filteredExercises = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => {
      const title = (ex.title || "").toLowerCase();
      const desc = (ex.description || "").toLowerCase();
      const typeLabel = ex.type === "weight" ? "peso" : "peso corporal";
      return title.includes(q) || desc.includes(q) || typeLabel.includes(q);
    });
  }, [exercises, searchQuery]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#0F172A", dark: "#0F172A" }}
      contentStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Exercícios</ThemedText>
        <TouchableOpacity
          onPress={reloadExercises}
          disabled={loading}
          style={styles.reloadButton}
          accessibilityLabel="Recarregar lista de exercícios"
        >
          <ThemedText style={styles.reloadButtonText}>
            {loading ? "Recarregando..." : "Recarregar lista"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar exercícios..."
          placeholderTextColor={placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <View style={styles.instructionsRow}>
        <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">
          Clique em um exercício para gravar uma sessão de treino.
        </ThemedText>
      </View>

      {loading ? (
        <ThemedText style={{ color: "#9CA3AF" }}>Carregando...</ThemedText>
      ) : exercises.length === 0 ? (
        <ThemedText style={{ color: "#9CA3AF" }}>
          Nenhum exercício cadastrado.
        </ThemedText>
      ) : filteredExercises.length === 0 ? (
        <ThemedText style={{ color: "#9CA3AF" }}>
          Nenhum exercício encontrado para &quot;{searchQuery}&quot;.
        </ThemedText>
      ) : (
        <View style={{ gap: 12 }}>
          {filteredExercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              title={ex.title}
              type={ex.type === "weight" ? "Peso" : "Peso corporal"}
              description={ex.description}
              youtubeLink={ex.youtubeLink}
              imageUri={ex.imageUri}
              onPress={() => openFormFor(ex)}
              onEdit={() => openFormFor(ex)}
            />
          ))}
        </View>
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <ThemedView style={styles.modalCard}>
            <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">
              Nova sessão de treino
            </ThemedText>

            {!!selectedExercise?.youtubeLink && (
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => {
                  // O ExerciseCard já trata abrir, aqui apenas exibimos o link
                  Alert.alert(
                    "Dica",
                    "Abra o vídeo pelo card do exercício na lista."
                  );
                }}
              >
                <IconSymbol name="play.circle.fill" color="#FF0000" size={18} />
                <ThemedText style={{ color: "#FF0000" }}>
                  Ver vídeo do exercício
                </ThemedText>
              </TouchableOpacity>
            )}

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                Repetições completas
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={placeholderColor}
                keyboardType="numeric"
                value={String(form.completeReps ?? 0)}
                onChangeText={(t) =>
                  setForm((p) => ({
                    ...p,
                    completeReps: Number(t.replace(/\D/g, "")) || 0,
                  }))
                }
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                  Negativas
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={String(form.negativeReps ?? 0)}
                  onChangeText={(t) =>
                    setForm((p) => ({
                      ...p,
                      negativeReps: Number(t.replace(/\D/g, "")) || 0,
                    }))
                  }
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                  Falhas
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={String(form.failedReps ?? 0)}
                  onChangeText={(t) =>
                    setForm((p) => ({
                      ...p,
                      failedReps: Number(t.replace(/\D/g, "")) || 0,
                    }))
                  }
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                  Séries
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={String(form.sets ?? 0)}
                  onChangeText={(t) =>
                    setForm((p) => ({
                      ...p,
                      sets: Number(t.replace(/\D/g, "")) || 0,
                    }))
                  }
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                  Peso (kg)
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={placeholderColor}
                  keyboardType={
                    Platform.OS === "ios" ? "decimal-pad" : "numeric"
                  }
                  value={weightInput}
                  onChangeText={(t) => {
                    let normalized = t
                      .replace(",", ".")
                      .replace(/[^0-9.]/g, "");
                    const dotIndex = normalized.indexOf(".");
                    if (dotIndex !== -1) {
                      normalized =
                        normalized.slice(0, dotIndex + 1) +
                        normalized.slice(dotIndex + 1).replace(/\./g, "");
                    }
                    if (normalized.startsWith("."))
                      normalized = "0" + normalized;
                    setWeightInput(normalized);
                    setForm((p) => ({
                      ...p,
                      weight:
                        normalized === "" || normalized === "."
                          ? 0
                          : parseFloat(normalized),
                    }));
                  }}
                />
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">
                Descanso (s)
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="80"
                placeholderTextColor={placeholderColor}
                keyboardType="numeric"
                value={String(form.restTime ?? 80)}
                onChangeText={(t) =>
                  setForm((p) => ({
                    ...p,
                    restTime: Number(t.replace(/\D/g, "")) || 80,
                  }))
                }
              />
            </View>

            {selectedExercise && (
              <ThemedView style={styles.previewCard}>
                <ThemedText
                  lightColor="#FFFFFF"
                  darkColor="#FFFFFF"
                  style={{ fontWeight: "700" }}
                >
                  Prévia da carga total
                </ThemedText>
                <ThemedText lightColor="#9CA3AF" darkColor="#9CA3AF">
                  Peso efetivo por rep: {previewEffectiveWeight} kg
                </ThemedText>
                <ThemedText
                  type="title"
                  lightColor="#FFFFFF"
                  darkColor="#FFFFFF"
                >
                  {previewTotalLoad} kg
                </ThemedText>
              </ThemedView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
                disabled={saving}
              >
                <ThemedText style={styles.cancelButtonText}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving || !selectedExercise}
              >
                <ThemedText style={styles.saveButtonText}>
                  {saving ? "Gravando..." : "Gravar sessão"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#0F172A",
    gap: 12,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  previewCard: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    gap: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 6,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  cancelButtonText: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#00110A",
    fontWeight: "700",
  },
  linkRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  reloadRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  reloadButton: {
    backgroundColor: "#1F2937",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  reloadButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  searchRow: {
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#FFFFFF",
  },
  headerImage: {
    height: 178,
    width: "100%",
    bottom: 0,
    position: "absolute",
  },
  instructionsRow: {
    marginTop: 32,
    marginBottom: 32,
  },
});
