import { Router } from 'express';
import multer from 'multer';
import { 
  getResumes, 
  uploadResume, 
  setActiveResume, 
  deleteResume,
  updateResumeChecklist,
  analyzeResumeAgainstJD
} from '../controllers/resumeController';
import { protect } from '../middleware/authMiddleware';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(protect);

router.get('/', getResumes);
router.post('/upload', upload.single('file'), uploadResume);
router.put('/:id/active', setActiveResume);
router.put('/:id/checklist', updateResumeChecklist);
router.post('/:id/analyze', analyzeResumeAgainstJD);
router.delete('/:id', deleteResume);

export default router;
