// backend/utils/dbConnect.ts
import mongoose from "mongoose";

// Assert type for the global object to store the cached connection
declare global {
  var __mongo: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// 1. Get the MongoDB connection URI from environment variables
const MONGODB_URI: string = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  // Use console.error instead of warn to ensure visibility if deployment fails due to missing URI
  throw new Error("MONGODB_URI is not defined in environment variables. Connection failed.");
}

// 2. Initialize a global cache object for connection reuse
// This is critical for serverless environments (like Next.js API routes) to avoid
// creating a new connection on every function invocation.
let cached: typeof global.__mongo = global.__mongo || { conn: null, promise: null };

/**
 * Global function to connect to MongoDB using Mongoose.
 * It reuses the existing cached connection for performance in serverless functions.
 *
 * @returns {Promise<typeof mongoose>} The Mongoose connection instance.
 */
export default async function dbConnect(): Promise<typeof mongoose> {
  // A. If a connection is already established, return it immediately
  if (cached.conn) {
    // console.log("Using cached MongoDB connection.");
    return cached.conn;
  }

  // B. If a connection promise is not yet running, create a new one
  if (!cached.promise) {
    // console.log("Creating new MongoDB connection promise...");

    const opts = {
      // These options were common in older Mongoose versions and are now default/deprecated,
      // but keeping the `useUnifiedTopology` reference comments for context:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      bufferCommands: false, // Recommended for serverless: disable buffering
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      // console.log("MongoDB connection successful.");
      return m;
    });
  }

  // C. Await the connection promise (either existing or new)
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection fails, clear the promise so a new attempt can be made next time
    cached.promise = null;
    throw e;
  }

  // D. Store the connected instance globally and return it
  global.__mongo = cached;
  return cached.conn;
}