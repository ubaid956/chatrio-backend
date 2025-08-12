import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createGroup,
  getUserGroups,
  setCurrentGroup,
  getGroupsByType,
  getGroupUsers 
} from '../controllers/groupController.js';

const router = express.Router();

router.use(protect);

router.post('/', createGroup);
router.get('/', getUserGroups);
router.get('/:type', getGroupsByType);
router.put('/current', setCurrentGroup);
router.get('/:groupId/users', getGroupUsers);

export default router;