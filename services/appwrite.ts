import { Client, Databases, ID, Query, Account } from "react-native-appwrite"

// Get database and collection IDs from environment variables
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!
const METRICS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!
const SAVED_MOVIES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_MOVIES_COLLECTION_ID!
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)

const database = new Databases(client)
const account = new Account(client)

// FIXED: createAccount function with correct session creation
export const createAccount = async (email: string, password: string, name: string) => {
  try {
    // Generate a valid user ID using Appwrite's ID utility

    console.log("data base id : " + DATABASE_ID);
    console.log("metrics id : " + METRICS_COLLECTION_ID);
    console.log("saved movies id : " + METRICS_COLLECTION_ID);
    console.log("user colection  id : " + USERS_COLLECTION_ID);
    
  
    const userId = ID.unique()
    console.log("Generated userId:", userId)

    // Create the account with the valid ID
    const newAccount = await account.create(userId, email, password, name)
    console.log("Account created successfully:", newAccount.$id)

    // FIXED: Use createEmailSession instead of createSession
    const session = await account.createEmailPasswordSession(email,password)
    console.log("Session created successfully:", session.$id)

    // Create user profile in database
    try {
      await database.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        newAccount.$id, // Use the same ID for the document
        {
          email,
          name,
          password,
          createdAt: new Date().toISOString(),
        },
      )
      console.log("User profile created successfully")
    } catch (dbError) {
      console.error("Error creating user profile:", dbError)
      await account.deleteSession("current")
      // Continue even if profile creation fails
    }

    return session
  } catch (error) {
    console.error("Error creating account:", error)
    throw error
  }
}

// FIXED: login function with correct session creation
export const login = async (email: string, password: string) => {
  try {
    // FIXED: Use createEmailSession instead of createSession
    const session = await account.createEmailPasswordSession(email, password)
    if (session){
      return session.$id
    }
    return "badr"
  } catch (error) {
    console.error("Error logging in:", error)
    throw error
  }
}

export const logout = async () => {
  try {
    // Delete all sessions to be thorough
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error("Error logging out:", error);
    return false;
  }
};

// Improved getCurrentUser function with better error handling
export const getCurrentUser = async () => {
  try {
    // Check if we have an active session first
    try {
      const session = await account.getSession("current")
      if (!session) {
        console.log("No active session found")
        return null
      }
    } catch (sessionError) {
      console.log("No active session:", sessionError)
      return null
    }

    // If we have a session, try to get the user
    return await account.get()
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Existing functions (keeping them as they were working)
export const updateSearchCount = async (query: string, movie: any) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, METRICS_COLLECTION_ID, [Query.equal("searchTerm", query)])

    if (result.documents.length > 0) {
      const existingMovie = result.documents[0]
      await database.updateDocument(DATABASE_ID, METRICS_COLLECTION_ID, existingMovie.$id, {
        count: existingMovie.count + 1,
      })
    } else {
      await database.createDocument(DATABASE_ID, METRICS_COLLECTION_ID, ID.unique(), {
        searchTerm: query,
        movie_id: movie.id,
        title: movie.title,
        count: 1,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      })
    }
  } catch (error) {
    console.error("Error updating search count:", error)
    throw error
  }
}

export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, METRICS_COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count"),
    ])

    return result.documents
  } catch (error) {
    console.error(error)
    return undefined
  }
}

// Saved movies functions
export const saveMovie = async (movie: MovieDetails) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    // Check if movie is already saved
    const existingMovie = await database.listDocuments(
      DATABASE_ID,
      SAVED_MOVIES_COLLECTION_ID,
      [
        Query.equal("userId", user.$id),
        Query.equal("movieId", movie.id.toString()),
      ]
    );

    if (existingMovie.documents.length > 0) {
      // Movie already saved
      return existingMovie.documents[0];
    }

    // Create the full poster URL
    const fullPosterUrl = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://placehold.co/600x400/1a1a1a/FFFFFF.png";

    // Save new movie
    return await database.createDocument(
      DATABASE_ID,
      SAVED_MOVIES_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        movieId: movie.id.toString(),
        title: movie.title,
        posterPath: fullPosterUrl,
        voteAverage: Math.round(movie.vote_average), // Convert to integer
        releaseDate: movie.release_date,
        savedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Error saving movie:", error);
    throw error;
  }
};

export const unsaveMovie = async (movieId: string) => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const savedMovie = await database.listDocuments(DATABASE_ID, SAVED_MOVIES_COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.equal("movieId", movieId),
    ])

    if (savedMovie.documents.length > 0) {
      return await database.deleteDocument(DATABASE_ID, SAVED_MOVIES_COLLECTION_ID, savedMovie.documents[0].$id)
    }

    return null
  } catch (error) {
    console.error("Error unsaving movie:", error)
    throw error
  }
}

export const getSavedMovies = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const savedMovies = await database.listDocuments(DATABASE_ID, SAVED_MOVIES_COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.orderDesc("savedAt"),
    ])

    return savedMovies.documents
  } catch (error) {
    console.error("Error getting saved movies:", error)
    return []
  }
}

export const isMovieSaved = async (movieId: string) => {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    const savedMovie = await database.listDocuments(DATABASE_ID, SAVED_MOVIES_COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.equal("movieId", movieId),
    ])

    return savedMovie.documents.length > 0
  } catch (error) {
    console.error("Error checking if movie is saved:", error)
    return false
  }
}
