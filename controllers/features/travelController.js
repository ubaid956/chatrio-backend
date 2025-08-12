import Itinerary from "../../models/features/travel/itinerary.model.js";
import TravelChecklist from "../../models/features/travel/travelChecklist.model.js";
import Expense from "../../models/features/travel/expenseSplit.model.js";
import TravelDocument from "../../models/features/travel/documentVault.model.js";
import cloudinary from '../../cloudinaryConfig.js';
import LocationShare from "../../models/features/travel/locationShare.model.js";
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // for unique file naming
// Create a new itinerary
export const createItinerary = async (req, res) => {
  try {
    const {
      title,
      description,
      route,
      destinations,
      times,
      transportation,
      accommodations,
      groupId
    } = req.body;

    const itinerary = await Itinerary.create({
      title,
      description,
      route,
      destinations,
      times,
      transportation,
      accommodations,
      groupId,
      sender: req.user._id
    });

    res.status(201).json({ message: "Itinerary created successfully", itinerary });
  } catch (error) {
    console.error("Error creating itinerary:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all itineraries for a group
export const getGroupItineraries = async (req, res) => {
  try {
    const { groupId } = req.params;
    const itineraries = await Itinerary.find({ groupId }).sort({ createdAt: -1 });
    res.status(200).json(itineraries);
  } catch (error) {
    console.error("Error fetching itineraries:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single itinerary by ID
export const getItineraryById = async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }
    res.status(200).json(itinerary);
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update itinerary
export const updateItinerary = async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const updates = req.body;

    const updatedItinerary = await Itinerary.findByIdAndUpdate(
      itineraryId,
      updates,
      { new: true }
    );

    if (!updatedItinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    res.status(200).json({ message: "Itinerary updated", itinerary: updatedItinerary });
  } catch (error) {
    console.error("Error updating itinerary:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete itinerary
export const deleteItinerary = async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const deleted = await Itinerary.findByIdAndDelete(itineraryId);

    if (!deleted) {
      return res.status(404).json({ message: "Itinerary not found" });
    }

    res.status(200).json({ message: "Itinerary deleted successfully" });
  } catch (error) {
    console.error("Error deleting itinerary:", error);
    res.status(500).json({ message: error.message });
  }
};


//Travel Check List
export const createChecklist = async (req, res) => {
  try {
    const { groupId, destination, travelDate, items } = req.body;
   

    if (!destination || !travelDate?.from || !travelDate?.to || !Array.isArray(items)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const checklist = await TravelChecklist.create({
      groupId,
      destination,
      travelDate,
      items,
      sender: req.user._id
    });

    res.status(201).json({ message: "Checklist created successfully", checklist });
  } catch (error) {
    console.error("Error creating checklist:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getChecklistByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const checklists = await TravelChecklist.find({ groupId }).sort({ createdAt: -1 });

    res.status(200).json(checklists);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleChecklistItemPacked = async (req, res) => {
  try {
    const { checklistId, itemId } = req.params;
    const checklist = await TravelChecklist.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist not found" });
    }

    const item = checklist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in checklist" });
    }

    // Toggle packed state
    item.isPacked = !item.isPacked;
    await checklist.save();

    res.status(200).json({
      message: `Item ${item.name} marked as ${item.isPacked ? "packed" : "unpacked"}`,
      updatedItem: item,
    });
  } catch (err) {
    console.error("Error updating item:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const splitExpense = async (req, res) => {
  try {
    const { title, amount, sharedWith, groupId } = req.body;
    const paidBy = req.user._id;

    const expense = await Expense.create({ title, amount, paidBy, sharedWith, groupId , sender: req.user._id  });
    res.status(201).json({ message: "Expense recorded", expense });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGroupExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.groupId })
      .populate("paidBy", "name")
      .populate("sharedWith", "name");
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markExpenseAsPaid = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user._id;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if the user is in sharedWith
    if (!expense.sharedWith.includes(userId)) {
      return res.status(403).json({ message: "You are not part of this shared expense" });
    }

    // Check if already marked as paid
    if (expense.paidByUsers.includes(userId)) {
      return res.status(400).json({ message: "You have already marked this as paid" });
    }

    // Mark as paid
    expense.paidByUsers.push(userId);
    await expense.save();

    res.status(200).json({ message: "Marked as paid", expense });
  } catch (err) {
    console.error("Error marking expense as paid:", err);
    res.status(500).json({ message: err.message });
  }
};


//Document Vault
// export const uploadDocument = async (req, res) => {
//   try {
//     const file = req.files?.file;
//     const { title } = req.body;
//     const { groupId } = req.params;
//     if (!file) return res.status(400).json({ message: 'File is required' });

//     // const result = await cloudinary.uploader.upload(file.tempFilePath, { folder: 'travel_docs' });
//     // const result = await cloudinary.uploader.upload(file.tempFilePath, {
//     //   folder: 'travel_docs',
//     //   resource_type: 'auto' // or use 'raw' for documents like PDF, DOCX etc.
//     // });

//     const result = await cloudinary.uploader.upload(file.tempFilePath, {
//       folder: 'travel_docs',
//       resource_type: 'raw' // 👈 IMPORTANT for non-image files
//     });



//     const document = await TravelDocument.create({
//       title,
//       fileUrl: result.secure_url,
//       groupId,
//       uploadedBy: req.user._id
//     });

//     res.status(201).json({ message: "Document uploaded", document });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


export const uploadDocument = async (req, res) => {
  try {
    const file = req.files?.file;
    const { title } = req.body;
    const { groupId } = req.params;

    if (!file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Extract extension and base name
    const ext = path.extname(file.name).toLowerCase();
    const baseName = path.basename(file.name, ext).replace(/\s+/g, '_');

    if (!ext) {
      return res.status(400).json({ message: 'File must have an extension.' });
    }

    // Determine Cloudinary resource type
    let resourceType = 'raw';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      resourceType = 'image';
    } else if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
      resourceType = 'video';
    }

    // Create unique filename with extension
    const uniqueFileName = `${baseName}_${uuidv4()}${ext}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'travel_docs',
      resource_type: resourceType,
      public_id: uniqueFileName,
      type: 'upload' // Ensures raw files are public
    });

    // Save to DB
    const document = await TravelDocument.create({
      title,
      fileUrl: result.secure_url,
      groupId,
      sender: req.user._id
    });

    res.status(201).json({ message: 'Document uploaded', document });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

export const getDocumentsByGroup = async (req, res) => {
  try {
    const docs = await TravelDocument.find({ groupId: req.params.groupId });
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Location Share
export const shareLocation = async (req, res) => {
  try {
    const { lat, lng, locationName, message } = req.body;
    const { groupId } = req.params;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const location = await LocationShare.create({
      sender: req.user._id,
      groupId,
      coordinates: { lat, lng },
      locationName,
      message
    });

    res.status(201).json({ message: "Location shared successfully", location });
  } catch (error) {
    console.error("Error sharing location:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getGroupLocations = async (req, res) => {
  try {
    const { groupId } = req.params;

    const locations = await LocationShare.find({ groupId })
      .populate("user", "name email")
      .sort({ sharedAt: -1 });

    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: error.message });
  }
};