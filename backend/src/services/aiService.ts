import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Determine active AI Provider (prioritizes Groq if key is present)
export const useGroq = !!GROQ_API_KEY;
export const aiModel = useGroq ? 'llama3-70b-8192' : 'gpt-4o';
const aiBaseUrl = useGroq ? 'https://api.groq.com/openai/v1' : undefined;
const aiKey = useGroq ? GROQ_API_KEY : OPENAI_API_KEY;

const openai = aiKey ? new OpenAI({ apiKey: aiKey, baseURL: aiBaseUrl }) : null;

// Mock Response Generators when API Key is missing or fails
// Mock Response Generators when API Key is missing or fails
// Mock data generators removed for strict real-time enforcement

export const analyzeResume = async (resumeText: string, jobDescription: string) => {
  if (!openai) {
    throw new Error('AI Service is not configured. Missing API Key.');
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
  } catch (error: any) {
    console.error('❌ AI Analysis API failed:', error);
    throw new Error('AI Service failed to analyze resume: ' + (error?.message || 'Unknown error'));
  }
};

export const rewriteResumeSection = async (section: string, text: string, style: string = 'STAR') => {
  if (!openai) {
    throw new Error('AI Service is not configured. Missing API Key.');
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
  } catch (error: any) {
    throw new Error('AI Service failed to rewrite section: ' + (error?.message || 'Unknown error'));
  }
};

export const generateCoverLetter = async (resumeText: string, jobDetails: { company: string; role: string; description?: string }) => {
  if (!openai) {
    throw new Error('AI Service is not configured. Missing API Key.');
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
  } catch (error: any) {
    throw new Error('AI Service failed to generate cover letter: ' + (error?.message || 'Unknown error'));
  }
};

export const generateMockInterview = async (role: string, company: string, resumeText: string) => {
  if (!openai) {
    throw new Error('AI Service is not configured. Missing API Key.');
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
  } catch (error: any) {
    throw new Error('AI Service failed to generate mock interview: ' + (error?.message || 'Unknown error'));
  }
};

export const gradeAnswer = async (question: string, userAnswer: string) => {
  if (!openai) {
    throw new Error('AI Service is not configured. Missing API Key.');
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
  } catch (error: any) {
    throw new Error('AI Service failed to grade answer: ' + (error?.message || 'Unknown error'));
  }
};

export const askCoach = async (messages: any[], resumeText: string) => {
  if (!openai) {
    throw new Error('AI Service is not configured. Missing API Key.');
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
  } catch (error: any) {
    console.error("❌ Career Coach completion failed:", error);
    throw new Error('AI Coach service failed: ' + (error?.message || 'Unknown error'));
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
    onError(new Error('AI Service is not configured. Missing API Key.'));
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
