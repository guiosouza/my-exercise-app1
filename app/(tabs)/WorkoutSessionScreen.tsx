import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ExerciseCard } from "@/components/exercise-card";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function WorkoutSessionScreen() {
  const mockedExerciseData = [
    {
      id: 1,
      title: "Flexão",
      type: "Peso corporal",
      description:
        "Flexão é um exercício cardiorrespiratório que fortalece os músculos do peito, tríceps e glúteos.",
      youtubeLink: "https://www.youtube.com/shorts/FyhRWcdJbAo",
    },
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#0F172A", dark: "#0F172A" }}
      headerImage={
        <Image
          source={require("@/assets/images/react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Exercícios</ThemedText>
      </ThemedView>
      <ThemedView style={styles.listContainer}>
        <View style={styles.cards}>
          {mockedExerciseData.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              title={exercise.title}
              type={`Tipo: ${exercise.type}`}
              description={exercise.description}
              youtubeLink={exercise.youtubeLink}
            />
          ))}
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listContainer: {
    gap: 8,
    marginBottom: 8,
  },
  cards: {
    gap: 12,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
