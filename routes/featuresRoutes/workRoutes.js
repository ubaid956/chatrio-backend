import express from 'express';
import {
  createTask, getGroupTasks,
   getGroupMeetings,
  postIdea, getGroupIdeas,
  addNote, getGroupNotes,
  createPoll, getGroupPolls, votePoll, createMeeting 
} from '../../controllers/features/workController.js';
import { protect } from '../../middleware/auth.js';
const router = express.Router();
router.use(protect);

// Tasks
router.post('/task', protect, createTask);
router.get('/task/:groupId', getGroupTasks);

// Meetings
router.get('/meeting/:groupId', getGroupMeetings);
router.post('/create-meeting', createMeeting)

// Ideas
router.post('/idea', postIdea);
router.get('/idea/:groupId', getGroupIdeas);

// Notes
router.post('/note', addNote);
router.get('/note/:groupId', getGroupNotes);

// Polls
router.post('/poll', createPoll);
router.post('/poll/:pollId/vote', votePoll);
router.get('/poll/', getGroupPolls);

export default router;
