import {
    Alert,
    Linking,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "react-native";

type ExerciseCardProps = {
  title: string;
  type: string;
  lastSessionSummary?: string;
  description?: string;
  youtubeLink?: string;
  onPress?: () => void;
  imageUri?: string;
};

export function ExerciseCard({
  title,
  type,
  description,
  youtubeLink,
  onPress,
  imageUri,
}: ExerciseCardProps) {
  const theme = useColorScheme() ?? "light";
  const borderColor = theme === "light" ? "#1F2937" : "#1F2937";
  const iconColor = theme === "light" ? Colors.light.icon : Colors.dark.icon;

  const handleYoutubePress = async () => {
    if (!youtubeLink) return;

    try {
      const canOpen = await Linking.canOpenURL(youtubeLink);

      if (canOpen) {
        await Linking.openURL(youtubeLink);
      } else {
        await Linking.openURL(youtubeLink);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o link do YouTube");
    }
  };

  const getYouTubeVideoId = (rawUrl: string) => {
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.replace(/^www\./, "");

      if (host === "youtube.com" || host.endsWith(".youtube.com")) {
        const vParam = url.searchParams.get("v");
        if (vParam && /^[\w-]{11}$/.test(vParam)) return vParam;

        const parts = url.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1];
        if (last && /^[\w-]{11}$/.test(last)) return last;
      }

      if (host === "youtu.be") {
        const seg = url.pathname.split("/").filter(Boolean)[0];
        if (seg && /^[\w-]{11}$/.test(seg)) return seg;
      }
    } catch {}

    const regex =
      /(?:youtube\.com\/(?:.*[?&]v=|(?:shorts|embed|v)\/)|youtu\.be\/)([\w-]{11})/;
    const match = rawUrl.match(regex);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;
  };

  const thumbnailUrl = youtubeLink ? getYouTubeThumbnail(youtubeLink) : null;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <ThemedView style={[styles.card, { borderColor }]}>
        <View style={styles.row}>
          <IconSymbol
            name="figure.strengthtraining.traditional"
            color={iconColor}
            size={20}
          />
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {title}
          </ThemedText>
        </View>
        <ThemedText style={styles.meta}>{type}</ThemedText>

        {description ? (
          <ThemedText style={styles.description}>{description}</ThemedText>
        ) : null}

        {youtubeLink ? (
          <TouchableOpacity
            style={styles.youtubeContainer}
            onPress={handleYoutubePress}
            activeOpacity={0.7}
          >
            {thumbnailUrl && (
              <View style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.playButtonOverlay}>
                  <IconSymbol
                    name="play.circle.fill"
                    color="#FFFFFF"
                    size={40}
                  />
                </View>
              </View>
            )}
            <View style={styles.youtubeContent}>
              <View style={styles.youtubeRow}>
                <IconSymbol name="play.circle.fill" color="#FF0000" size={20} />
                <ThemedText style={styles.youtubeText}>
                  Assistir no YouTube
                </ThemedText>
              </View>
              <ThemedText style={styles.youtubeLink}>
                {youtubeLink
                  .replace("https://www.", "")
                  .replace("https://", "")}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ) : null}

        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
  },
  meta: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  summary: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  youtubeContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "rgba(255, 0, 0, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.1)",
  },
  thumbnailContainer: {
    position: "relative",
    marginBottom: 8,
  },
  thumbnail: {
    width: "100%",
    height: 120,
    borderRadius: 6,
  },
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 6,
  },
  youtubeContent: {
    flex: 1,
  },
  youtubeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  youtubeText: {
    fontSize: 14,
    color: "#FF0000",
    fontWeight: "600",
  },
  youtubeLink: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
});
