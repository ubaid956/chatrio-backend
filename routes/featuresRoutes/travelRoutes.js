import express from "express";
import {
  createItinerary,
  getGroupItineraries,
  getItineraryById,
  updateItinerary,
  deleteItinerary,
  createChecklist,
  getChecklistByGroup,
  splitExpense,
  getGroupExpenses,
  markExpenseAsPaid,
  uploadDocument,
  getDocumentsByGroup,
  shareLocation, getGroupLocations, toggleChecklistItemPacked 
} from "../../controllers/features/travelController.js";
import { protect } from '../../middleware/auth.js';


const router = express.Router();
router.use(protect);


// middleware for auth assumed (req.user injected)

// POST /api/travel/itinerary
router.post("/itinerary", createItinerary);

// GET /api/travel/itinerary/group/:groupId
router.get("/itinerary/:groupId", getGroupItineraries);

// GET /api/travel/itinerary/:itineraryId
router.get("/:itineraryId", getItineraryById);

// PUT /api/travel/itinerary/:itineraryId
router.put("/:itineraryId", updateItinerary);

// DELETE /api/travel/itinerary/:itineraryId
router.delete("/:itineraryId", deleteItinerary);


//Travel Checklist
router.post('/checklist', createChecklist);
router.get('/checklist/:groupId', getChecklistByGroup)

//Toggle checklist item packed status
router.put('/:checklistId/:itemId/toggle',toggleChecklistItemPacked);



//expense split 
router.post('/splitepense', splitExpense);
router.get('/splitexpense/:groupId', getGroupExpenses)
router.post('/splitexpense/:expenseId/pay', markExpenseAsPaid)


router.post('/document/:groupId', uploadDocument);
router.get('/document/:groupId', getDocumentsByGroup)


//location share


router.post('/location/:groupId',  shareLocation);
router.get('/location/:groupId', getGroupLocations);


export default router;
