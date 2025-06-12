
import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import { getCurrentUser, login, logout, createAccount } from "@/services/appwrite"
import { Alert } from "react-native"

type User = {
  $id: string
  name: string
  email: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => false,
  register: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkUserStatus = async () => {
    try {
      setIsLoading(true)
      const currentUser = await getCurrentUser()

      if (currentUser) {
        setUser({
          $id: currentUser.$id,
          name: currentUser.name,
          email: currentUser.email,
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error checking user status:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Only check user status once when component mounts
  useEffect(() => {
    checkUserStatus()
  }, [])

  const loginUser = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      await login(email, password)
      await checkUserStatus()
    } catch (error: any) {
      console.error("Login error:", error)
      Alert.alert("Login Error", "Invalid email or password. Please try again.")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const registerUser = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true)
      // REMOVED: await logout(); - This was causing issues
      await createAccount(email, password, name)
      await checkUserStatus()
    } catch (error: any) {
      console.error("Registration error:", error)

      // Provide more specific error messages
      if (error.message && error.message.includes("Collection with the requested ID could not be found")) {
        Alert.alert("Registration Error", "There was an issue with the database configuration. Please contact support.")
      } else if (error.message && error.message.includes("A user with the same email already exists")) {
        Alert.alert("Registration Error", "A user with this email already exists.")
      } else if (error.message && error.message.includes("missing scope")) {
        Alert.alert("Registration Error", "Authentication service configuration issue. Please contact support.")
      } else {
        Alert.alert("Registration Error", "Failed to create account. Please try again.")
      }

      throw error
    } finally {
      setIsLoading(false)
    }
  }

const logoutUser = async () => {
  try {
    setIsLoading(true);
    await logout();
    setUser(null); // Clear local state
    return true
    
  } catch (error) {
    console.error("Logout error:", error);
    setUser(null); // Still clear local state even if error
    return false;
  } finally {
    setIsLoading(false);
  }
};

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login: loginUser,
        logout: logoutUser,
        register: registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
