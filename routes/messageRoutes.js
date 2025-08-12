import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getGroupMessages,
    createMessage,
    sendPrivateMessage,
    getPrivateChat,
    getSchoolGroupMessages,
    getHomeGroupMessages,
    getTravelGroupMessages,
    getWorkGroupMessages
} from '../controllers/messageController.js';

const router = express.Router();

router.use(protect);


router.get('/:groupId', getGroupMessages);
// Create Group Message
router.post('/group', createMessage);
router.post('/private', sendPrivateMessage);

router.get('/private/:userId', getPrivateChat);


//route to get School Messages with features
router.get('/:groupId/school', getSchoolGroupMessages)

router.get('/:groupId/home', getHomeGroupMessages);

router.get('/:groupId/travel', getTravelGroupMessages); 

router.get('/:groupId/work', getWorkGroupMessages)

export default router;