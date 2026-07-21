import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  googleId: string;
  githubId: string;
  avatarUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  bio: string;
  skills: string[];
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      deadlineReminderDays: number;
    }
  };
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth users
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  googleId: { type: String, default: '' },
  githubId: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      deadlineReminderDays: { type: Number, default: 3 }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (this: IUser, password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser>('User', UserSchema);
export default User;
