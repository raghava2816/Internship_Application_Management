import { Schema, model, Types } from 'mongoose';

const StageHistorySchema = new Schema({
  stage: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
});

const ApplicationSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  jobLink: { type: String, default: '' },
  salary: { type: String, default: '' },
  location: { type: String, default: '' },
  employmentType: { 
    type: String, 
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Co-op'], 
    default: 'Internship' 
  },
  remoteType: { 
    type: String, 
    enum: ['Remote', 'Hybrid', 'Onsite'], 
    default: 'Onsite' 
  },
  appliedDate: { type: Date, default: Date.now },
  deadline: { type: Date },
  referral: { type: String, default: '' },
  recruiterName: { type: String, default: '' },
  recruiterEmail: { type: String, default: '' },
  recruiterLinkedIn: { type: String, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  notes: { type: String, default: '' },
  resumeUsed: { type: String, default: '' }, // Name or link of the resume version
  coverLetter: { type: String, default: '' },
  status: {
    type: String,
    enum: [
      'Wishlist', 'Applied', 'OA', 'Assessment', 'Technical Round', 
      'Machine Coding', 'System Design', 'Manager Round', 'HR Round', 
      'Offer', 'Accepted', 'Rejected', 'Withdrawn'
    ],
    default: 'Wishlist'
  },
  tags: [{ type: String }],
  stages: [StageHistorySchema],
  predictions: {
    interviewProbability: { type: Number, default: 50 },
    offerProbability: { type: Number, default: 20 },
    rejectionProbability: { type: Number, default: 30 },
    explanation: { type: String, default: 'Upload a resume and job details to compute a prediction.' }
  }
}, {
  timestamps: true
});

export const Application = model('Application', ApplicationSchema);
export default Application;
