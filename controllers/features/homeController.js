import ShoppingList from "../../models/features/home/shoppingList.model.js";
import Budget from '../../models/features/home/budget.model.js'
import Chore from '../../models/features/home/chore.model.js'
import Event from "../../models/features/home/eventCalender.model.js";
import Reminder from "../../models/features/home/reminder.model.js";

//Shopping List
export const addMultipleItems = async (req, res) => {
  try {
    const { items, groupId } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items must be a non-empty array' });
    }

    const newItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity || '1',
      groupId,
      createdBy: userId,
      isPurchased: false,
    }));

    const savedItems = await ShoppingList.insertMany(newItems);

    res.status(201).json({ message: 'Items added successfully', items: savedItems });
  } catch (error) {
    console.error("Error adding multiple items:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getShoppingItemsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ message: "groupId is required" });
    }

    const items = await ShoppingList.find({ groupId }).sort({ createdAt: -1 });

    if (!items || items.length === 0) {
      return res.status(404).json({ message: "No shopping items found for this group" });
    }

    res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching shopping list items:", error);
    res.status(500).json({ message: "Server error" });
  }
};


//Budget 

export const addBudgetItem = async (req, res) => {
  try {
    const { title, amount, type, category, groupId } = req.body;
    const item = await Budget.create({ title, amount, type, category, groupId, createdBy: req.user._id });
    res.status(201).json({ message: 'Budget item added', item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBudgetItems = async (req, res) => {
  try {
    const items = await Budget.find({ groupId: req.params.groupId }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Chore Check List

export const createChore = async (req, res) => {
  try {
    const { task, assignedTo, dueDate, groupId } = req.body;
    const chore = await Chore.create({ task, assignedTo, dueDate, groupId });
    res.status(201).json({ message: 'Chore created', chore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const getChoresByGroup = async (req, res) => {
//   try {
//     const chores = await Chore.find({ groupId: req.params.groupId });
//     res.status(200).json(chores);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getChoresByGroup = async (req, res) => {
  try {
    const chores = await Chore.find({ groupId: req.params.groupId })
      .populate('assignedTo', 'name pic'); // Populate name and pic only
    res.status(200).json(chores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const toggleChore = async (req, res) => {
  try {
    const chore = await Chore.findById(req.params.choreId);
    chore.isCompleted = !chore.isCompleted;
    await chore.save();
    res.status(200).json({ message: 'Chore status updated', chore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// export const createEvent = async (req, res) => {
//   try {
//     const { title, description, date, groupId, isPersonal } = req.body;

//     const event = await Event.create({
//       title,
//       description,
//       date,
//       groupId,
//       isPersonal,
//       createdBy: req.user._id
//     });

//     res.status(201).json({ message: "Event created successfully", event });
//   } catch (error) {
//     console.error("Error creating event:", error);
//     res.status(500).json({ message: error.message });
//   }
// };


export const createEvent = async (req, res) => {
  try {
    const { title, description, date, groupId, isPersonal } = req.body;

    // Create the event
    const event = await Event.create({
      title,
      description,
      date,
      groupId,
      isPersonal,
      createdBy: req.user._id
    });

    // Automatically create family reminder
    const reminder = await Reminder.create({
      message: `Reminder for event: ${title}`,
      relatedEvent: event._id,
      groupId: groupId,
      createdBy: req.user._id,
      reminderTime: new Date(date), // same as event date/time
    });

    res.status(201).json({
      message: "Event and reminder created successfully",
      event,
      reminder
    });
  } catch (error) {
    console.error("Error creating event/reminder:", error);
    res.status(500).json({ message: error.message });
  }
};
export const getGroupEvents = async (req, res) => {
  try {
    const { groupId } = req.params;
    const events = await Event.find({ groupId }).sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching group events:", error);
    res.status(500).json({ message: error.message });
  }
};


export const getGroupReminders = async (req, res) => {
  try {
    const { groupId } = req.params;

    const reminders = await Reminder.find({ groupId })
      .populate("relatedEvent", "title date")  // Optional: fetch event info
      .populate("createdBy", "name email")     // Optional: fetch user info
      .sort({ reminderTime: 1 });

    res.status(200).json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ message: error.message });
  }
};
