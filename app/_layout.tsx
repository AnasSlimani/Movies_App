import { Stack } from "expo-router";
import "./globals.css";
import { StatusBar } from "react-native";
import { AuthProvider } from "@/contexts/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar hidden={true} />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="movie/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}