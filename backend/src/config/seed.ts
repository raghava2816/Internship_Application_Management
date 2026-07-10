import User from '../models/User';
import Application from '../models/Application';
import Resume from '../models/Resume';
import Log from '../models/Log';

export const seedDatabase = async () => {
  try {
    // 1. Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@tracker.com' });
    let adminId;
    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@tracker.com',
        password: 'password123',
        role: 'admin',
        linkedinUrl: 'https://linkedin.com/in/admin-tracker',
        githubUrl: 'https://github.com/admin-tracker',
        portfolioUrl: 'https://admin-tracker.dev',
        bio: 'System Administrator for AI Internship Tracker Pro.',
        skills: ['System Design', 'DevOps', 'Kubernetes', 'Cloud Infrastructure'],
        settings: {
          theme: 'dark',
          notifications: { email: true, push: true, deadlineReminderDays: 1 }
        }
      });
      adminId = admin._id;
      console.log('✅ Admin user seeded.');
    } else {
      adminId = adminExists._id;
    }

    // 2. Check if demo user exists
    const demoExists = await User.findOne({ email: 'demo@tracker.com' });
    let demoId;
    let isNewDemoUser = false;
    if (!demoExists) {
      const demo = await User.create({
        name: 'Demo Candidate',
        email: 'demo@tracker.com',
        password: 'password123',
        role: 'user',
        linkedinUrl: 'https://linkedin.com/in/demo-applicant',
        githubUrl: 'https://github.com/demo-applicant',
        portfolioUrl: 'https://demo-applicant.dev',
        bio: 'Passionate full stack developer seeking a summer software engineering internship.',
        skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'TailwindCSS', 'Express', 'Vite', 'Framer Motion'],
        settings: {
          theme: 'dark',
          notifications: { email: true, push: true, deadlineReminderDays: 3 }
        }
      });
      demoId = demo._id;
      isNewDemoUser = true;
      console.log('✅ Demo user seeded.');
    } else {
      demoId = demoExists._id;
    }

    // 3. Seed Applications if demo user has none
    const appsCount = await Application.countDocuments({ ownerId: demoId });
    if (appsCount === 0) {
      const sampleApps = [
        {
          ownerId: demoId,
          company: 'Google',
          role: 'Software Engineer Intern',
          jobLink: 'https://careers.google.com/jobs/results/123456',
          salary: '$50 / hr',
          location: 'Mountain View, CA',
          employmentType: 'Internship',
          remoteType: 'Onsite',
          status: 'Applied',
          priority: 'High',
          appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          notes: 'Completed referral request. Reached out to recruiter on LinkedIn.',
          tags: ['FAANG', 'Frontend'],
          predictions: {
            interviewProbability: 75,
            offerProbability: 35,
            rejectionProbability: 25,
            explanation: 'Strong skill alignment with React and TypeScript. Referral adds significant weight.'
          }
        },
        {
          ownerId: demoId,
          company: 'Meta',
          role: 'Full Stack Engineer Intern',
          jobLink: 'https://careers.meta.com/jobs/results/987654',
          salary: '$55 / hr',
          location: 'Remote',
          employmentType: 'Internship',
          remoteType: 'Remote',
          status: 'OA',
          priority: 'High',
          appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          notes: 'Received OA link. 3-question algorithms test. Need to complete by tomorrow.',
          tags: ['FAANG', 'Full Stack'],
          predictions: {
            interviewProbability: 60,
            offerProbability: 25,
            rejectionProbability: 40,
            explanation: 'Requires passing the OA within a strict time limit.'
          }
        },
        {
          ownerId: demoId,
          company: 'Microsoft',
          role: 'Frontend Engineer Co-op',
          jobLink: 'https://careers.microsoft.com/jobs/results/654321',
          salary: '$48 / hr',
          location: 'Redmond, WA (Hybrid)',
          employmentType: 'Co-op',
          remoteType: 'Hybrid',
          status: 'Wishlist',
          priority: 'Medium',
          appliedDate: new Date(),
          notes: 'Application open. Need to optimize resume specifically for Azure-related services mentioned.',
          tags: ['Enterprise', 'Hybrid']
        },
        {
          ownerId: demoId,
          company: 'Netflix',
          role: 'Product Engineer Intern',
          jobLink: 'https://careers.netflix.com/jobs/results/888888',
          salary: '$60 / hr',
          location: 'Los Gatos, CA',
          employmentType: 'Internship',
          remoteType: 'Onsite',
          status: 'Offer',
          priority: 'High',
          appliedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          notes: 'Recruiter phone interview and 2 technical rounds completed. Offer letter received!',
          tags: ['FAANG', 'Offer'],
          predictions: {
            interviewProbability: 95,
            offerProbability: 100,
            rejectionProbability: 0,
            explanation: 'Offer has been formally extended in writing.'
          }
        },
        {
          ownerId: demoId,
          company: 'Amazon',
          role: 'SDE Intern',
          jobLink: 'https://amazon.jobs/results/999',
          salary: '$45 / hr',
          location: 'Seattle, WA',
          employmentType: 'Internship',
          remoteType: 'Onsite',
          status: 'Rejected',
          priority: 'Low',
          appliedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          notes: 'Rejected post-OA. Focus more on Leadership Principles and Trees/Graphs in the future.',
          tags: ['FAANG', 'Reject']
        }
      ];

      await Application.insertMany(sampleApps);
      console.log('✅ Demo applications seeded.');
    }

    // 4. Seed Resume if demo user has none
    const resumeCount = await Resume.countDocuments({ ownerId: demoId });
    if (resumeCount === 0) {
      await Resume.create({
        ownerId: demoId,
        fileName: 'Demo_Resume_2026.pdf',
        fileUrl: '',
        version: 'v1.0',
        textContent: 'Demo Candidate. email: demo@tracker.com. React, TypeScript, Node.js, Express, MongoDB. Build state-of-the-art SaaS tracker and AI tools.',
        isActive: true,
        atsReport: {
          score: 82,
          keywordScore: 78,
          formattingScore: 90,
          grammarScore: 95,
          experienceScore: 75,
          projectsScore: 85,
          skillsScore: 80,
          educationScore: 90,
          leadershipScore: 60,
          impactScore: 70,
          summary: 'Overall a very solid technical resume with clean layouts and strong tech stack coverage. Key areas to improve include adding quantitative impact metrics and filling small gaps in CI/CD pipeline skills.',
          strengths: [
            'Clean layout and structure',
            'Strong TypeScript, React, and Node.js listings',
            'Clear descriptions of side projects and full stack features'
          ],
          weaknesses: [
            'Lack of quantitative achievements (e.g. percentage improvements)',
            'No mention of Docker, CI/CD, or deployment infrastructure',
            'Slightly wordy sentences in experience section'
          ],
          recruiterPerspective: 'Highly skilled full stack developer profile. Good fit for frontend-heavy React/Node.js internships. Needs to highlight speed/performance improvements in past work.',
          atsCompatibility: 'Compatible. Passes common parsers easily. Avoid multi-column text tables to prevent reading order bugs.',
          missingKeywords: ['Docker', 'CI/CD', 'Jest', 'AWS', 'Redis'],
          improvements: [
            { action: "Add metrics to bullets (e.g. 'Improved performance by 25%' or 'Helped 100+ active users')", done: false, priority: 'High' },
            { action: "Include Docker and CI/CD tools in the Skills section", done: false, priority: 'Medium' },
            { action: "Rewrite bio paragraph to be more punchy and active", done: false, priority: 'Low' }
          ],
          redFlags: []
        }
      });
      console.log('✅ Demo resume ATS report seeded.');
    }

    // 5. Seed Logs
    const logCount = await Log.countDocuments();
    if (logCount === 0) {
      await Log.insertMany([
        { ownerId: demoId, action: 'User registered account', category: 'auth', ipAddress: '127.0.0.1' },
        { ownerId: demoId, action: 'Created application: Google', category: 'application', ipAddress: '127.0.0.1' },
        { ownerId: demoId, action: 'Uploaded Resume: Demo_Resume_2026.pdf', category: 'resume', ipAddress: '127.0.0.1' },
        { ownerId: adminId, action: 'System Administrator logged in', category: 'auth', ipAddress: '127.0.0.1' }
      ]);
      console.log('✅ Security audit logs seeded.');
    }

  } catch (error) {
    console.error('❌ Database seeding error:', error);
  }
};
