import express from "express";
import { protect } from '../../middleware/auth.js';
import {
    addMultipleItems,
    getShoppingItemsByGroup,
    addBudgetItem,
    getBudgetItems,
    createChore,
    getChoresByGroup,
    toggleChore,
    createEvent,
    getGroupEvents,
    getGroupReminders

} from '../../controllers/features/homeController.js';
const router = express.Router();
router.use(protect);



router.post('/shoppingList', addMultipleItems)
router.get('/shopping/:groupId', getShoppingItemsByGroup)

//Budget
router.post('/addbudget', addBudgetItem)
router.get('/budget/:groupId', getBudgetItems)

//Chore
router.post('/createChore', createChore)
router.get('/chore/:groupId', getChoresByGroup)
router.patch('/toggleChore/:choreId', toggleChore)


//Event Calender
router.post('/createEvent',createEvent)
router.get('/event/:groupId', getGroupEvents)

//get Reminder 
router.get('/reminders/:groupId', getGroupReminders)

export default router