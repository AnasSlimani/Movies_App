import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { icons } from "@/constants/icons";

export default function Login() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      const loginResponse = await login(email, password);
      console.log(loginResponse);
      router.back();
    } catch (error) {
      setError("Invalid email or password");
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-primary"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-8 pt-20">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-14 left-5 z-10"
          >
            <Image source={icons.arrow} className="size-6" tintColor="#fff" />
          </TouchableOpacity>

          <View className="items-center mb-10">
            <Image source={icons.logo} className="w-16 h-14" />
          </View>

          <Text className="text-white text-3xl font-bold mb-8">Login</Text>

          {error ? (
            <View className="bg-red-900/30 p-3 rounded-lg mb-4">
              <Text className="text-red-500 text-center">{error}</Text>
            </View>
          ) : null}

          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-light-200 mb-2 text-sm">Email</Text>
              <TextInput
                className="bg-dark-200 text-white rounded-lg px-4 py-3"
                placeholder="Enter your email"
                placeholderTextColor="#A8B5DB"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-light-200 mb-2 text-sm">Password</Text>
              <TextInput
                className="bg-dark-200 text-white rounded-lg px-4 py-3"
                placeholder="Enter your password"
                placeholderTextColor="#A8B5DB"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-accent rounded-lg py-4 items-center mb-6"
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Login</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-light-200">Don't have an account? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text className="text-accent font-semibold">Register</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}