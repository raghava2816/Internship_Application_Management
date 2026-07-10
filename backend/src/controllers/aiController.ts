import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Resume from '../models/Resume';
import Chat from '../models/Chat';
import Log from '../models/Log';
import * as aiService from '../services/aiService';

export const generateCoverLetter = async (req: AuthRequest, res: Response) => {
  const { resumeId, company, role, description } = req.body;
  try {
    const ownerId = req.user?.id;
    let resumeText = '';
    
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, ownerId });
      resumeText = resume?.textContent || '';
    } else {
      const activeResume = await Resume.findOne({ ownerId, isActive: true });
      resumeText = activeResume?.textContent || '';
    }

    const coverLetter = await aiService.generateCoverLetter(resumeText, { company, role, description });
    await Log.create({ ownerId, action: `Generated cover letter for ${company}`, category: 'ai' });

    res.json({ success: true, coverLetter });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate cover letter' });
  }
};

export const getMockQuestions = async (req: AuthRequest, res: Response) => {
  const { role, company } = req.body;
  try {
    const ownerId = req.user?.id;
    const activeResume = await Resume.findOne({ ownerId, isActive: true });
    const resumeText = activeResume?.textContent || '';

    const questions = await aiService.generateMockInterview(role, company, resumeText);
    await Log.create({ ownerId, action: `Generated mock interview questions for ${company} - ${role}`, category: 'ai' });

    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate interview questions' });
  }
};

export const gradeUserAnswer = async (req: AuthRequest, res: Response) => {
  const { question, answer } = req.body;
  try {
    const ownerId = req.user?.id;
    const result = await aiService.gradeAnswer(question, answer);
    
    await Log.create({ ownerId, action: `Graded mock interview response`, category: 'ai' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to evaluate answer' });
  }
};

export const talkToCoach = async (req: AuthRequest, res: Response) => {
  const { messages, chatId, category } = req.body;
  try {
    const ownerId = req.user?.id;
    const activeResume = await Resume.findOne({ ownerId, isActive: true });
    const resumeText = activeResume?.textContent || '';

    // Generate response using OpenAI/Mock
    const coachResponse = await aiService.askCoach(messages, resumeText);

    // Save chat history
    let chat;
    const newMsgPair = [
      { sender: 'user', content: messages[messages.length - 1].content },
      { sender: 'assistant', content: coachResponse }
    ];

    if (chatId) {
      chat = await Chat.findOneAndUpdate(
        { _id: chatId, ownerId },
        { $push: { messages: { $each: newMsgPair } } },
        { new: true }
      );
    } else {
      chat = await Chat.create({
        ownerId,
        title: messages[messages.length - 1].content.substring(0, 30) + '...',
        messages: newMsgPair,
        category: category || 'coach'
      });
    }

    res.json({ success: true, data: chat, responseText: coachResponse });
  } catch (error) {
    // Fallback mode if DB fails
    const mockResponseText = await aiService.askCoach(messages, '');
    res.json({
      success: true,
      responseText: mockResponseText,
      data: {
        _id: chatId || 'chat_fallback',
        title: 'Conversation',
        messages: [
          ...messages,
          { sender: 'assistant', content: mockResponseText, timestamp: new Date() }
        ]
      }
    });
  }
};

export const rewriteResumeText = async (req: AuthRequest, res: Response) => {
  const { section, text, style } = req.body;
  try {
    const ownerId = req.user?.id;
    const result = await aiService.rewriteResumeSection(section, text, style);
    await Log.create({ ownerId, action: `Rewrote resume section: ${section}`, category: 'ai' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to rewrite text' });
  }
};

export const getJobRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.id;
    const activeResume = await Resume.findOne({ ownerId, isActive: true });
    const resumeText = activeResume?.textContent || '';
    const skills = activeResume?.atsReport?.missingKeywords || [];

    const recommendations = aiService.recommendJobs(resumeText, skills);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to recommend jobs' });
  }
};

export const getLinkedInTemplates = async (req: AuthRequest, res: Response) => {
  const { type, company, role, recruiter } = req.body;
  try {
    const message = aiService.generateLinkedInMessage(type, company, role, recruiter);
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate outreach template' });
  }
};
