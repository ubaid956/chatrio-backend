import express from "express";
import {
  createAssignment,
  submitAssignment,
  getSubmissions,
  getAssignmentsByGroup, generateQuiz,getQuizzesByGroup,submitQuiz,getStudyEventsByGroup,
  uploadResource,getResourcesByGroup,getQuizById
} from '../../controllers/features/schoolController.js';
import { protect } from '../../middleware/auth.js';


const router = express.Router();
router.use(protect);




//done
router.post('/assignment', createAssignment);                           // Teacher creates

//Submit Assignment
router.post('/assignment/:assignmentId/submit', submitAssignment);       // Student submits
router.get('/:assignmentId/submissions', getSubmissions); // Teacher views

//done
router.get('/assignment/:groupId', getAssignmentsByGroup);         // All group assignments



router.post('/quiz', generateQuiz);
router.get('/quiz/:groupId', getQuizzesByGroup)

router.get('/fetchquiz/:quizId', getQuizById);

router.post('/quiz/:quizId/submit', submitQuiz)

//events
router.get('/events/:groupId', getStudyEventsByGroup)


//resource 
router.post('/uploadResource/:groupId', uploadResource)
router.get('/resources/:groupId', getResourcesByGroup)



export default router;