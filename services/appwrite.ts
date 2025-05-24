import { Client, Databases, ID, Query, Account } from "react-native-appwrite";

// Get database and collection IDs from environment variables
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const METRICS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;
const SAVED_MOVIES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SAVED_MOVIES_COLLECTION_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

// Initialize Appwrite client
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const database = new Databases(client);
const account = new Account(client);

// Existing functions
export const updateSearchCount = async (query: string, movie: Movie) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, METRICS_COLLECTION_ID, [
      Query.equal("searchTerm", query),
    ]);

    if (result.documents.length > 0) {
      const existingMovie = result.documents[0];
      await database.updateDocument(
        DATABASE_ID,
        METRICS_COLLECTION_ID,
        existingMovie.$id,
        {
          count: existingMovie.count + 1,
        }
      );
    } else {
      await database.createDocument(DATABASE_ID, METRICS_COLLECTION_ID, ID.unique(), {
        searchTerm: query,
        movie_id: movie.id,
        title: movie.title,
        count: 1,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

export const getTrendingMovies = async (): Promise<
  TrendingMovie[] | undefined
> => {
  try {
    const result = await database.listDocuments(DATABASE_ID, METRICS_COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count"),
    ]);

    return result.documents as unknown as TrendingMovie[];
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const createAccount = async (email: string, password: string, name: string) => {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);

    const session = await login(email, password);

    try {
      await database.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        newAccount.$id,
        {
          email,
          name,
          createdAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error creating user profile:", error);
    }

    return session;
  } catch (error) {
    // existing error handling...
  }
};


export const login = async (email: string, password: string) => {
  try {
    // Use createSession instead of createEmailSession
    return await account.createSession(email, password);
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    return await account.deleteSession('current');
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

// Modified to handle the missing scope error
export const getCurrentUser = async () => {
  try {
    // Check if we have an active session first
    try {
      const session = await account.getSession('current');
      if (!session) return null;
    } catch (sessionError) {
      console.log("No active session:", sessionError);
      return null;
    }
    
    // If we have a session, try to get the user
    return await account.get();
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};



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
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const savedMovie = await database.listDocuments(
      DATABASE_ID,
      SAVED_MOVIES_COLLECTION_ID,
      [
        Query.equal("userId", user.$id),
        Query.equal("movieId", movieId),
      ]
    );

    if (savedMovie.documents.length > 0) {
      return await database.deleteDocument(
        DATABASE_ID,
        SAVED_MOVIES_COLLECTION_ID,
        savedMovie.documents[0].$id
      );
    }
    
    return null;
  } catch (error) {
    console.error("Error unsaving movie:", error);
    throw error;
  }
};

export const getSavedMovies = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const savedMovies = await database.listDocuments(
      DATABASE_ID,
      SAVED_MOVIES_COLLECTION_ID,
      [
        Query.equal("userId", user.$id),
        Query.orderDesc("savedAt"),
      ]
    );

    return savedMovies.documents;
  } catch (error) {
    console.error("Error getting saved movies:", error);
    return [];
  }
};

export const isMovieSaved = async (movieId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const savedMovie = await database.listDocuments(
      DATABASE_ID,
      SAVED_MOVIES_COLLECTION_ID,
      [
        Query.equal("userId", user.$id),
        Query.equal("movieId", movieId),
      ]
    );

    return savedMovie.documents.length > 0;
  } catch (error) {
    console.error("Error checking if movie is saved:", error);
    return false;
  }
};