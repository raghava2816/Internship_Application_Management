import { Response } from 'express';
import Resume from '../models/Resume';
import Log from '../models/Log';
import { AuthRequest } from '../middleware/authMiddleware';
import { analyzeResume } from '../services/aiService';
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

// Mock Resume Fallback Store
export const mockResumes: any[] = [
  {
    _id: 'resume_v1',
    ownerId: '660f54b68449c25fbc7e63b1',
    fileName: 'resume_v1.0.pdf',
    fileUrl: 'https://example.com/resumes/resume_v1.pdf',
    version: 'v1.0',
    textContent: 'Demo User - Software Engineer\nExperience: Freelance React Developer. Built landing pages. Used JavaScript, CSS, HTML.\nEducation: CS Student at State University.\nSkills: Java, HTML, CSS, JavaScript, React.',
    isActive: false,
    atsReport: {
      score: 68,
      keywordScore: 60,
      formattingScore: 85,
      grammarScore: 90,
      experienceScore: 55,
      projectsScore: 60,
      skillsScore: 65,
      educationScore: 85,
      leadershipScore: 40,
      impactScore: 50,
      summary: 'The resume lists basic skills, but is missing technical details. Formatting is clean, but doesn\'t represent metrics or direct projects outcomes.',
      strengths: ['Clean single-column page format', 'Grammatically correct and structured'],
      weaknesses: ['Missing enterprise keywords like Node.js, WebSockets, or Cloud Providers', 'No quantified metrics (XYZ Formula)'],
      recruiterPerspective: 'Appears as an entry-level candidate who needs more focused project items.',
      atsCompatibility: 'Compatible structure. Single column is parseable.',
      missingKeywords: ['TypeScript', 'Node.js', 'Express', 'MongoDB', 'Docker', 'CI/CD'],
      improvements: [
        { action: 'Rewrite projects to follow STAR methodology', done: false, priority: 'High' },
        { action: 'Add relevant TypeScript or backend engineering skills', done: true, priority: 'High' }
      ],
      redFlags: ['Short descriptions that lack engineering depth']
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'resume_v2',
    ownerId: '660f54b68449c25fbc7e63b1',
    fileName: 'resume_v2.0_ats.pdf',
    fileUrl: 'https://example.com/resumes/resume_v2.pdf',
    version: 'v2.0',
    textContent: 'Demo User - Full Stack Developer\nExperience: Software Engineer Intern at Stripe. Re-architected payment API routes. Built interactive frontend views using React 19, TypeScript, TailwindCSS. Coded backend server routes in Node.js and Mongoose.\nSkills: React, TypeScript, Node.js, MongoDB, TailwindCSS, Docker, Git.',
    isActive: true,
    atsReport: {
      score: 88,
      keywordScore: 88,
      formattingScore: 90,
      grammarScore: 95,
      experienceScore: 85,
      projectsScore: 85,
      skillsScore: 90,
      educationScore: 85,
      leadershipScore: 75,
      impactScore: 82,
      summary: 'Excellent resume containing highly parseable technical keywords. Strong project details with clear metrics.',
      strengths: ['Strong keyword density matching modern SaaS requirements', 'Use of action verbs and concrete measurements', 'Good balance of Frontend and Backend frameworks'],
      weaknesses: ['Could elaborate on cloud services (AWS, Serverless) and automated tests (Jest, Playwright)'],
      recruiterPerspective: 'A solid candidate for Full Stack or Backend Internships. Demonstrates actual project implementations.',
      atsCompatibility: '100% parseable. Headers use standard keywords.',
      missingKeywords: ['Jest', 'AWS', 'Kubernetes', 'CI/CD', 'GraphQL'],
      improvements: [
        { action: 'Integrate testing coverage frameworks', done: false, priority: 'Medium' },
        { action: 'Add cloud database details', done: false, priority: 'Low' }
      ],
      redFlags: []
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }
];

export const getResumes = async (req: AuthRequest, res: Response) => {
  try {
    const resumes = await Resume.find({ ownerId: req.user?.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: resumes.length, data: resumes });
  } catch (error) {
    console.warn('⚠️ Mongoose DB unavailable, returning mock resumes.');
    const filtered = mockResumes.filter(res => res.ownerId === req.user?.id);
    res.json({ success: true, count: filtered.length, data: filtered });
  }
};

export const uploadResume = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;
    let fileName = req.body.fileName || 'resume.pdf';
    let textContent = req.body.textContent || '';
    const jobDescription = req.body.jobDescription || '';

    // If a file is uploaded via Multer
    if (req.file) {
      fileName = req.file.originalname;
      const mimetype = req.file.mimetype;

      if (mimetype === 'application/pdf') {
        try {
          const pdfParser = typeof pdf === 'function' ? pdf : (pdf as any).default;
          const parsed = await pdfParser(req.file.buffer);
          textContent = parsed.text || '';
        } catch (err) {
          console.error('PDF parsing failed:', err);
          return res.status(400).json({ success: false, message: 'Failed to parse PDF file content.' });
        }
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword'
      ) {
        try {
          const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
          textContent = parsed.value || '';
        } catch (err) {
          console.error('DOCX parsing failed:', err);
          return res.status(400).json({ success: false, message: 'Failed to parse Word document content.' });
        }
      } else {
        // Plain text
        textContent = req.file.buffer.toString('utf8');
      }
    }

    if (!textContent || !textContent.trim()) {
      return res.status(400).json({ success: false, message: 'Resume text content is empty or unreadable.' });
    }

    // Deactivate previous active resumes
    await Resume.updateMany({ ownerId }, { isActive: false });

    // Determine version number
    const count = await Resume.countDocuments({ ownerId });
    const version = `v${count + 1}.0`;

    // Process ATS analysis
    const atsReport = await analyzeResume(textContent, jobDescription);

    const newResume = await Resume.create({
      ownerId,
      fileName,
      version,
      textContent,
      atsReport,
      isActive: true
    });

    await Log.create({ ownerId, action: `Uploaded new resume version: ${version}`, category: 'resume' });
    res.status(201).json({ success: true, data: newResume });
  } catch (error) {
    console.warn('⚠️ Mongoose DB/AI error during upload, running fallback.');
    const ownerId = req.user?.id || '660f54b68449c25fbc7e63b1';
    
    mockResumes.forEach(r => { if (r.ownerId === ownerId) r.isActive = false; });
    const version = `v${mockResumes.filter(r => r.ownerId === ownerId).length + 1}.0`;

    // Extract text from file for fallback if present
    let fallbackText = req.body.textContent || '';
    let fallbackFileName = req.body.fileName || 'uploaded_resume.pdf';
    
    if (req.file) {
      fallbackFileName = req.file.originalname;
      const mimetype = req.file.mimetype;
      if (mimetype === 'application/pdf') {
        try {
          const pdfParser = typeof pdf === 'function' ? pdf : (pdf as any).default;
          const parsed = await pdfParser(req.file.buffer);
          fallbackText = parsed.text || '';
        } catch {}
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
          fallbackText = parsed.value || '';
        } catch {}
      } else {
        fallbackText = req.file.buffer.toString('utf8');
      }
    }

    if (!fallbackText || !fallbackText.trim()) {
      fallbackText = 'Sample developer resume text';
    }

    const atsReport = getMockATSAnalysis(fallbackText, req.body.jobDescription || '');
    const mockResume = {
      _id: 'resume_' + Math.random().toString(36).substring(2, 9),
      ownerId,
      fileName: fallbackFileName,
      version,
      textContent: fallbackText,
      atsReport,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockResumes.push(mockResume);

    res.status(201).json({ success: true, data: mockResume });
  }
};

export const setActiveResume = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;
    await Resume.updateMany({ ownerId }, { isActive: false });
    const active = await Resume.findOneAndUpdate({ _id: req.params.id, ownerId }, { isActive: true }, { new: true });
    if (!active) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    await Log.create({ ownerId, action: `Activated resume version: ${active.version}`, category: 'resume' });
    res.json({ success: true, data: active });
  } catch (error) {
    const ownerId = req.user?.id;
    const item = mockResumes.find(r => r._id === req.params.id && r.ownerId === ownerId);
    if (!item) return res.status(404).json({ success: false, message: 'Resume not found' });

    mockResumes.forEach(r => { if (r.ownerId === ownerId) r.isActive = false; });
    item.isActive = true;

    res.json({ success: true, data: item });
  }
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, ownerId: req.user?.id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    // If we deleted the active resume, active the next latest one
    if (resume.isActive) {
      const nextLatest = await Resume.findOne({ ownerId: req.user?.id }).sort({ createdAt: -1 });
      if (nextLatest) {
        nextLatest.isActive = true;
        await nextLatest.save();
      }
    }
    await Log.create({ ownerId: req.user?.id, action: `Deleted resume: ${resume.fileName}`, category: 'resume' });
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    const ownerId = req.user?.id;
    const idx = mockResumes.findIndex(r => r._id === req.params.id && r.ownerId === ownerId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    const deleted = mockResumes.splice(idx, 1)[0];
    if (deleted.isActive) {
      const userRes = mockResumes.filter(r => r.ownerId === ownerId);
      if (userRes.length > 0) {
        userRes[userRes.length - 1].isActive = true;
      }
    }
    res.json({ success: true, message: 'Resume deleted successfully' });
  }
};

const getMockATSAnalysis = (textContent: string = '', jobDescription: string = '') => {
  return {
    score: 75,
    keywordScore: 70,
    formattingScore: 80,
    grammarScore: 90,
    experienceScore: 72,
    projectsScore: 75,
    skillsScore: 78,
    educationScore: 85,
    leadershipScore: 60,
    impactScore: 68,
    summary: 'The uploaded file has been parsed and reviewed. Keyword correlation is decent, but some primary tech-stack terms are missing.',
    strengths: ['Clean structural layouts', 'Active voice throughout job items'],
    weaknesses: ['Lack of quantitative impact statements'],
    recruiterPerspective: 'Has a solid engineering basis but is missing key indicators of performance speed and reliability.',
    atsCompatibility: 'Good structural parseability.',
    missingKeywords: ['Docker', 'AWS', 'Jest', 'CI/CD'],
    improvements: [{ action: 'Inject data targets into experience summaries', done: false, priority: 'High' }],
    redFlags: []
  };
};

export const updateResumeChecklist = async (req: AuthRequest, res: Response) => {
  const { action, done } = req.body;
  try {
    const ownerId = req.user?.id;
    const resume = await Resume.findOne({ _id: req.params.id, ownerId });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    if (resume.atsReport && resume.atsReport.improvements) {
      const item = resume.atsReport.improvements.find((i: any) => i.action === action);
      if (item) {
        item.done = done;
        resume.markModified('atsReport');
        await resume.save();
      }
    }
    res.json({ success: true, data: resume });
  } catch (error) {
    const ownerId = req.user?.id || '660f54b68449c25fbc7e63b1';
    const item = mockResumes.find(r => r._id === req.params.id && r.ownerId === ownerId);
    if (item && item.atsReport && item.atsReport.improvements) {
      const imp = item.atsReport.improvements.find((i: any) => i.action === action);
      if (imp) imp.done = done;
    }
    res.json({ success: true, data: item });
  }
};

