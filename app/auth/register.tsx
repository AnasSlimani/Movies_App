"use client"

import { useState } from "react"
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
} from "react-native"
import { useRouter, Link } from "expo-router"
import { useAuth } from "@/contexts/auth-context"
import { icons } from "@/constants/icons"

export default function Register() {
  const router = useRouter()
  const { register, isLoading } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleRegister = async () => {
    // Clear previous errors
    setError("")

    // Validate inputs
    if (!name || !email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      console.log("Attempting to register with:", { email, name }) // Don't log password
      await register(email, password, name)
      console.log("Registration successful")
      router.navigate("/");
    } catch (error: any) {
      console.error("Registration failed:", error)
      // The error alert is already shown in the auth context
      // Just update the local error state for UI display
      setError(error.message || "Registration failed. Please try again.")
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-8 pt-20">
          <TouchableOpacity onPress={() => router.back()} className="absolute top-14 left-5 z-10">
            <Image source={icons.arrow} className="size-6" tintColor="#fff" />
          </TouchableOpacity>

          <View className="items-center mb-10">
            <Image source={icons.logo} className="w-16 h-14" />
          </View>

          <Text className="text-white text-3xl font-bold mb-8">Register</Text>

          {error ? (
            <View className="bg-red-900/30 p-3 rounded-lg mb-4">
              <Text className="text-red-500 text-center">{error}</Text>
            </View>
          ) : null}

          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-light-200 mb-2 text-sm">Name</Text>
              <TextInput
                className="bg-dark-200 text-white rounded-lg px-4 py-3"
                placeholder="Enter your name"
                placeholderTextColor="#A8B5DB"
                value={name}
                onChangeText={setName}
              />
            </View>

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
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Register</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-light-200">Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text className="text-accent font-semibold">Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
