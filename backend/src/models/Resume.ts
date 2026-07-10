import { Schema, model } from 'mongoose';

const ChecklistItemSchema = new Schema({
  action: { type: String, required: true },
  done: { type: Boolean, default: false },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
});

const ATSReportSchema = new Schema({
  score: { type: Number, default: 0 },
  keywordScore: { type: Number, default: 0 },
  formattingScore: { type: Number, default: 0 },
  grammarScore: { type: Number, default: 0 },
  experienceScore: { type: Number, default: 0 },
  projectsScore: { type: Number, default: 0 },
  skillsScore: { type: Number, default: 0 },
  educationScore: { type: Number, default: 0 },
  leadershipScore: { type: Number, default: 0 },
  impactScore: { type: Number, default: 0 },
  summary: { type: String, default: '' },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  recruiterPerspective: { type: String, default: '' },
  atsCompatibility: { type: String, default: '' },
  missingKeywords: [{ type: String }],
  improvements: [ChecklistItemSchema],
  redFlags: [{ type: String }]
});

const ResumeSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  version: { type: String, default: 'v1.0' },
  textContent: { type: String, default: '' },
  atsReport: ATSReportSchema,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Resume = model('Resume', ResumeSchema);
export default Resume;
