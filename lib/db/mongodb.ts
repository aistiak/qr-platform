import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Get MONGODB_URI from environment
 * This is called lazily when connectDB() is invoked, not at module load time
 * This allows the module to be imported during build without requiring env vars
 */
function getMongoUri(): string {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    throw new Error('Please define MONGODB_URI in .env.local');
  }
  
  return MONGODB_URI;
}

export async function connectDB(): Promise<typeof mongoose> {
  // Check for MONGODB_URI only when actually connecting, not at import time
  const MONGODB_URI = getMongoUri();
  
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
