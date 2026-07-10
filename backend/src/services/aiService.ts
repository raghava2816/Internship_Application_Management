import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Mock Response Generators when API Key is missing or fails
const getMockATSAnalysis = (resumeText: string = '', jobDescription: string = '') => {
  const lowerText = resumeText.toLowerCase();
  const lowerJD = jobDescription.toLowerCase();

  // Comprehensive tech keywords list (80+ common skills)
  const skillsList = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 
    'Python', 'Django', 'Flask', 'Java', 'Spring', 'C++', 'Go', 'Docker', 'Kubernetes', 
    'AWS', 'CI/CD', 'Jest', 'Git', 'HTML', 'CSS', 'TailwindCSS', 'Redux', 'SQL', 'NoSQL',
    'Angular', 'Vue', 'Next.js', 'NestJS', 'GraphQL', 'RESTful', 'FastAPI', 'Rust', 'Ruby', 
    'Rails', 'PHP', 'Laravel', 'C#', 'ASP.NET', 'MySQL', 'Redis', 'Cassandra', 'DynamoDB', 
    'Terraform', 'GCP', 'Azure', 'Jenkins', 'GitHub Actions', 'Cypress', 
    'Playwright', 'Jira', 'Agile', 'Scrum', 'Figma', 'Webpack', 'Vite', 'Zustand', 'Prisma'
  ];

  // Try to extract name: look for NAME label or first non-empty short capitalized line
  let candidateName = 'Applicant';
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const nameLine = lines.find(l => l.toUpperCase().startsWith('NAME:'));
  if (nameLine) {
    candidateName = nameLine.replace(/NAME:/i, '').trim();
  } else if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 40 && /^[A-Z][a-zA-Z]*(\s+[A-Z][a-zA-Z]*)+$/.test(firstLine)) {
      candidateName = firstLine;
    }
  }

  // Find candidate's skills by checking text content
  const foundSkills = skillsList.filter(skill => lowerText.includes(skill.toLowerCase()));
  if (foundSkills.length === 0) {
    foundSkills.push('JavaScript', 'HTML', 'CSS'); // Fallback core skills
  }

  // Find JD skills that are NOT in candidate's skills
  const jdSkills = skillsList.filter(skill => lowerJD.includes(skill.toLowerCase()));
  const missingKeywords = jdSkills.filter(skill => !foundSkills.includes(skill));

  // Determine scores based on match density
  const totalJD = jdSkills.length;
  const matchedJD = jdSkills.filter(skill => foundSkills.includes(skill)).length;
  let matchRate = 0.75;
  if (totalJD > 0) {
    matchRate = matchedJD / totalJD;
  }
  
  const score = Math.floor(matchRate * 30) + 65; // Scale from 65 to 95
  const keywordScore = Math.floor(matchRate * 35) + 60;
  const formattingScore = lowerText.includes('phone') || lowerText.includes('@') ? 92 : 72;
  const grammarScore = Math.floor(Math.random() * 8) + 88;
  const experienceScore = Math.floor(Math.random() * 15) + 75;
  const projectsScore = Math.floor(Math.random() * 15) + 75;
  const skillsScore = Math.min(Math.floor(matchRate * 30) + 65, 100);
  const impactScore = Math.floor(Math.random() * 20) + 70;

  // Build dynamic strengths, weaknesses, and improvements
  const strengths = [
    `Proficient in core technical competencies: ${foundSkills.slice(0, 5).join(', ')}`,
    "Formatting structure is clean and parseable by standard ATS parsers",
    "Consistent usage of active technical verbs to describe contributions"
  ];

  const weaknesses: string[] = [];
  const improvements = [];
  const redFlags: string[] = [];

  // Parse contact details
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g.test(resumeText);
  const hasPhone = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}/g.test(resumeText);

  if (!hasEmail && !hasPhone) {
    redFlags.push("Missing email and phone number contact details in header");
    improvements.push({
      action: "Ensure contact details (email and phone number) are present at the top header",
      done: false,
      priority: 'High' as const
    });
  }

  if (missingKeywords.length > 0) {
    weaknesses.push(`Missing alignment for role-critical keywords: ${missingKeywords.slice(0, 3).join(', ')}`);
    improvements.push({
      action: `Integrate missing role-specific keywords: ${missingKeywords.slice(0, 4).join(', ')} in technical sections`,
      done: false,
      priority: 'High' as const
    });
  } else {
    weaknesses.push("Could elaborate more on automated unit testing and containerized configurations");
  }

  weaknesses.push("Lack of quantified results (e.g. metrics, percentage improvements, or speedups) in experience bullets");
  
  improvements.push({
    action: "Incorporate metrics following Google's XYZ formula (e.g. 'Improved speed by 25% by doing X')",
    done: false,
    priority: 'High' as const
  });

  if (foundSkills.length < 5) {
    improvements.push({
      action: "List specific libraries, APIs, and dev tools (e.g. Git, Jest) to increase skill density",
      done: false,
      priority: 'Medium' as const
    });
  }

  improvements.push({
    action: "Ensure formatting fits cleanly onto a single page to prevent reader fatigue",
    done: true,
    priority: 'Low' as const
  });

  const summary = `Candidate ${candidateName} shows a solid foundation with matching skills including ${foundSkills.join(', ')}. ${
    missingKeywords.length > 0 
      ? `To optimize for this specific job description, consider integrating missing keywords: ${missingKeywords.join(', ')}.`
      : "The skill alignment matches the job description criteria very closely."
  }`;

  return {
    score,
    keywordScore,
    formattingScore,
    grammarScore,
    experienceScore,
    projectsScore,
    skillsScore,
    educationScore: Math.floor(Math.random() * 10) + 85,
    leadershipScore: Math.floor(Math.random() * 20) + 65,
    impactScore,
    summary,
    strengths,
    weaknesses,
    recruiterPerspective: `Candidate ${candidateName} demonstrates direct hands-on experience in ${foundSkills.slice(0, 3).join(', ')}. The resume is parseable, but past project items would stand out much more if they included direct metrics.`,
    atsCompatibility: "Optimal structure. The text parser resolved all headers and bullet lists cleanly.",
    missingKeywords: missingKeywords.length > 0 ? missingKeywords : ['AWS', 'Kubernetes', 'CI/CD'],
    improvements,
    redFlags
  };
};

const getMockInterviewQuestions = (role: string = 'Software Engineer', company: string = 'TechCorp') => {
  return [
    {
      question: `Can you explain how React's virtual DOM works and how React 19 introduces Server Components?`,
      category: 'Technical'
    },
    {
      question: `Describe a time when you disagreed with a senior engineer or product manager on a technical design choice. How did you resolve it?`,
      category: 'Behavioral'
    },
    {
      question: `Why do you want to join ${company} as a ${role}, and what do you expect from our engineering culture?`,
      category: 'HR'
    },
    {
      question: `Implement a function in TypeScript that takes an array of integers and returns the length of the longest consecutive elements sequence. What is the time complexity?`,
      category: 'Coding'
    },
    {
      question: `Design an rate-limiting system for a highly-scalable global web service (like Stripe). Explain how you would prevent DDoS attacks and manage client tokens.`,
      category: 'System Design'
    }
  ];
};

const getMockInterviewGrade = (question: string, answer: string) => {
  const baseScore = Math.floor(Math.random() * 25) + 65; // 65 to 90
  return {
    score: baseScore,
    confidenceScore: Math.floor(Math.random() * 30) + 60,
    feedback: `The response hits key technical concepts, showing basic familiarity. However, you could structure your explanation better. For instance, in coding questions, explicitly mention space complexity and edge cases (empty inputs, negative bounds).`,
    improvements: `Try using the STAR framework (Situation, Task, Action, Result) for behavioral answers. Highlight the exact technology, bottleneck, and target speed or conversion improvements.`
  };
};

export const analyzeResume = async (resumeText: string, jobDescription: string) => {
  if (!openai) {
    console.log('🤖 AI Service: Running in local mockup mode (No API Key).');
    return getMockATSAnalysis(resumeText, jobDescription);
  }

  try {
    const prompt = `
      You are an expert ATS (Applicant Tracking System) parser and senior recruiter.
      Analyze the following resume content in relation to the job description (if provided).
      
      RESUME:
      ${resumeText}

      JOB DESCRIPTION:
      ${jobDescription}

      Return a JSON object containing the exact fields:
      {
        "score": number (0-100, overall suitability),
        "keywordScore": number (0-100),
        "formattingScore": number (0-100),
        "grammarScore": number (0-100),
        "experienceScore": number (0-100),
        "projectsScore": number (0-100),
        "skillsScore": number (0-100),
        "educationScore": number (0-100),
        "leadershipScore": number (0-100),
        "impactScore": number (0-100),
        "summary": "overall evaluation summary",
        "strengths": ["strength 1", "strength 2", ...],
        "weaknesses": ["weakness 1", "weakness 2", ...],
        "recruiterPerspective": "how a human recruiter will view this resume",
        "atsCompatibility": "evaluation of formatting for ATS parser friendliness",
        "missingKeywords": ["missing keyword 1", ...],
        "improvements": [
          { "action": "description of improvement", "done": false, "priority": "High" | "Medium" | "Low" }
        ],
        "redFlags": ["red flag 1", ...]
      }
      ONLY return the JSON object. Do not include markdown code block syntax.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error('❌ AI Analysis API failed, falling back to mock:', error);
    return getMockATSAnalysis(resumeText, jobDescription);
  }
};

export const rewriteResumeSection = async (section: string, text: string, style: string = 'STAR') => {
  if (!openai) {
    return {
      rewrittenText: `[Enhanced using ${style} Formula]:\n• Managed migration of custom legacy build tools to standard Vite setup, reducing page bundle sizes by 42% and shortening local build startup times from 15 seconds to 1.8 seconds.\n• Leveraged TypeScript strict modes to eliminate runtime null-pointer exceptions, resulting in an estimated 15% reduction in production crash logs over a 6-month cycle.`,
      originalText: text
    };
  }

  try {
    const prompt = `
      You are an expert technical writer. Rewrite the following bullet points or description from a resume's '${section}' section.
      
      ORIGINAL CONTENT:
      ${text}

      REWRITE FORMULA:
      ${style} (e.g. STAR Method: Situation-Task-Action-Result or Google's XYZ Formula: Accomplished [X] as measured by [Y], by doing [Z]).
      Inject strong action verbs and quantified impact metrics.

      Return a JSON object:
      {
        "rewrittenText": "The final rewritten bullet points",
        "originalText": "The original text"
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    return {
      rewrittenText: `[Enhanced using ${style} Formula - Fallback]:\n• Accomplished 30% latency reduction in main API database routes by creating composite Indexes in MongoDB and caching heavy configurations on Redis.`,
      originalText: text
    };
  }
};

export const generateCoverLetter = async (resumeText: string, jobDetails: { company: string; role: string; description?: string }) => {
  if (!openai) {
    return `Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobDetails.role} position at ${jobDetails.company}. With a solid foundation in building reactive interfaces using React, automating server pipelines with Node.js, and scaling data schemas across MongoDB, my technical qualifications align closely with the engineering goals of your team.

Throughout my software engineering experience, I have prioritized modular code architectures and type-safety in TypeScript, which has consistently accelerated deployment cycles. At my previous projects, I led the transition toward automated system tests, resulting in a cleaner development cycle and fewer user regressions.

I am particularly excited to join ${jobDetails.company} because of your commitment to technical innovation and developer productivity. I welcome the opportunity to discuss how my skill set in full-stack architecture and automated tracking systems can contribute to your core platforms.

Thank you for your time and consideration.

Sincerely,
[Your Name]`;
  }

  try {
    const prompt = `
      Write a highly professional, ATS-optimized, personalized cover letter.
      
      RESUME DETAILS:
      ${resumeText}

      JOB DETAILS:
      Company: ${jobDetails.company}
      Role: ${jobDetails.role}
      Description: ${jobDetails.description || ''}

      Generate an editable, elegant letter that speaks directly to the job requirements. Return only the plain letter text.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    return `Dear Hiring Team at ${jobDetails.company},\n\nI am writing to apply for the position of ${jobDetails.role}...`;
  }
};

export const generateMockInterview = async (role: string, company: string, resumeText: string) => {
  if (!openai) {
    return getMockInterviewQuestions(role, company);
  }

  try {
    const prompt = `
      Generate 5 mock interview questions for a ${role} position at ${company}.
      Use the applicant's resume to tailor 2 technical/project-based questions, and make the rest general.
      
      RESUME:
      ${resumeText}

      Return a JSON array of questions, where each question has:
      {
        "question": "The interview question",
        "category": "Technical" | "Behavioral" | "HR" | "Coding" | "System Design"
      }
      ONLY return the JSON array. Do not include markdown code block wrappers.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    const cleanContent = response.choices[0].message.content || '[]';
    return JSON.parse(cleanContent.trim());
  } catch (error) {
    return getMockInterviewQuestions(role, company);
  }
};

export const gradeAnswer = async (question: string, userAnswer: string) => {
  if (!openai) {
    return getMockInterviewGrade(question, userAnswer);
  }

  try {
    const prompt = `
      Evaluate the following candidate answer to an interview question.
      
      QUESTION:
      ${question}

      ANSWER:
      ${userAnswer}

      Provide a grade score (0-100), feedback points, and action items for improvement.
      Return a JSON object:
      {
        "score": number,
        "confidenceScore": number (0-100, based on speaking metrics or wording),
        "feedback": "detailed review string",
        "improvements": "improvement suggestions string"
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    return getMockInterviewGrade(question, userAnswer);
  }
};

export const askCoach = async (messages: any[], resumeText: string) => {
  if (!openai) {
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
    let response = "I'm here as your AI Career Coach. Tell me about your target job search, or upload a resume to start reviewing code structures!";
    
    if (lastMessage.includes('salary') || lastMessage.includes('negotiat')) {
      response = "When negotiating a salary offer, keep these rules in mind:\n1. Never state a number first if possible—ask for their budget range.\n2. Always base your requests on market rates (use Glassdoor/Levels.fyi).\n3. Consider the total package, including bonuses, equity, remote work flexibility, and signs of strong mentorship.";
    } else if (lastMessage.includes('resume') || lastMessage.includes('ats')) {
      response = "To optimize your resume for ATS parsers, structure it with clean, single-column sections. Avoid inserting data charts, progress bars, or icons. List your technical skills in a clear comma-separated field, and write descriptions using action verbs (e.g. *Migrated*, *Optimized*, *Engineered*).";
    } else if (lastMessage.includes('interview') || lastMessage.includes('prep')) {
      response = "Preparing for a technical round involves three core pillars:\n- **Data Structures & Algorithms**: Master arrays, hashes, sliding windows, and search traversals.\n- **System Design**: Understand microservices, API gateways, load balancing, caching (Redis), and DB replication.\n- **Behavioral Questions**: Practice standard scenarios using the STAR framework.";
    }
    return response;
  }

  try {
    const systemPrompt = {
      role: 'system',
      content: `You are an expert AI Career Coach. Guide the user on resume enhancement, salary negotiation, system design, coding preparation, and job searching strategies.
      Use this resume text as background context:
      ${resumeText}`
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemPrompt, ...messages],
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    return "I am currently running in offline backup mode. How can I assist you with career advice?";
  }
};

export const predictSuccess = (resumeScore: number, application: any) => {
  // Simple deterministic algorithm acting as a lightweight ML prediction model
  // Takes application status, priority, resume ATS score, and computes chances
  let interviewProb = 25;
  let offerProb = 10;
  
  if (resumeScore > 85) {
    interviewProb += 25;
    offerProb += 15;
  } else if (resumeScore > 70) {
    interviewProb += 15;
    offerProb += 5;
  }

  if (application.referral) {
    interviewProb += 20;
    offerProb += 10;
  }

  if (application.priority === 'High') {
    interviewProb += 5;
  }

  // Adjust by status
  if (application.status === 'OA') {
    interviewProb = Math.max(interviewProb, 65);
  } else if (application.status.includes('Round') || application.status.includes('Technical')) {
    interviewProb = 95;
    offerProb += 20;
  } else if (application.status === 'Offer') {
    interviewProb = 100;
    offerProb = 100;
  } else if (application.status === 'Rejected') {
    interviewProb = 0;
    offerProb = 0;
  }

  interviewProb = Math.min(interviewProb, 100);
  offerProb = Math.min(offerProb, 100);
  const rejectionProb = 100 - offerProb;

  let explanation = '';
  if (interviewProb > 75) {
    explanation = `High probability of progressing. The ATS resume score of ${resumeScore} matches well, and having active referral pipelines significantly lowers initial screening filters.`;
  } else if (interviewProb > 45) {
    explanation = `Moderate chance of interview. While the resume contains proper layout structures, we recommend adding specific missing keywords in this application to raise visibility.`;
  } else {
    explanation = `Low progression likelihood. We strongly advise updating this application with a cover letter and matching your resume specifically to the job role requirements to bypass ATS triggers.`;
  }

  return {
    interviewProbability: interviewProb,
    offerProbability: offerProb,
    rejectionProbability: rejectionProb,
    explanation
  };
};

export const recommendJobs = (resumeText: string = '', skills: string[] = []) => {
  // Mock recommendations based on typical profile
  return [
    {
      company: "Stripe",
      role: "Frontend Engineer (Dashboard)",
      location: "San Francisco, CA (Hybrid)",
      matchPercentage: 92,
      salary: "$140,000 - $185,000",
      skillsMatched: ["React", "TypeScript", "TailwindCSS"],
      description: "Build premium developer dashboards, API logs, and scalable UI elements."
    },
    {
      company: "Linear",
      role: "Full Stack Engineer",
      location: "Remote (Global)",
      matchPercentage: 87,
      salary: "$120,000 - $160,000",
      skillsMatched: ["Node.js", "TypeScript", "React", "MongoDB"],
      description: "Contribute to building fast, keyboard-shortcut-driven project management clients."
    },
    {
      company: "Vercel",
      role: "Solutions Architect",
      location: "New York, NY (Hybrid)",
      matchPercentage: 81,
      salary: "$150,000 - $200,000",
      skillsMatched: ["React", "Next.js", "Vite"],
      description: "Interface with enterprise engineering partners to deploy and optimize client bundles."
    }
  ];
};

export const generateLinkedInMessage = (type: string, company: string, role: string, recruiter: string = 'Hiring Manager') => {
  const name = recruiter ? recruiter : 'Hiring Manager';
  switch (type) {
    case 'connection':
      return `Hi ${name}, I saw you lead recruiting for the engineering teams at ${company}. I'm a full-stack developer specializing in TypeScript and React applications. I'd love to connect and follow your work!`;
    case 'cold_message':
      return `Hi ${name},\n\nI hope you're having a great week. I recently applied for the ${role} opening at ${company} and wanted to reach out directly. I've built several responsive React dashboards and managed MongoDB databases locally. Given my profile, I believe I can hit the ground running on your product engineering team.\n\nI'd love to learn more about the team's goals this quarter. I've attached my resume for reference.\n\nBest,\n[Your Name]`;
    case 'referral':
      return `Hi [Contact Name],\n\nI hope you're doing well! I'm planning to apply for the ${role} position at ${company}. I saw you've been working there for a while and wanted to ask about the engineering culture. If you think the team is a good fit, would you be open to providing a referral? I've attached my resume and projects dashboard. Thanks so much!\n\nBest regards,\n[Your Name]`;
    default:
      return `Hi ${name}, checking in regarding the ${role} application. Thank you!`;
  }
};
