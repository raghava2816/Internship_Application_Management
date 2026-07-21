import { Schema, model } from 'mongoose';

const ChecklistItemSchema = new Schema({
  action: { type: String, required: true },
  done: { type: Boolean, default: false },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
});

const SectionDetailSchema = new Schema({
  score: { type: Number, default: 0 },
  status: { type: String, default: '' },
  explanation: { type: String, default: '' },
  example: { type: String, default: '' }
}, { _id: false });

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
  redFlags: [{ type: String }],
  
  // Detailed Section and Metrics
  keywordsMatchedCount: { type: Number, default: 0 },
  keywordsMissingCount: { type: Number, default: 0 },
  quantifiedBulletsCount: { type: Number, default: 0 },
  sectionsPresentCount: { type: Number, default: 0 },
  sectionsTotalCount: { type: Number, default: 9 },
  foundKeywords: [{ type: String }],
  sections: {
    contact: { type: SectionDetailSchema, default: () => ({}) },
    experience: { type: SectionDetailSchema, default: () => ({}) },
    quantification: { type: SectionDetailSchema, default: () => ({}) },
    skills: { type: SectionDetailSchema, default: () => ({}) },
    education: { type: SectionDetailSchema, default: () => ({}) },
    projects: { type: SectionDetailSchema, default: () => ({}) },
    certifications: { type: SectionDetailSchema, default: () => ({}) },
    formatting: { type: SectionDetailSchema, default: () => ({}) },
    summary: { type: SectionDetailSchema, default: () => ({}) }
  }
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
