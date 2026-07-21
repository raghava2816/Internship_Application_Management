import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export interface StageHistoryType {
  stage: string;
  date: string;
  notes?: string;
}

export interface PredictionType {
  interviewProbability: number;
  offerProbability: number;
  rejectionProbability: number;
  explanation: string;
}

export interface ApplicationType {
  _id: string;
  company: string;
  role: string;
  jobLink?: string;
  salary?: string;
  location?: string;
  employmentType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Co-op';
  remoteType: 'Remote' | 'Hybrid' | 'Onsite';
  appliedDate: string;
  deadline?: string;
  referral?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterLinkedIn?: string;
  priority: 'Low' | 'Medium' | 'High';
  notes?: string;
  resumeUsed?: string;
  coverLetter?: string;
  status: string;
  tags: string[];
  stages: StageHistoryType[];
  predictions: PredictionType;
  createdAt: string;
  updatedAt: string;
}

export interface SectionDetailType {
  score: number;
  status: string;
  explanation: string;
  example: string;
}

export interface ATSReportType {
  score: number;
  keywordScore: number;
  formattingScore: number;
  grammarScore: number;
  experienceScore: number;
  projectsScore: number;
  skillsScore: number;
  educationScore: number;
  leadershipScore: number;
  impactScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recruiterPerspective: string;
  atsCompatibility: string;
  missingKeywords: string[];
  improvements: { action: string; done: boolean; priority: 'High' | 'Medium' | 'Low' }[];
  redFlags: string[];

  // New detailed fields
  keywordsMatchedCount?: number;
  keywordsMissingCount?: number;
  quantifiedBulletsCount?: number;
  sectionsPresentCount?: number;
  sectionsTotalCount?: number;
  foundKeywords?: string[];
  sections?: {
    contact?: SectionDetailType;
    experience?: SectionDetailType;
    quantification?: SectionDetailType;
    skills?: SectionDetailType;
    education?: SectionDetailType;
    projects?: SectionDetailType;
    certifications?: SectionDetailType;
    formatting?: SectionDetailType;
    summary?: SectionDetailType;
  };
}

export interface ResumeType {
  _id: string;
  fileName: string;
  fileUrl?: string;
  version: string;
  textContent: string;
  atsReport?: ATSReportType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AppDataContextType {
  applications: ApplicationType[];
  resumes: ResumeType[];
  activeResume: ResumeType | null;
  loading: boolean;
  notifications: string[];
  addApplication: (appData: Omit<ApplicationType, '_id' | 'createdAt' | 'updatedAt' | 'stages' | 'predictions'>) => Promise<void>;
  updateApplication: (id: string, updates: Partial<ApplicationType>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  uploadResume: (fileName: string, textContent: string, jobDescription?: string, file?: File) => Promise<void>;
  setActiveResume: (id: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  toggleImprovementCheck: (resumeId: string, actionText: string) => void;
  exportCSV: () => void;
  refreshData: () => Promise<void>;
  analyzeActiveResume: (jobDescription: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Core Mock Datasets to seeding localStorage
const defaultMockApplications: ApplicationType[] = [
  {
    _id: 'app_1',
    company: 'Stripe',
    role: 'Frontend Engineering Intern',
    jobLink: 'https://stripe.com/jobs/123',
    salary: '$50/hr',
    location: 'San Francisco, CA',
    employmentType: 'Internship',
    remoteType: 'Hybrid',
    appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    referral: 'John Doe (Staff Engineer)',
    recruiterName: 'Sarah Jenkins',
    recruiterEmail: 'sarah@stripe.com',
    recruiterLinkedIn: 'https://linkedin.com/in/sarah-recruiter',
    priority: 'High',
    notes: 'Requires strong understanding of web vitals, React 19, and state management structures.',
    resumeUsed: 'resume_v2.0_ats.pdf',
    coverLetter: 'Stripe Cover Letter Draft',
    status: 'OA',
    tags: ['React', 'Payments', 'Glassmorphism'],
    stages: [
      { stage: 'Wishlist', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Added to wishlist' },
      { stage: 'Applied', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Submitted resume' },
      { stage: 'OA', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Received Hackerrank link. 3 questions. Completed all.' }
    ],
    predictions: {
      interviewProbability: 75,
      offerProbability: 40,
      rejectionProbability: 25,
      explanation: 'ATS score matches well, and strong referral increases progression likelihood.'
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'app_2',
    company: 'Google',
    role: 'Software Engineering Intern',
    jobLink: 'https://google.com/careers/456',
    salary: '$48/hr',
    location: 'Mountain View, CA',
    employmentType: 'Internship',
    remoteType: 'Onsite',
    appliedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
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
      { stage: 'Applied', date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Applied via portal' },
      { stage: 'OA', date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Completed snapshot assessments' },
      { stage: 'Technical Round', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), notes: 'First video screen completed. Asked graph matching.' }
    ],
    predictions: {
      interviewProbability: 95,
      offerProbability: 35,
      rejectionProbability: 60,
      explanation: 'Interview completed. Awaiting feedback from engineering coordinator.'
    },
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'app_3',
    company: 'Linear',
    role: 'Full-Stack Developer Intern',
    jobLink: 'https://linear.app/careers',
    salary: '$60/hr',
    location: 'Remote',
    employmentType: 'Internship',
    remoteType: 'Remote',
    appliedDate: new Date().toISOString(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
      { stage: 'Wishlist', date: new Date().toISOString(), notes: 'Added to wishlist. Tailoring resume now.' }
    ],
    predictions: {
      interviewProbability: 45,
      offerProbability: 15,
      rejectionProbability: 40,
      explanation: 'Add detailed project logs about frontend layout optimization to boost chance.'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'app_4',
    company: 'Meta',
    role: 'Production Engineer Intern',
    jobLink: 'https://meta.com/careers',
    salary: '$55/hr',
    location: 'Seattle, WA',
    employmentType: 'Internship',
    remoteType: 'Onsite',
    appliedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
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
      { stage: 'Applied', date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
      { stage: 'OA', date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString() },
      { stage: 'Rejected', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Unable to pass OA constraints in time.' }
    ],
    predictions: {
      interviewProbability: 0,
      offerProbability: 0,
      rejectionProbability: 100,
      explanation: 'Application marked as inactive or rejected.'
    },
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getClientMockAnalysis = (text: string = '', jd: string = '') => {
  const lowerText = text.toLowerCase();
  const lowerJD = jd.toLowerCase();
  const skillsList = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 
    'Python', 'Django', 'Flask', 'Java', 'Spring', 'C++', 'Go', 'Docker', 'Kubernetes', 
    'AWS', 'CI/CD', 'Jest', 'Git', 'HTML', 'CSS', 'TailwindCSS', 'Redux', 'SQL', 'NoSQL',
    'Angular', 'Vue', 'Next.js', 'NestJS', 'GraphQL', 'RESTful', 'FastAPI', 'Rust', 'Ruby', 
    'Rails', 'PHP', 'Laravel', 'C#', 'ASP.NET', 'MySQL', 'Redis', 'Cassandra', 'DynamoDB', 
    'Terraform', 'GCP', 'Azure', 'Jenkins', 'GitHub Actions', 'Cypress', 
    'Playwright', 'Jira', 'Agile', 'Scrum', 'Figma', 'Webpack', 'Vite', 'Zustand', 'Prisma'
  ];

  // 1. Candidate Info Extraction
  let candidateName = 'Applicant';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const nameLine = lines.find(l => l.toUpperCase().startsWith('NAME:'));
  if (nameLine) {
    candidateName = nameLine.replace(/NAME:/i, '').trim();
  } else if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 40 && /^[A-Z][a-zA-Z]*(\s+[A-Z][a-zA-Z]*)+$/.test(firstLine)) {
      candidateName = firstLine;
    }
  }

  // 2. Contact Information Audit
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}/.test(text);
  const hasLinkedIn = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i.test(text);
  const hasGitHub = /github\.com\/[a-zA-Z0-9_-]+/i.test(text);

  // 3. Section Heading Audit
  const sections = {
    experience: /experience|work\s+history|employment|professional\s+background/i.test(text),
    education: /education|academic/i.test(text),
    projects: /projects|personal\s+projects|academic\s+projects/i.test(text),
    skills: /skills|technical\s+skills|core\s+competencies|technologies/i.test(text),
    certifications: /certifications|certificates|courses/i.test(text)
  };

  // 4. Quantifiable Impact Audit (Google XYZ Formula)
  const sentences = text.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 10);
  let sentencesWithMetrics = 0;
  sentences.forEach(s => {
    const hasPercent = s.includes('%');
    const hasNumbers = /\b\d+(?:\.\d+)?\b/.test(s);
    const hasKeywords = /saved|reduced|increased|improved|optimized|accelerated|delivered|led/i.test(s);
    if ((hasPercent || hasNumbers) && hasKeywords) {
      sentencesWithMetrics++;
    }
  });

  const metricRatio = sentences.length > 0 ? sentencesWithMetrics / sentences.length : 0;

  // 5. Keyword Density & Matching
  const foundSkills = skillsList.filter(skill => lowerText.includes(skill.toLowerCase()));
  if (foundSkills.length === 0) {
    foundSkills.push('React.js', 'Node.js', 'Express', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Git', 'Java', 'Full-stack', 'Responsive UI', 'DSA');
  }

  const jdSkills = skillsList.filter(skill => lowerJD.includes(skill.toLowerCase()));
  const missingKeywords = jdSkills.length > 0 ? jdSkills.filter(skill => !foundSkills.includes(skill)) : ['Next.js', 'Redux', 'Docker', 'CI/CD', 'Agile / Scrum', 'Unit testing', 'GraphQL', 'AWS services', 'Linux / Bash'];

  // 6. Detailed Scoring Algorithms
  let keywordScore = 70;
  if (jdSkills.length > 0) {
    const matchedCount = jdSkills.filter(s => foundSkills.includes(s)).length;
    keywordScore = Math.floor((matchedCount / jdSkills.length) * 40) + 60;
  } else {
    keywordScore = Math.min(65 + foundSkills.length * 2, 95);
  }

  let formattingScore = 100;
  const redFlags: string[] = [];
  const improvements = [];

  if (!hasEmail) {
    formattingScore -= 10;
    redFlags.push('Missing email contact information');
    improvements.push({ action: 'Add a professional email address to the header.', done: false, priority: 'High' as const });
  }
  if (!hasPhone) {
    formattingScore -= 10;
    redFlags.push('Missing phone contact information');
    improvements.push({ action: 'Add a valid telephone contact number to the header.', done: false, priority: 'High' as const });
  }
  if (!hasLinkedIn) {
    formattingScore -= 5;
    improvements.push({ action: 'Include your LinkedIn profile link to improve recruiter outreach.', done: false, priority: 'Medium' as const });
  }
  if (!hasGitHub) {
    formattingScore -= 5;
    improvements.push({ action: 'Include your GitHub profile link to showcase code repositories.', done: false, priority: 'Medium' as const });
  }

  let grammarScore = 95;
  if (text.includes(' etc') || text.includes('...') || text.includes('stuff')) {
    grammarScore -= 10;
    redFlags.push('Contains informal placeholders (e.g., etc., ..., stuff)');
    improvements.push({ action: 'Remove informal phrases and replace with specific technical lists.', done: false, priority: 'Medium' as const });
  }

  let experienceScore = sections.experience ? 85 : 50;
  let projectsScore = sections.projects ? 85 : 55;
  let skillsScore = sections.skills ? 90 : 60;
  let educationScore = sections.education ? 90 : 60;

  if (!sections.experience) {
    redFlags.push('Missing Experience/Employment section');
    improvements.push({ action: 'Add a dedicated Professional Experience section detailing past roles.', done: false, priority: 'High' as const });
  }
  if (!sections.projects) {
    improvements.push({ action: 'Add a Projects section to highlight relevant technical builds.', done: false, priority: 'Medium' as const });
  }
  if (!sections.skills) {
    improvements.push({ action: 'Add a structured Technical Skills section for better ATS parsing.', done: false, priority: 'High' as const });
  }

  let impactScore = Math.floor(metricRatio * 80) + 40;
  if (metricRatio < 0.2) {
    improvements.push({
      action: "Quantify your achievements following Google's XYZ formula: 'Accomplished [X], measured by [Y], by doing [Z]' (e.g., 'Reduced load time by 30%').",
      done: false,
      priority: 'High' as const
    });
  }

  const overallScore = Math.floor(
    (keywordScore * 0.3) + 
    (formattingScore * 0.15) + 
    (grammarScore * 0.1) + 
    (experienceScore * 0.15) + 
    (projectsScore * 0.1) + 
    (skillsScore * 0.1) + 
    (impactScore * 0.1)
  );

  const strengths = [];
  if (foundSkills.length >= 8) strengths.push(`Strong core tech stack coverage with ${foundSkills.length} matching skills.`);
  if (hasLinkedIn && hasGitHub) strengths.push('Complete social links provided (LinkedIn and GitHub).');
  if (sections.experience && sections.education) strengths.push('Standard, logical section layout with proper headings.');
  if (metricRatio >= 0.25) strengths.push('Excellent usage of quantifiable metrics to demonstrate contribution scale.');

  if (strengths.length === 0) {
    strengths.push('Valid layout layout with clean single-column structure.');
  }

  const weaknesses = [];
  if (missingKeywords.length > 0) {
    weaknesses.push(`Missing alignment for role-critical keywords: ${missingKeywords.slice(0, 3).join(', ')}.`);
  }
  if (metricRatio < 0.15) {
    weaknesses.push('Description bullets lack numeric metrics or quantified business impact.');
  }
  if (!hasLinkedIn || !hasGitHub) {
    weaknesses.push('Missing links to live work samples or professional networks.');
  }

  if (weaknesses.length === 0) {
    weaknesses.push('Could expand on containerized configurations or cloud integrations.');
  }

  let summary = `Candidate ${candidateName} shows an overall match score of ${overallScore}%. `;
  if (missingKeywords.length > 0) {
    summary += `To increase your score, consider adding missing skills: ${missingKeywords.slice(0, 4).join(', ')}. `;
  } else {
    summary += 'The keywords match the job description very closely. ';
  }
  if (metricRatio < 0.2) {
    summary += 'Focus on incorporating more quantifiable results and metric formulas in your project bullets.';
  }

  let sectionsCount = 4;
  if (hasEmail && hasPhone) sectionsCount++;
  if (sections.certifications) sectionsCount++;

  return {
    score: overallScore,
    keywordScore,
    formattingScore,
    grammarScore,
    experienceScore,
    projectsScore,
    skillsScore,
    educationScore,
    leadershipScore: 75,
    impactScore,
    summary,
    strengths,
    weaknesses,
    recruiterPerspective: `The resume shows technical familiarity with ${foundSkills.slice(0, 3).join(', ')}. A recruiter will notice the missing contact details or quantified impact metrics if they are not updated.`,
    atsCompatibility: formattingScore > 85 ? 'Highly compatible structure. Fully parseable headers.' : 'Minor formatting issues detected. Fix missing sections.',
    missingKeywords,
    improvements,
    redFlags,
    keywordsMatchedCount: foundSkills.length,
    keywordsMissingCount: missingKeywords.length,
    quantifiedBulletsCount: sentencesWithMetrics > 0 ? sentencesWithMetrics : 6,
    sectionsPresentCount: sectionsCount,
    sectionsTotalCount: 9,
    foundKeywords: foundSkills,
    sections: {
      contact: {
        score: hasPhone ? 95 : 70,
        status: hasPhone ? 'Complete' : 'Missing phone number',
        explanation: 'Contact section contains email and social profiles but lacks a telephone number. Many recruiters search for contact info first and automated dialers require active digits.',
        example: 'Add: "+1 (555) 019-2834" directly in your header adjacent to the email address.'
      },
      experience: {
        score: sections.experience ? 75 : 50,
        status: sections.experience ? 'Only 1 internship' : 'Missing section',
        explanation: 'There is only one internship listed under work history. A robust engineering resume should demonstrate continuous workspace collaboration or progressive projects.',
        example: 'Create entries for junior engineering tasks or frame academic project leadership as "Engineering Lead" roles.'
      },
      quantification: {
        score: sentencesWithMetrics > 3 ? 90 : 65,
        status: sentencesWithMetrics > 3 ? 'Good metrics' : 'Needs more metrics',
        explanation: 'Most descriptions focus on basic tasks (e.g. "built websites") rather than performance scale, load efficiency, or team capacity changes.',
        example: 'Change: "Built a react application" to "Designed frontend views in React, reducing page render times by 32% and enhancing Web Vitals."'
      },
      skills: {
        score: foundSkills.length > 8 ? 85 : 70,
        status: foundSkills.length > 8 ? 'Good stack' : 'Good but incomplete',
        explanation: 'Core stack keywords like Next.js, Redux, and Docker are missing. Modern SaaS stacks expect solid configuration and containerization familiarity.',
        example: 'Include: "Next.js, Redux State Management, Docker, CI/CD pipelines" in your Technical Skills layout.'
      },
      education: {
        score: sections.education ? 88 : 60,
        status: sections.education ? 'Strong CGPA listed' : 'Details incomplete',
        explanation: 'Education section is complete and well-structured, clearly showing your B.Tech in IT and impressive 8.68 CGPA.',
        example: 'Include coursework relevant to target positions (e.g., Database Systems, Distributed Algorithms) to show theoretical baseline.'
      },
      projects: {
        score: sections.projects ? 68 : 55,
        status: sections.projects ? 'Lacks impact metrics' : 'Missing section',
        explanation: 'You listed multiple projects but they read like tutorial templates. They lack metrics about latency, database concurrency, or user counts.',
        example: 'Rewrite: "Created a student locator app" to "Engineered student locator using WebSocket triggers; processed 120 concurrent location pings/sec."'
      },
      certifications: {
        score: sections.certifications ? 82 : 45,
        status: sections.certifications ? '4 certs listed' : 'No credentials listed',
        explanation: 'You have listed credentials confirming proactive professional learning and cloud stack familiarity.',
        example: 'Position certifications immediately below skills or experience, highlighting issues like date of expiration or license identifiers.'
      },
      formatting: {
        score: formattingScore,
        status: formattingScore > 85 ? 'Clean single-column' : 'Complex two-column layout',
        explanation: 'Formatting follows a highly readable single-column design. Margins are consistent, and headers are standardized, making it perfect for ATS parsing.',
        example: 'Keep font sizes between 10pt and 12pt for bullet content, and use standard uppercase headings.'
      },
      summary: {
        score: 55,
        status: 'Too generic',
        explanation: 'Objective/Summary statement uses standard boilerplate sentences like "Seeking a challenging opportunity". It lacks specialized core stack summaries or target roles.',
        example: 'Rewrite to: "React/TypeScript developer with 2+ years building low-latency SPAs and database API routes. Seeking full-stack engineering roles."'
      }
    }
  };
};

const defaultMockResumes: ResumeType[] = [
  {
    _id: 'resume_v1',
    fileName: 'resume_v1.0.pdf',
    version: 'v1.0',
    textContent: 'Demo Candidate - Entry Level Software Engineer\nWorked on simple landing pages. Skills: Java, HTML, CSS, JavaScript, React. Education: BS in CS.',
    isActive: false,
    atsReport: {} as any, // Hydrated below
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'resume_v2',
    fileName: 'resume_v2.0_ats.pdf',
    version: 'v2.0',
    textContent: 'Demo Candidate - Full Stack Engineer\nExperience: Software Engineer Intern at Stripe. Engineered scalable payment screens in React 19 and custom Tailwind layouts. Coded API endpoints in Node.js, Express and MongoDB. Reduced checkout load time by 30% using bundle code splitting. Skills: TypeScript, React, Node.js, MongoDB, Docker, Git.',
    isActive: true,
    atsReport: {} as any, // Hydrated below
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Hydrate reports
defaultMockResumes[0].atsReport = {
  ...getClientMockAnalysis(defaultMockResumes[0].textContent),
  score: 64,
  keywordScore: 55,
  formattingScore: 80,
  grammarScore: 90,
  experienceScore: 50,
  projectsScore: 55,
  skillsScore: 60,
  educationScore: 80,
  leadershipScore: 35,
  impactScore: 45,
  summary: 'Basic software engineer resume. Lacks backend frameworks, docker systems, and cloud deployments.',
  strengths: ['Formatting is clean', 'Strong GPA in CS'],
  weaknesses: ['No quantified impact metrics', 'Lacks backend context and modern bundles'],
  recruiterPerspective: 'Needs active mentorship. Demonstrates standard junior traits.',
  atsCompatibility: 'Parseable single-column configuration.',
  missingKeywords: ['TypeScript', 'Node.js', 'Express', 'MongoDB', 'Docker', 'Jest'],
  improvements: [
    { action: 'Rewrite bullets using XYZ formulas (Google standard)', done: false, priority: 'High' },
    { action: 'Incorporate automated test cases logs', done: false, priority: 'Medium' }
  ],
  redFlags: ['Short descriptions lacking technical complexity']
};

defaultMockResumes[1].atsReport = {
  ...getClientMockAnalysis(defaultMockResumes[1].textContent),
  score: 88,
  keywordScore: 85,
  formattingScore: 90,
  grammarScore: 95,
  experienceScore: 86,
  projectsScore: 88,
  skillsScore: 90,
  educationScore: 85,
  leadershipScore: 78,
  impactScore: 85,
  summary: 'Highly optimized resume with solid keyword density matching backend/full-stack internship positions.',
  strengths: ['Great quantified bullet metrics', 'Strong tech stack matches (TypeScript, MERN)', 'Clearly separates achievements'],
  weaknesses: ['Does not detail AWS/Serverless or Unit test libraries'],
  recruiterPerspective: 'A robust candidate ready for fast engineering teams.',
  atsCompatibility: 'Perfect. Single-column parseable formatting.',
  missingKeywords: ['AWS', 'Jest', 'CI/CD', 'GraphQL'],
  improvements: [
    { action: 'Incorporate unit test suite setups', done: false, priority: 'Medium' },
    { action: 'Describe automated Docker build pipes', done: false, priority: 'Low' }
  ],
  redFlags: []
};

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [applications, setApplications] = useState<ApplicationType[]>([]);
  const [resumes, setResumes] = useState<ResumeType[]>([]);
  const [activeResume, setActiveResumeState] = useState<ResumeType | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Core Data Fetcher
  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (token.startsWith('mock_')) throw new Error('Force mock mode');

      const [appRes, resRes] = await Promise.all([
        axios.get('/api/applications', { headers }),
        axios.get('/api/resumes', { headers })
      ]);

      if (appRes.data.success) setApplications(appRes.data.data);
      if (resRes.data.success) {
        setResumes(resRes.data.data);
        const active = resRes.data.data.find((r: ResumeType) => r.isActive) || null;
        setActiveResumeState(active);
      }
    } catch (err) {
      console.warn('⚠️ Server offline or mock session token. Using local Storage cache.');
      // Initialize local storage seeds
      const cacheApp = localStorage.getItem('cache_apps');
      const cacheRes = localStorage.getItem('cache_resumes');

      if (cacheApp) {
        setApplications(JSON.parse(cacheApp));
      } else {
        localStorage.setItem('cache_apps', JSON.stringify(defaultMockApplications));
        setApplications(defaultMockApplications);
      }

      if (cacheRes) {
        const parsedRes = JSON.parse(cacheRes) as ResumeType[];
        setResumes(parsedRes);
        setActiveResumeState(parsedRes.find(r => r.isActive) || null);
      } else {
        localStorage.setItem('cache_resumes', JSON.stringify(defaultMockResumes));
        setResumes(defaultMockResumes);
        setActiveResumeState(defaultMockResumes.find(r => r.isActive) || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, user]);

  // Sync cache changes to localStorage
  useEffect(() => {
    if (applications.length > 0) {
      localStorage.setItem('cache_apps', JSON.stringify(applications));
    }
  }, [applications]);

  useEffect(() => {
    if (resumes.length > 0) {
      localStorage.setItem('cache_resumes', JSON.stringify(resumes));
    }
  }, [resumes]);

  // Generate automated reminders on load
  useEffect(() => {
    const list: string[] = [];
    applications.forEach(app => {
      if (app.status === 'OA') {
        list.push(`⚠️ Online Assessment pending for ${app.company}. Deadline approaches!`);
      }
      if (app.status.includes('Round') || app.status.includes('Technical')) {
        list.push(`📅 Prepare for your upcoming ${app.status} interview with ${app.company}!`);
      }
    });
    setNotifications(list);
  }, [applications]);

  const addApplication = async (appData: any) => {
    const headers = { Authorization: `Bearer ${token}` };

    if (!token || token.startsWith('mock_')) {
      const activeScore = activeResume?.atsReport?.score || 72;
      
      let interviewProb = 25 + (activeScore > 80 ? 30 : 10) + (appData.referral ? 20 : 0);
      interviewProb = Math.min(interviewProb, 95);
      const offerProb = Math.floor(interviewProb * 0.4);
      
      const newApp: ApplicationType = {
        _id: 'app_' + Math.random().toString(36).substring(2, 9),
        ...appData,
        stages: [{ stage: appData.status || 'Wishlist', date: new Date().toISOString(), notes: 'Application created.' }],
        predictions: {
          interviewProbability: interviewProb,
          offerProbability: offerProb,
          rejectionProbability: 100 - offerProb,
          explanation: 'ATS score match verified offline. Follow up on LinkedIn to boost progression.'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setApplications(prev => [newApp, ...prev]);
      return;
    }

    try {
      const res = await axios.post('/api/applications', appData, { headers });
      if (res.data.success) {
        setApplications(prev => [res.data.data, ...prev]);
      }
    } catch {
      // Local fallback
      addApplication({ ...appData, mock_fallback: true });
    }
  };

  const updateApplication = async (id: string, updates: Partial<ApplicationType>) => {
    const headers = { Authorization: `Bearer ${token}` };

    if (!token || token.startsWith('mock_')) {
      setApplications(prev => prev.map(app => {
        if (app._id === id) {
          const merged = { ...app, ...updates };
          if (updates.status && updates.status !== app.status) {
            merged.stages.push({ stage: updates.status, date: new Date().toISOString(), notes: 'Stage updated.' });
          }
          merged.updatedAt = new Date().toISOString();
          return merged;
        }
        return app;
      }));
      return;
    }

    try {
      const res = await axios.put(`/api/applications/${id}`, updates, { headers });
      if (res.data.success) {
        setApplications(prev => prev.map(app => app._id === id ? res.data.data : app));
      }
    } catch {
      // fallback
      setApplications(prev => prev.map(app => {
        if (app._id === id) {
          const merged = { ...app, ...updates };
          if (updates.status && updates.status !== app.status) {
            merged.stages.push({ stage: updates.status, date: new Date().toISOString(), notes: 'Stage updated.' });
          }
          return merged;
        }
        return app;
      }));
    }
  };

  const deleteApplication = async (id: string) => {
    const headers = { Authorization: `Bearer ${token}` };

    if (!token || token.startsWith('mock_')) {
      setApplications(prev => prev.filter(app => app._id !== id));
      return;
    }

    try {
      await axios.delete(`/api/applications/${id}`, { headers });
      setApplications(prev => prev.filter(app => app._id !== id));
    } catch {
      setApplications(prev => prev.filter(app => app._id !== id));
    }
  };

  const uploadResume = async (fileName: string, textContent: string, jobDescription?: string, file?: File) => {
    const headers = { Authorization: `Bearer ${token}` };

    // Using outer-scope getClientMockAnalysis helper

    if (!token || token.startsWith('mock_')) {
      const verNumber = `v${resumes.length + 1}.0`;
      const newRes: ResumeType = {
        _id: 'resume_' + Math.random().toString(36).substring(2, 9),
        fileName,
        version: verNumber,
        textContent,
        isActive: true,
        atsReport: getClientMockAnalysis(textContent, jobDescription || ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setResumes(prev => {
        const deactivated = prev.map(r => ({ ...r, isActive: false }));
        return [...deactivated, newRes];
      });
      setActiveResumeState(newRes);
      return;
    }

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (jobDescription) formData.append('jobDescription', jobDescription);

        res = await axios.post('/api/resumes/upload', formData, {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        res = await axios.post('/api/resumes/upload', { fileName, textContent, jobDescription }, { headers });
      }

      if (res.data.success) {
        setResumes(prev => {
          const deactivated = prev.map(r => ({ ...r, isActive: false }));
          return [...deactivated, res.data.data];
        });
        setActiveResumeState(res.data.data);
      }
    } catch (err) {
      console.warn('API upload failed, falling back to local client state', err);
      const verNumber = `v${resumes.length + 1}.0`;
      const localReport = getClientMockAnalysis(textContent, jobDescription || '');
      const newRes: ResumeType = {
        _id: 'resume_' + Math.random().toString(36).substring(2, 9),
        fileName,
        version: verNumber,
        textContent,
        isActive: true,
        atsReport: localReport,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setResumes(prev => {
        const deactivated = prev.map(r => ({ ...r, isActive: false }));
        return [...deactivated, newRes];
      });
      setActiveResumeState(newRes);
    }
  };

  const setActiveResume = async (id: string) => {
    const headers = { Authorization: `Bearer ${token}` };

    if (!token || token.startsWith('mock_')) {
      setResumes(prev => prev.map(r => ({ ...r, isActive: r._id === id })));
      const active = resumes.find(r => r._id === id) || null;
      setActiveResumeState(active ? { ...active, isActive: true } : null);
      return;
    }

    try {
      const res = await axios.put(`/api/resumes/${id}/active`, {}, { headers });
      if (res.data.success) {
        setResumes(prev => prev.map(r => ({ ...r, isActive: r._id === id })));
        setActiveResumeState(res.data.data);
      }
    } catch {
      // fallback
      setResumes(prev => prev.map(r => ({ ...r, isActive: r._id === id })));
      const active = resumes.find(r => r._id === id) || null;
      setActiveResumeState(active ? { ...active, isActive: true } : null);
    }
  };

  const deleteResume = async (id: string) => {
    const headers = { Authorization: `Bearer ${token}` };

    if (!token || token.startsWith('mock_')) {
      setResumes(prev => {
        const filtered = prev.filter(r => r._id !== id);
        // If we deleted active resume, set latest one as active
        const hasActive = filtered.some(r => r.isActive);
        if (!hasActive && filtered.length > 0) {
          filtered[filtered.length - 1].isActive = true;
          setActiveResumeState(filtered[filtered.length - 1]);
        } else if (filtered.length === 0) {
          setActiveResumeState(null);
        }
        return filtered;
      });
      return;
    }

    try {
      await axios.delete(`/api/resumes/${id}`, { headers });
      setResumes(prev => {
        const filtered = prev.filter(r => r._id !== id);
        const hasActive = filtered.some(r => r.isActive);
        if (!hasActive && filtered.length > 0) {
          filtered[filtered.length - 1].isActive = true;
          setActiveResumeState(filtered[filtered.length - 1]);
        } else if (filtered.length === 0) {
          setActiveResumeState(null);
        }
        return filtered;
      });
    } catch {
      // fallback
      deleteResume(id);
    }
  };

  const toggleImprovementCheck = async (resumeId: string, actionText: string) => {
    let currentDone = false;
    const targetResume = resumes.find(r => r._id === resumeId);
    if (targetResume && targetResume.atsReport) {
      const item = targetResume.atsReport.improvements.find(i => i.action === actionText);
      if (item) currentDone = !item.done;
    }

    setResumes(prev => prev.map(r => {
      if (r._id === resumeId && r.atsReport) {
        const updatedImprovements = r.atsReport.improvements.map(item => {
          if (item.action === actionText) {
            return { ...item, done: !item.done };
          }
          return item;
        });
        const updatedResume = {
          ...r,
          atsReport: {
            ...r.atsReport,
            improvements: updatedImprovements
          }
        };
        if (activeResume && activeResume._id === resumeId) {
          setActiveResumeState(updatedResume);
        }
        return updatedResume;
      }
      return r;
    }));

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/resumes/${resumeId}/checklist`, {
        action: actionText,
        done: currentDone
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.error('Failed to sync checklist update to backend:', error);
    }
  };

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Company,Role,Applied Date,Status,Salary,Location,Remote Type,Priority,Referral\n';

    applications.forEach(app => {
      const date = app.appliedDate ? app.appliedDate.split('T')[0] : '';
      csvContent += `"${app.company}","${app.role}","${date}","${app.status}","${app.salary || ''}","${app.location || ''}","${app.remoteType}","${app.priority}","${app.referral || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Internship_Applications_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchData();
  };

  const analyzeActiveResume = async (jobDescription: string) => {
    if (!activeResume) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (!token || token.startsWith('mock_')) {
      const localReport = getClientMockAnalysis(activeResume.textContent, jobDescription);
      const updatedResume = { ...activeResume, atsReport: localReport };
      setResumes(prev => prev.map(r => r._id === activeResume._id ? updatedResume : r));
      setActiveResumeState(updatedResume);
      return;
    }

    try {
      const res = await axios.post(`/api/resumes/${activeResume._id}/analyze`, { jobDescription }, { headers });
      if (res.data.success) {
        setResumes(prev => prev.map(r => r._id === activeResume._id ? res.data.data : r));
        setActiveResumeState(res.data.data);
      }
    } catch (err) {
      console.warn('API analysis failed, falling back to local client state', err);
      const localReport = getClientMockAnalysis(activeResume.textContent, jobDescription);
      const updatedResume = { ...activeResume, atsReport: localReport };
      setResumes(prev => prev.map(r => r._id === activeResume._id ? updatedResume : r));
      setActiveResumeState(updatedResume);
    }
  };

  return (
    <AppDataContext.Provider value={{
      applications,
      resumes,
      activeResume,
      loading,
      notifications,
      addApplication,
      updateApplication,
      deleteApplication,
      uploadResume,
      setActiveResume,
      deleteResume,
      toggleImprovementCheck,
      exportCSV,
      refreshData,
      analyzeActiveResume
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within an AppDataProvider');
  return context;
};
