import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from './seed';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/internship_tracker';

export const connectDB = async (): Promise<boolean> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully to:', MONGODB_URI);
    
    // Seed default users and documents
    await seedDatabase();
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    console.warn('⚠️ Server will operate in Mock DB Mode. CRUD actions will persist in-memory.');
    return false;
  }
};

