import { Schema, model } from 'mongoose';

const QuestionAnswerSchema = new Schema({
  question: { type: String, required: true },
  category: { type: String, enum: ['Technical', 'Behavioral', 'HR', 'Coding', 'System Design'], required: true },
  userAnswer: { type: String, default: '' },
  score: { type: Number, default: 0 }, // 0 to 100
  feedback: { type: String, default: '' }
});

const InterviewSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  company: { type: String, required: true },
  role: { type: String, required: true },
  round: { type: String, required: true },
  date: { type: Date, required: true },
  meetingLink: { type: String, default: '' },
  notes: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  questions: [QuestionAnswerSchema],
  overallFeedback: { type: String, default: '' },
  performanceScore: { type: Number, default: 0 } // Computed average
}, {
  timestamps: true
});

export const Interview = model('Interview', InterviewSchema);
export default Interview;
