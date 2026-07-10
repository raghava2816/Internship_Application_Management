import { Router } from 'express';
import { 
  generateCoverLetter, 
  getMockQuestions, 
  gradeUserAnswer, 
  talkToCoach, 
  rewriteResumeText, 
  getJobRecommendations, 
  getLinkedInTemplates 
} from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/cover-letter', generateCoverLetter);
router.post('/interview-questions', getMockQuestions);
router.post('/interview-grade', gradeUserAnswer);
router.post('/coach-chat', talkToCoach);
router.post('/rewrite-resume', rewriteResumeText);
router.get('/job-recommendations', getJobRecommendations);
router.post('/linkedin-templates', getLinkedInTemplates);

export default router;
