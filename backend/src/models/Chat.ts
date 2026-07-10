import { Schema, model } from 'mongoose';

const MessageSchema = new Schema({
  sender: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Conversation' },
  messages: [MessageSchema],
  category: { type: String, enum: ['coach', 'resume_review', 'interview_prep'], default: 'coach' }
}, {
  timestamps: true
});

export const Chat = model('Chat', ChatSchema);
export default Chat;
