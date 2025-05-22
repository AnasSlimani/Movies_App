import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";

import { icons } from "@/constants/icons";
import { getSavedMovies, unsaveMovie } from "@/services/appwrite";
import { useAuth } from "@/contexts/auth-context";

interface SavedMovie {
  $id: string;
  userId: string;
  movieId: string;
  title: string;
  posterPath: string;
  voteAverage: number;
  releaseDate: string;
  savedAt: string;
}

const SavedMovieCard = ({
  movie,
  onRemove,
}: {
  movie: SavedMovie;
  onRemove: () => void;
}) => {
  return (
    <View className="flex-row bg-dark-200 rounded-lg overflow-hidden mb-4">
      <Link href={`/movie/${movie.movieId}`} asChild>
        <TouchableOpacity className="flex-row flex-1">
          <Image
            source={{
              uri: movie.posterPath
                ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                : "https://placehold.co/600x400/1a1a1a/FFFFFF.png",
            }}
            className="w-24 h-36"
            resizeMode="cover"
          />
          <View className="flex-1 p-3 justify-between">
            <View>
              <Text className="text-white font-bold text-lg" numberOfLines={2}>
                {movie.title}
              </Text>
              <Text className="text-light-300 text-sm mt-1">
                {new Date(movie.releaseDate).getFullYear()}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Image source={icons.star} className="size-4 mr-1" />
              <Text className="text-white font-bold">
                {Math.round(movie.voteAverage)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity
        className="bg-red-600 justify-center px-4"
        onPress={onRemove}
      >
        <Text className="text-white font-bold">Remove</Text>
      </TouchableOpacity>
    </View>
  );
};

const Save = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [savedMovies, setSavedMovies] = useState<SavedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSavedMovies = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const movies = await getSavedMovies();
      setSavedMovies(movies as unknown as SavedMovie[]);
    } catch (error) {
      console.error("Error loading saved movies:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSavedMovies();
  }, [isAuthenticated]);

  const handleRemoveMovie = async (movieId: string) => {
    try {
      await unsaveMovie(movieId);
      setSavedMovies((prev) => prev.filter((m) => m.movieId !== movieId));
    } catch (error) {
      console.error("Error removing movie:", error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSavedMovies();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="bg-primary flex-1 px-5">
        <View className="flex-1 justify-center items-center">
          <Image
            source={icons.save}
            className="size-16 mb-6"
            tintColor="#A8B5DB"
          />
          <Text className="text-white text-xl font-bold mb-4 text-center">
            Sign in to save movies
          </Text>
          <Text className="text-light-300 text-center mb-8">
            Create an account to keep track of your favorite movies
          </Text>
          <TouchableOpacity
            className="bg-accent rounded-lg py-3 px-8"
            onPress={() => router.push("/auth/login")}
          >
            <Text className="text-white font-bold text-base">Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary flex-1 px-5">
      <View className="flex-row items-center justify-between mt-4 mb-6">
        <Text className="text-white text-2xl font-bold">Saved Movies</Text>
        <Image source={icons.logo} className="w-10 h-8" />
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#AB8BFF" />
        </View>
      ) : savedMovies.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Image
            source={icons.save}
            className="size-16 mb-6"
            tintColor="#A8B5DB"
          />
          <Text className="text-white text-xl font-bold mb-4 text-center">
            No saved movies yet
          </Text>
          <Text className="text-light-300 text-center mb-8">
            Start exploring and save movies you like
          </Text>
          <TouchableOpacity
            className="bg-accent rounded-lg py-3 px-8"
            onPress={() => router.push("/")}
          >
            <Text className="text-white font-bold text-base">
              Explore Movies
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedMovies}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <SavedMovieCard
              movie={item}
              onRemove={() => handleRemoveMovie(item.movieId)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#AB8BFF"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Save;