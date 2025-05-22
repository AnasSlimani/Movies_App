import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { icons } from "@/constants/icons";
import { useAuth } from "@/contexts/auth-context";
import { getSavedMovies } from "@/services/appwrite";

const ProfileStat = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: any;
}) => (
  <View className="bg-dark-200 rounded-lg p-4 flex-1">
    <View className="flex-row items-center mb-2">
      <Image source={icon} className="size-5 mr-2" tintColor="#AB8BFF" />
      <Text className="text-light-200 text-sm">{label}</Text>
    </View>
    <Text className="text-white text-xl font-bold">{value}</Text>
  </View>
);

const ProfileOption = ({
  label,
  icon,
  onPress,
  danger = false,
}: {
  label: string;
  icon: any;
  onPress: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    className="flex-row items-center py-4 border-b border-dark-100"
    onPress={onPress}
  >
    <Image
      source={icon}
      className="size-5 mr-3"
      tintColor={danger ? "#FF5252" : "#A8B5DB"}
    />
    <Text className={`text-base ${danger ? "text-red-500" : "text-white"}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Profile = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const savedMovies = await getSavedMovies();
        setSavedCount(savedMovies.length);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            await logout();
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="bg-primary flex-1 px-5">
        <View className="flex-1 justify-center items-center">
          <Image
            source={icons.person}
            className="size-16 mb-6"
            tintColor="#A8B5DB"
          />
          <Text className="text-white text-xl font-bold mb-4 text-center">
            Sign in to access your profile
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

  if (loading) {
    return (
      <SafeAreaView className="bg-primary flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#AB8BFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary flex-1">
      <ScrollView className="flex-1 px-5">
        <View className="flex-row items-center justify-between mt-4 mb-6">
          <Text className="text-white text-2xl font-bold">Profile</Text>
          <Image source={icons.logo} className="w-10 h-8" />
        </View>

        <View className="items-center mb-8">
          <View className="bg-accent rounded-full size-24 items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">{user?.name}</Text>
          <Text className="text-light-300">{user?.email}</Text>
        </View>

        <View className="flex-row gap-4 mb-8">
          <ProfileStat
            label="Saved Movies"
            value={savedCount}
            icon={icons.save}
          />
          <ProfileStat
            label="Member Since"
            value={new Date().getFullYear()}
            icon={icons.person}
          />
        </View>

        <View className="bg-dark-300 rounded-lg p-4 mb-8">
          <Text className="text-white font-bold text-lg mb-4">Settings</Text>

          <ProfileOption
            label="Saved Movies"
            icon={icons.save}
            onPress={() => router.push("/save")}
          />
          <ProfileOption
            label="About App"
            icon={icons.logo}
            onPress={() => {
              Alert.alert(
                "About",
                "Movies App v1.0\nA Netflix-like app for browsing movies."
              );
            }}
          />
          <ProfileOption
            label="Logout"
            icon={icons.person}
            onPress={handleLogout}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;