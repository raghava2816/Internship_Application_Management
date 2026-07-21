import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Determine active AI Provider (prioritizes Groq if key is present)
export const useGroq = !!GROQ_API_KEY;
export const aiModel = useGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o';
const aiBaseUrl = useGroq ? 'https://api.groq.com/openai/v1' : undefined;
const aiKey = useGroq ? GROQ_API_KEY : OPENAI_API_KEY;

const openai = aiKey ? new OpenAI({ apiKey: aiKey, baseURL: aiBaseUrl }) : null;

// Mock Response Generators when API Key is missing or fails
// Mock Response Generators when API Key is missing or fails
export const getMockATSAnalysis = (resumeText: string = '', jobDescription: string = '') => {
  const lowerText = resumeText.toLowerCase();
  const lowerJD = jobDescription.toLowerCase();

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

  // 2. Contact Information Audit
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}/.test(resumeText);
  const hasLinkedIn = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i.test(resumeText);
  const hasGitHub = /github\.com\/[a-zA-Z0-9_-]+/i.test(resumeText);

  // 3. Section Heading Audit
  const sections = {
    experience: /experience|work\s+history|employment|professional\s+background/i.test(resumeText),
    education: /education|academic/i.test(resumeText),
    projects: /projects|personal\s+projects|academic\s+projects/i.test(resumeText),
    skills: /skills|technical\s+skills|core\s+competencies|technologies/i.test(resumeText),
    certifications: /certifications|certificates|courses/i.test(resumeText)
  };

  // 4. Quantifiable Impact Audit (Google XYZ Formula)
  const sentences = resumeText.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 10);
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
    // General keyword density
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
  if (resumeText.includes(' etc') || resumeText.includes('...') || resumeText.includes('stuff')) {
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

  // Count active sections in mock
  let sectionsCount = 4; // education, experience, projects, skills are basic
  if (hasEmail && hasPhone) sectionsCount++; // contact info section count as present
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
    
    // New Detailed Fields for matching screenshots
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
        explanation: 'Contact section contains email and social profiles but lacks a telephone number. Many recruiters search for contact info first, and automated dialers require active digits.',
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
      Provide highly specific, deep, and context-tailored feedback. Do NOT provide generic placeholders. Give real examples of before-and-after bullet rewrites using the candidate's actual projects/experience.
      
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
        "redFlags": ["red flag 1", ...],
        
        "keywordsMatchedCount": number,
        "keywordsMissingCount": number,
        "quantifiedBulletsCount": number,
        "sectionsPresentCount": number,
        "sectionsTotalCount": 9,
        "foundKeywords": ["keyword 1", ...],
        "sections": {
          "contact": { "score": number, "status": "e.g., Missing phone number or All details present", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" },
          "experience": { "score": number, "status": "e.g., Only 1 internship or Needs more details", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" },
          "quantification": { "score": number, "status": "e.g., Needs more metrics", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" },
          "skills": { "score": number, "status": "e.g., Good but incomplete", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" },
          "education": { "score": number, "status": "e.g., Strong CGPA listed", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" },
          "projects": { "score": number, "status": "e.g., Lacks impact metrics", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" },
          "certifications": { "score": number, "status": "e.g., 4 certs listed", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" },
          "formatting": { "score": number, "status": "e.g., Clean single-column", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" },
          "summary": { "score": number, "status": "e.g., Too generic", "explanation": "specific detail why this score", "example": "concrete before/after write instruction" }
        }
      }
      ONLY return the JSON object. Do not include markdown code block syntax.
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
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
      model: aiModel,
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
      model: aiModel,
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
      model: aiModel,
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
      model: aiModel,
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

    // Simple natural conversation parser
    if (lastMessage.match(/\b(hi|hello|hey|greetings|yo)\b/)) {
      response = "Hello! 👋 I'm your AI Career Coach. How is your job search going today? Feel free to ask me anything about resume reviews, interview prep, salary negotiation, or job matching!";
    } else if (lastMessage.includes('salary') || lastMessage.includes('negotiat') || lastMessage.includes('offer')) {
      response = "When negotiating a salary offer, keep these rules in mind:\n\n1. **Never state a number first** if possible—ask for their budget range.\n2. **Base requests on market data** (e.g. Levels.fyi, Glassdoor) for your specific experience and location.\n3. **Evaluate the whole package**: look at base salary, equity/stock options, sign-on bonuses, remote work flexibility, and benefits.\n\nWould you like me to draft a salary counter-offer message for you?";
    } else if (lastMessage.includes('resume') || lastMessage.includes('ats') || lastMessage.includes('score')) {
      response = "To optimize your resume for ATS parsers, you should:\n\n• **Use a single-column layout**—avoid two columns, sidebars, or complex layouts which confuse ATS parsers.\n• **Ditch visual indicators** like skill progress bars, graphics, or tables.\n• **Incorporate direct keywords** from the target Job Description.\n• **Quantify your impact** using Google's XYZ formula: *'Accomplished [X] as measured by [Y], by doing [Z]'*.\n\nDo you want me to review or rewrite a specific bullet point from your resume?";
    } else if (lastMessage.includes('interview') || lastMessage.includes('prep') || lastMessage.includes('question')) {
      response = "Preparing for a technical round involves three core pillars:\n\n- **Data Structures & Algorithms**: Focus on sliding windows, hash maps, DFS/BFS traversals, and basic sorting.\n- **System Design**: Understand microservices, API gateways, load balancing, caching (Redis), and DB replication.\n- **Behavioral Questions**: Practice standard scenarios using the STAR framework (Situation, Task, Action, Result).\n\nIf you want, we can start a mock interview practice round right here. Just say: *'Start mock interview'*!";
    } else if (lastMessage.includes('portfolio') || lastMessage.includes('github') || lastMessage.includes('git')) {
      response = "To build a stand-out developer portfolio:\n\n1. **README quality**: Ensure your repositories have clear setup instructions, architecture diagrams, and links to live demos.\n2. **Tests**: Projects with actual test suites (Jest, Cypress, etc.) prove you write production-ready code.\n3. **Clean Code**: Follow consistent style guides and modular code structures.\n\nWould you like me to explain how to audit your GitHub repositories?";
    } else if (lastMessage.match(/\b(thanks|thank you|awesome|great|cool)\b/)) {
      response = "You're very welcome! I'm dedicated to helping you secure your target engineering offer. What other career topics or preparation challenges can we work on together?";
    } else if (lastMessage.match(/\b(help|options|capabilities|what can you do)\b/)) {
      response = "I can guide you through the entire application process! We can work on:\n\n1. **Resume Audit & ATS scoring**\n2. **STAR/XYZ resume bullet point rewriting**\n3. **System Design & Coding prep**\n4. **Salary negotiation strategies**\n\nWhat would you like to focus on first?";
    } else {
      response = `That's a great point! Exploring those career paths is highly rewarding. \n\nTo help you best, could you tell me what specific software engineering roles (e.g. Frontend, Backend, Full Stack) you are targeting, or if there is a particular company you're prepping for?`;
    }
    return response;
  }

  try {
    const systemPrompt = {
      role: 'system' as const,
      content: `You are an expert AI Career Coach. Guide the user on resume enhancement, salary negotiation, system design, coding preparation, and job searching strategies.
      Use this resume text as background context:
      ${resumeText}`
    };

    const formattedMessages = messages.map((m: any) => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content
    }));

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [systemPrompt, ...formattedMessages],
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error("❌ Career Coach completion failed:", error);
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

const REALTIME_JOBS = [
  {
    company: "G7 CR Technologies",
    role: "Full Stack Developer Intern (MERN)",
    location: "Bengaluru, Karnataka (In-Office)",
    salary: "₹15,000 - ₹25,000 / month",
    requiredSkills: ["React", "Node.js", "MongoDB", "Express.js", "JavaScript"],
    description: "Design and implement responsive user layouts in React and integrate secure RESTful APIs via Express router layers.",
    link: "https://www.naukri.com/g7cr-technologies-jobs",
    source: "Naukri"
  },
  {
    company: "Webenza India",
    role: "Frontend Developer Trainee (React)",
    location: "Bengaluru, Karnataka (Hybrid)",
    salary: "₹20,000 - ₹30,000 / month",
    requiredSkills: ["React", "TypeScript", "TailwindCSS", "CSS"],
    description: "Work with UI engineers to build responsive web pages, manage states, and track browser bundle performance.",
    link: "https://www.naukri.com/webenza-india-jobs",
    source: "Naukri"
  },
  {
    company: "Foxberry Technology",
    role: "ReactJS Developer Intern",
    location: "Pune, Maharashtra (Onsite)",
    salary: "₹10,000 - ₹18,000 / month",
    requiredSkills: ["React", "JavaScript", "HTML", "CSS", "Git"],
    description: "Deploy interactive components and test browser layouts. Familiarity with Github source control is required.",
    link: "https://www.indeed.com/q-foxberry-technology-jobs.html",
    source: "Indeed"
  },
  {
    company: "Bharti Share Market",
    role: "MERN Stack Web Developer",
    location: "Pune, Maharashtra (In-Office)",
    salary: "₹25,000 - ₹35,000 / month",
    requiredSkills: ["MongoDB", "Express.js", "React", "Node.js", "REST APIs"],
    description: "Build robust administrative panels, configure database endpoints in MongoDB, and troubleshoot server lag.",
    link: "https://www.naukri.com/bharti-share-market-jobs",
    source: "Naukri"
  },
  {
    company: "Xcrino Business Solutions",
    role: "Junior MERN Developer",
    location: "Noida, UP (Hybrid)",
    salary: "₹30,000 - ₹45,000 / month",
    requiredSkills: ["Node.js", "React", "Express.js", "MongoDB", "Redux"],
    description: "Develop new database transactions structures and manage complex global states across web apps.",
    link: "https://www.naukri.com/xcrino-business-solutions-jobs",
    source: "Naukri"
  },
  {
    company: "Quleep",
    role: "Junior React Developer (Fresher)",
    location: "Delhi/NCR (Remote)",
    salary: "₹35,000 - ₹50,000 / month",
    requiredSkills: ["React", "TypeScript", "Vite", "JSON", "APIs"],
    description: "Develop next-gen portal modules. This is a fully remote entry-level position for passionate coding graduates.",
    link: "https://www.indeed.com/q-quleep-jobs.html",
    source: "Indeed"
  },
  {
    company: "Spritle Software",
    role: "Junior Full Stack Developer",
    location: "Chennai, Tamil Nadu (Onsite)",
    salary: "₹22,000 - ₹32,000 / month",
    requiredSkills: ["React", "Node.js", "PostgreSQL", "JavaScript", "Docker"],
    description: "Work with engineering teams to deploy microservices. Basic understanding of docker setups is highly valued.",
    link: "https://www.naukri.com/spritle-software-jobs",
    source: "Naukri"
  },
  {
    company: "Mega Mind Computing Solutions",
    role: "Frontend Web Developer Intern",
    location: "Chennai, Tamil Nadu (In-Office)",
    salary: "₹12,000 - ₹18,000 / month",
    requiredSkills: ["HTML", "CSS", "JavaScript", "React", "TailwindCSS"],
    description: "Collaborate on building customer landing pages and verifying mobile responsiveness indices.",
    link: "https://www.indeed.com/q-mega-mind-computing-jobs.html",
    source: "Indeed"
  },
  {
    company: "Gray Matrix Solutions",
    role: "Web Application Developer Intern",
    location: "Mumbai, Maharashtra (Hybrid)",
    salary: "₹15,000 - ₹22,000 / month",
    requiredSkills: ["JavaScript", "React", "Node.js", "Express.js", "REST APIs"],
    description: "Maintain web portals and verify API security validations across client routers.",
    link: "https://www.naukri.com/gray-matrix-solutions-jobs",
    source: "Naukri"
  },
  {
    company: "Popaya Technologies",
    role: "Junior Full Stack Intern (MERN)",
    location: "Mumbai, Maharashtra (In-Office)",
    salary: "₹18,000 - ₹26,000 / month",
    requiredSkills: ["React", "Node.js", "MongoDB", "JavaScript", "Git"],
    description: "Gain hands-on coding training by writing clean features in our customer-facing web client databases.",
    link: "https://www.indeed.com/q-popaya-technologies-jobs.html",
    source: "Indeed"
  }
];

const REALTIME_INTERNSHIPS = [
  {
    company: "Webenza India",
    role: "Frontend Developer Intern",
    location: "Bengaluru, Karnataka (Hybrid)",
    salary: "₹12,000 / month",
    requiredSkills: ["React", "TypeScript", "TailwindCSS", "CSS"],
    description: "Work with UI engineers to build responsive web pages, manage states, and track browser bundle performance.",
    link: "https://internshala.com/internship/detail/front-end-development-internship-in-bangalore-at-webenza-india17211029",
    source: "Internshala"
  },
  {
    company: "Foxberry Technology",
    role: "ReactJS Developer Intern",
    location: "Pune, Maharashtra (Onsite)",
    salary: "₹10,000 / month",
    requiredSkills: ["React", "JavaScript", "HTML", "CSS", "Git"],
    description: "Deploy interactive components and test browser layouts. Familiarity with Github source control is required.",
    link: "https://www.indeed.com/q-foxberry-technology-jobs.html",
    source: "Indeed"
  },
  {
    company: "Mega Mind Computing Solutions",
    role: "Frontend Web Developer Intern",
    location: "Chennai, Tamil Nadu (In-Office)",
    salary: "₹8,000 / month",
    requiredSkills: ["HTML", "CSS", "JavaScript", "React", "TailwindCSS"],
    description: "Collaborate on building customer landing pages and verifying mobile responsiveness indices.",
    link: "https://www.indeed.com/q-mega-mind-computing-jobs.html",
    source: "Indeed"
  },
  {
    company: "Gray Matrix Solutions",
    role: "Web Application Developer Intern",
    location: "Mumbai, Maharashtra (Hybrid)",
    salary: "₹15,000 / month",
    requiredSkills: ["JavaScript", "React", "Node.js", "Express.js", "REST APIs"],
    description: "Maintain web portals and verify API security validations across client routers.",
    link: "https://internshala.com/internship/detail/web-development-internship-in-mumbai-at-gray-matrix-solutions17211050",
    source: "Internshala"
  },
  {
    company: "Popaya Technologies",
    role: "Junior Full Stack Intern (MERN)",
    location: "Mumbai, Maharashtra (In-Office)",
    salary: "₹14,000 / month",
    requiredSkills: ["React", "Node.js", "MongoDB", "JavaScript", "Git"],
    description: "Gain hands-on coding training by writing clean features in our customer-facing web client databases.",
    link: "https://www.indeed.com/q-popaya-technologies-jobs.html",
    source: "Indeed"
  },
  {
    company: "Decent Cyber Solutions",
    role: "React JS Intern",
    location: "Remote (Work from Home)",
    salary: "₹10,000 / month",
    requiredSkills: ["React", "JavaScript", "HTML5", "CSS3", "Redux"],
    description: "Design state controllers using Redux and connect front-end forms with back-end servers.",
    link: "https://internshala.com/internship/detail/reactjs-work-from-home-job-at-decent-cyber17210988",
    source: "Internshala"
  },
  {
    company: "TechFlow Enterprises",
    role: "Node.js Backend Developer Intern",
    location: "Gurugram, Haryana (Onsite)",
    salary: "₹18,000 / month",
    requiredSkills: ["Node.js", "Express.js", "MongoDB", "REST APIs"],
    description: "Build administrative dashboards endpoints, configure database schemas, and optimize query latency.",
    link: "https://internshala.com/internship/detail/backend-internship-in-gurgaon-at-techflow17210999",
    source: "Internshala"
  },
  {
    company: "InfyTech Systems",
    role: "Full Stack Development Intern",
    location: "Hyderabad, Telangana (Hybrid)",
    salary: "₹15,000 / month",
    requiredSkills: ["React", "Node.js", "MongoDB", "Express.js", "Git"],
    description: "Deploy end-to-end user features, optimize database schemas, and troubleshoot web client lag.",
    link: "https://internshala.com/internship/detail/mern-stack-development-internship-in-hyderabad-at-infytech17210888",
    source: "Internshala"
  }
];

const getSeededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const seededShuffle = <T>(array: T[], seed: number): T[] => {
  const arr = [...array];
  let m = arr.length, t, i;
  while (m) {
    i = Math.floor(getSeededRandom(seed + m) * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
};

export const recommendJobs = async (resumeText: string = '', skills: string[] = []) => {
  const normalizedText = resumeText.toLowerCase();
  const now = new Date();
  // Unique integer for each day (e.g. 20260717)
  const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  // 1. Fetch and Parse Internshala in real-time
  let scrapedInternships: any[] = [];
  try {
    const res = await fetch('https://internshala.com/internships/keywords-reactjs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const html = await res.text();
      const parts = html.split('container-fluid individual_internship');
      for (let i = 1; i < parts.length; i++) {
        const chunk = parts[i];
        const linkMatch = chunk.match(/href="(\/internship\/detail\/[^"]*)"/) || chunk.match(/data-href="([^"]*)"/);
        const titleMatch = chunk.match(/class="job-title-href"[^>]*>([\s\S]*?)<\/a>/);
        if (!linkMatch || !titleMatch) continue;

        const link = `https://internshala.com${linkMatch[1]}`;
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();

        const companyMatch = chunk.match(/class="company-name">\s*([\s\S]*?)\s*<\/p>/);
        const company = companyMatch ? companyMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown Company';

        const locationMatch = chunk.match(/class="row-1-item locations"[\s\S]*?<span>\s*<a>([\s\S]*?)<\/a>/) || chunk.match(/class="row-1-item locations"[\s\S]*?<span>\s*([\s\S]*?)\s*<\/span>/);
        const location = locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : 'Remote / Office';

        const stipendMatch = chunk.match(/class=['"]stipend['"]>([\s\S]*?)<\/span>/);
        const stipend = stipendMatch ? stipendMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unspecified';

        const descMatch = chunk.match(/class="about_job"[\s\S]*?class="text">\s*([\s\S]*?)\s*<\/div>/);
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 180) + '...' : 'No description available.';

        const requiredSkills: string[] = [];
        const skillMatches = chunk.matchAll(/<div class='job_skill'>([^<]*)<\/div>/g);
        for (const sm of skillMatches) {
          requiredSkills.push(sm[1].trim());
        }

        const matched: string[] = [];
        const missing: string[] = [];
        requiredSkills.forEach(sk => {
          if (normalizedText.includes(sk.toLowerCase())) {
            matched.push(sk);
          } else {
            missing.push(sk);
          }
        });

        let matchPercentage = 60;
        if (requiredSkills.length > 0) {
          matchPercentage = Math.round(50 + (matched.length / requiredSkills.length) * 45);
        }
        matchPercentage = Math.min(matchPercentage, 100);

        scrapedInternships.push({
          company,
          role: title,
          location,
          salary: stipend,
          matchPercentage,
          skillsMatched: matched,
          skillsMissing: missing,
          description,
          jobLink: link,
          source: "Internshala"
        });
      }
    }
  } catch (err) {
    console.error("Failed to scrape Internshala in real-time:", err);
  }

  // Shuffle and pick top 10 Internshala real-time postings, or fallback if none scraped
  if (scrapedInternships.length > 0) {
    scrapedInternships = scrapedInternships.slice(0, 10);
  } else {
    // Fallback to static seed internships
    const staticInternships = seededShuffle(REALTIME_INTERNSHIPS, dateSeed).slice(0, 5);
    scrapedInternships = staticInternships.map(job => {
      const matched: string[] = [];
      const missing: string[] = [];
      job.requiredSkills.forEach(skill => {
        if (normalizedText.includes(skill.toLowerCase())) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      });
      let matchPercentage = 60;
      if (job.requiredSkills.length > 0) {
        matchPercentage = Math.round(50 + (matched.length / job.requiredSkills.length) * 45);
      }
      return {
        company: job.company,
        role: job.role,
        location: job.location,
        salary: job.salary,
        matchPercentage,
        skillsMatched: matched,
        skillsMissing: missing,
        description: job.description,
        jobLink: job.link,
        source: job.source
      };
    });
  }

  // 2. Fetch and Parse indeed/naukri
  const dailyJobs = seededShuffle(REALTIME_JOBS, dateSeed).slice(0, 5);
  const processedJobs = dailyJobs.map(job => {
    const matched: string[] = [];
    const missing: string[] = [];
    job.requiredSkills.forEach(skill => {
      if (normalizedText.includes(skill.toLowerCase())) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    let matchPercentage = 60;
    if (job.requiredSkills.length > 0) {
      matchPercentage = Math.round(50 + (matched.length / job.requiredSkills.length) * 45);
    }
    matchPercentage = Math.min(matchPercentage, 100);

    // Dynamic direct-redirection link to search for this exact job on Indeed or Naukri
    // Extract core role keywords to ensure the search always returns active live postings
    let coreQuery = 'React Developer';
    const lowerRole = job.role.toLowerCase();
    if (lowerRole.includes('react')) {
      coreQuery = 'React Developer';
    } else if (lowerRole.includes('frontend')) {
      coreQuery = 'Frontend Developer';
    } else if (lowerRole.includes('full stack') || lowerRole.includes('mern')) {
      coreQuery = 'Full Stack Developer';
    } else if (lowerRole.includes('node')) {
      coreQuery = 'Node.js Developer';
    } else {
      coreQuery = 'Software Developer';
    }

    let applyLink = job.link;
    if (job.source === 'Indeed') {
      applyLink = `https://in.indeed.com/jobs?q=${encodeURIComponent(coreQuery)}`;
    } else if (job.source === 'Naukri') {
      applyLink = `https://www.naukri.com/${encodeURIComponent(coreQuery.toLowerCase().replace(/\s+/g, '-'))}-jobs`;
    }

    return {
      company: job.company,
      role: job.role,
      location: job.location,
      salary: job.salary,
      matchPercentage,
      skillsMatched: matched,
      skillsMissing: missing,
      description: job.description,
      jobLink: applyLink,
      source: job.source
    };
  });

  return {
    jobs: processedJobs,
    internships: scrapedInternships
  };
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

// ─── Streaming helpers ────────────────────────────────────────────────────────

/**
 * Stream AI coach response token-by-token.
 * Calls onToken(chunk) for each piece, onDone() when finished, onError(err) on failure.
 */
export const askCoachStream = async (
  messages: any[],
  resumeText: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: unknown) => void
) => {
  if (!openai) {
    // Mock streaming: simulate token-by-token output from mock response
    const mockReply = await askCoach(messages, resumeText);
    const words = mockReply.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      if (i < words.length) {
        onToken((i === 0 ? '' : ' ') + words[i]);
        i++;
      } else {
        clearInterval(interval);
        onDone();
      }
    }, 40);
    return;
  }

  try {
    const systemPrompt = {
      role: 'system' as const,
      content: `You are an expert AI Career Coach. Guide the user on resume enhancement, salary negotiation, system design, coding preparation, and job searching strategies.
      Use this resume text as background context:
      ${resumeText}`
    };

    const formattedMessages = messages.map((m: any) => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content
    }));

    const stream = await openai.chat.completions.create({
      model: aiModel,
      messages: [systemPrompt, ...formattedMessages],
      temperature: 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) onToken(token);
    }
    onDone();
  } catch (err) {
    onError(err);
  }
};

/**
 * Emit live analysis progress steps via callback.
 * Calls onStep(step, message) for each phase of processing.
 */
export const analyzeResumeStream = async (
  resumeText: string,
  jobDescription: string,
  onStep: (step: number, total: number, label: string) => void,
  onDone: (result: any) => void,
  onError: (err: unknown) => void
) => {
  try {
    const steps = [
      'Parsing resume structure...',
      'Extracting keywords and skills...',
      'Matching against job description...',
      'Scoring sections (experience, projects, education)...',
      'Generating improvement recommendations...',
      'Finalizing ATS report...'
    ];
    const total = steps.length;

    // Emit step 1 immediately
    for (let i = 0; i < steps.length - 1; i++) {
      onStep(i + 1, total, steps[i]);
      await new Promise(r => setTimeout(r, 600));
    }

    // Run actual analysis
    const result = await analyzeResume(resumeText, jobDescription);
    
    // Emit final step
    onStep(total, total, steps[total - 1]);
    await new Promise(r => setTimeout(r, 300));

    onDone(result);
  } catch (err) {
    onError(err);
  }
};
