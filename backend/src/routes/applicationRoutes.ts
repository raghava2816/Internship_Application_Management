import { Router } from 'express';
import { 
  getApplications, 
  getApplicationById, 
  createApplication, 
  updateApplication, 
  deleteApplication, 
  exportApplicationsCSV 
} from '../controllers/applicationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getApplications);
router.get('/export-csv', exportApplicationsCSV);
router.get('/:id', getApplicationById);
router.post('/', createApplication);
router.put('/:id', updateApplication);
router.delete('/:id', deleteApplication);

export default router;
