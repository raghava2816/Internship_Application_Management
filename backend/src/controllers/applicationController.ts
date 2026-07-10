import { Response } from 'express';
import Application from '../models/Application';
import Resume from '../models/Resume';
import Log from '../models/Log';
import { AuthRequest } from '../middleware/authMiddleware';
import { predictSuccess } from '../services/aiService';

// In-Memory Applications Fallback Store
export const mockApplications: any[] = [
  {
    _id: 'app_1',
    ownerId: '660f54b68449c25fbc7e63b1',
    company: 'Stripe',
    role: 'Frontend Engineering Intern',
    jobLink: 'https://stripe.com/jobs/123',
    salary: '$50/hr',
    location: 'San Francisco, CA',
    employmentType: 'Internship',
    remoteType: 'Hybrid',
    appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    referral: 'John Doe (Staff Engineer)',
    recruiterName: 'Sarah Jenkins',
    recruiterEmail: 'sarah@stripe.com',
    recruiterLinkedIn: 'https://linkedin.com/in/sarah-recruiter',
    priority: 'High',
    notes: 'Requires strong understanding of web vitals, React 19, and state management structures.',
    resumeUsed: 'resume_v1.0.pdf',
    coverLetter: 'Stripe Cover Letter Draft',
    status: 'OA',
    tags: ['React', 'Payments', 'Glassmorphism'],
    stages: [
      { stage: 'Wishlist', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), notes: 'Added to wishlist' },
      { stage: 'Applied', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), notes: 'Submitted resume' },
      { stage: 'OA', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), notes: 'Received Hackerrank link. 3 questions. Completed all.' }
    ],
    predictions: {
      interviewProbability: 75,
      offerProbability: 40,
      rejectionProbability: 25,
      explanation: 'ATS score matches well, and strong referral increases progression likelihood.'
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'app_2',
    ownerId: '660f54b68449c25fbc7e63b1',
    company: 'Google',
    role: 'Software Engineering Intern',
    jobLink: 'https://google.com/careers/456',
    salary: '$48/hr',
    location: 'Mountain View, CA',
    employmentType: 'Internship',
    remoteType: 'Onsite',
    appliedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    referral: '',
    recruiterName: 'David Miller',
    recruiterEmail: 'davidmiller@google.com',
    recruiterLinkedIn: 'https://linkedin.com/in/david-miller-google',
    priority: 'Medium',
    notes: 'Focus on graphs, dynamic programming, and systems design questions.',
    resumeUsed: 'resume_v1.0.pdf',
    coverLetter: '',
    status: 'Technical Round',
    tags: ['Algorithms', 'Python'],
    stages: [
      { stage: 'Applied', date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), notes: 'Applied via portal' },
      { stage: 'OA', date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), notes: 'Completed snapshot assessments' },
      { stage: 'Technical Round', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), notes: 'First video screen completed. Asked graph matching.' }
    ],
    predictions: {
      interviewProbability: 95,
      offerProbability: 35,
      rejectionProbability: 60,
      explanation: 'Interview completed. Awaiting feedback from engineering coordinator.'
    },
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    _id: 'app_3',
    ownerId: '660f54b68449c25fbc7e63b1',
    company: 'Linear',
    role: 'Full-Stack Developer Intern',
    jobLink: 'https://linear.app/careers',
    salary: '$60/hr',
    location: 'Remote',
    employmentType: 'Internship',
    remoteType: 'Remote',
    appliedDate: new Date(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    referral: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterLinkedIn: '',
    priority: 'High',
    notes: 'Speed is everything. Clean interface designs and rapid execution examples.',
    resumeUsed: 'resume_v2.0_ats.pdf',
    coverLetter: '',
    status: 'Wishlist',
    tags: ['Full Stack', 'Next.js', 'PostgreSQL'],
    stages: [
      { stage: 'Wishlist', date: new Date(), notes: 'Added to wishlist. Tailoring resume now.' }
    ],
    predictions: {
      interviewProbability: 45,
      offerProbability: 15,
      rejectionProbability: 40,
      explanation: 'Add detailed project logs about frontend layout optimization to boost chance.'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'app_4',
    ownerId: '660f54b68449c25fbc7e63b1',
    company: 'Meta',
    role: 'Production Engineer Intern',
    jobLink: 'https://meta.com/careers',
    salary: '$55/hr',
    location: 'Seattle, WA',
    employmentType: 'Internship',
    remoteType: 'Onsite',
    appliedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    referral: 'Jane Smith',
    recruiterName: 'Alice Wong',
    recruiterEmail: 'alicewong@meta.com',
    recruiterLinkedIn: '',
    priority: 'Medium',
    notes: 'Systems coding, linux commands, scripting languages.',
    resumeUsed: 'resume_v1.0.pdf',
    coverLetter: '',
    status: 'Rejected',
    tags: ['Systems', 'Linux'],
    stages: [
      { stage: 'Applied', date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
      { stage: 'OA', date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000) },
      { stage: 'Rejected', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), notes: 'Unable to pass OA constraints in time.' }
    ],
    predictions: {
      interviewProbability: 0,
      offerProbability: 0,
      rejectionProbability: 100,
      explanation: 'Application marked as inactive or rejected.'
    },
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  }
];

export const getApplications = async (req: AuthRequest, res: Response) => {
  try {
    const query: any = { ownerId: req.user?.id };
    
    // Simple filter conditions
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { company: searchRegex },
        { role: searchRegex },
        { tags: searchRegex }
      ];
    }

    const applications = await Application.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    console.warn('⚠️ Mongoose DB unavailable, returning mock applications.');
    let filtered = mockApplications.filter(app => app.ownerId === req.user?.id);
    
    if (req.query.status) {
      filtered = filtered.filter(app => app.status === req.query.status);
    }
    if (req.query.priority) {
      filtered = filtered.filter(app => app.priority === req.query.priority);
    }
    if (req.query.search) {
      const s = (req.query.search as string).toLowerCase();
      filtered = filtered.filter(app => 
        app.company.toLowerCase().includes(s) || 
        app.role.toLowerCase().includes(s) ||
        app.tags.some((t: string) => t.toLowerCase().includes(s))
      );
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  }
};

export const getApplicationById = async (req: AuthRequest, res: Response) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, ownerId: req.user?.id });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    const mock = mockApplications.find(app => app._id === req.params.id && app.ownerId === req.user?.id);
    if (!mock) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: mock });
  }
};

export const createApplication = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const body = { ...req.body, ownerId };

    // Fetch active resume to compute prediction
    const activeResume = await Resume.findOne({ ownerId, isActive: true });
    const atsScore = activeResume?.atsReport?.score || 72;
    body.predictions = predictSuccess(atsScore, body);

    // Initial stage history
    body.stages = [{ stage: body.status || 'Wishlist', date: new Date(), notes: 'Application initialized.' }];

    const app = await Application.create(body);
    await Log.create({ ownerId, action: `Created application: ${body.company} - ${body.role}`, category: 'application' });

    res.status(201).json({ success: true, data: app });
  } catch (error) {
    console.warn('⚠️ Mongoose DB unavailable, creating mock application.');
    const ownerId = req.user?.id || '660f54b68449c25fbc7e63b1';
    const newApp = {
      _id: 'app_' + Math.random().toString(36).substring(2, 9),
      ...req.body,
      ownerId,
      stages: [{ stage: req.body.status || 'Wishlist', date: new Date(), notes: 'Application initialized.' }],
      predictions: predictSuccess(75, req.body),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockApplications.push(newApp);
    res.status(201).json({ success: true, data: newApp });
  }
};

export const updateApplication = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const oldApp = await Application.findOne({ _id: req.params.id, ownerId });
    if (!oldApp) return res.status(404).json({ success: false, message: 'Application not found' });

    const updates = { ...req.body };
    
    // If status has changed, insert a new stage historical item
    if (updates.status && updates.status !== oldApp.status) {
      const newStage = { stage: updates.status, date: new Date(), notes: updates.statusNotes || 'Stage updated.' };
      updates.$push = { stages: newStage };
    }

    // Recompute predictions
    const activeResume = await Resume.findOne({ ownerId, isActive: true });
    const atsScore = activeResume?.atsReport?.score || 72;
    updates.predictions = predictSuccess(atsScore, { ...oldApp.toObject(), ...updates });

    const app = await Application.findOneAndUpdate({ _id: req.params.id, ownerId }, updates, { new: true });
    await Log.create({ ownerId, action: `Updated application: ${app?.company}`, category: 'application' });

    res.json({ success: true, data: app });
  } catch (error) {
    const index = mockApplications.findIndex(app => app._id === req.params.id && app.ownerId === req.user?.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Application not found' });

    const oldApp = mockApplications[index];
    const updates = { ...req.body };

    if (updates.status && updates.status !== oldApp.status) {
      oldApp.stages.push({ stage: updates.status, date: new Date(), notes: 'Stage updated.' });
    }

    const merged = { ...oldApp, ...updates, predictions: predictSuccess(75, { ...oldApp, ...updates }), updatedAt: new Date() };
    mockApplications[index] = merged;

    res.json({ success: true, data: merged });
  }
};

export const deleteApplication = async (req: AuthRequest, res: Response) => {
  try {
    const app = await Application.findOneAndDelete({ _id: req.params.id, ownerId: req.user?.id });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    await Log.create({ ownerId: req.user?.id, action: `Deleted application: ${app.company}`, category: 'application' });
    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    const index = mockApplications.findIndex(app => app._id === req.params.id && app.ownerId === req.user?.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Application not found' });

    mockApplications.splice(index, 1);
    res.json({ success: true, message: 'Application deleted successfully' });
  }
};

export const exportApplicationsCSV = async (req: AuthRequest, res: Response) => {
  try {
    let list = [];
    try {
      list = await Application.find({ ownerId: req.user?.id }).sort({ updatedAt: -1 });
    } catch {
      list = mockApplications.filter(app => app.ownerId === req.user?.id);
    }

    let csv = 'Company,Role,Location,Employment Type,Remote Type,Applied Date,Status,Salary,Priority,Referral\n';
    list.forEach(app => {
      const appDate = app.appliedDate ? new Date(app.appliedDate).toISOString().split('T')[0] : '';
      csv += `"${app.company}","${app.role}","${app.location}","${app.employmentType}","${app.remoteType}","${appDate}","${app.status}","${app.salary}","${app.priority}","${app.referral || ''}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('internship_applications.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'CSV Export failed' });
  }
};
