import Group from "../models/Group.js";
import User from "../models/User.js";
export const createGroup = async (req, res) => {
  try {
    const { name, type, members } = req.body;

    const group = await Group.create({
      name,
      type,
      members: [...members, req.user._id],
      createdBy: req.user._id,
    });

    // Add group to all members' groups array
    await User.updateMany(
      { _id: { $in: group.members } },
      { $push: { groups: group._id } }
    );

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name pic currentStatus mood')
      .populate('createdBy', 'name pic');

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this new function to your groupController.js
export const getGroupsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user._id;

    // Validate the type parameter
    const validTypes = ['Work', 'Home', 'School', 'Travel'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid group type' });
    }

    // Find groups of the specified type where the user is a member
    const groups = await Group.find({ 
      type,
      members: userId 
    })
    .populate('members', 'name pic currentStatus mood')
    .populate('createdBy', 'name pic');

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setCurrentGroup = async (req, res) => {
  try {
    const { groupId } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { currentGroup: groupId },
      { new: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get users in a specific group
// This function retrieves all users in a group, including their details
export const getGroupUsers = async (req, res) => {
  try {
    const { groupId } = req.params;

     const group = await Group.findById(groupId).populate(
      'members',
      'name pic currentStatus mood email role' // 🟢 added 'role'
    );

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ users: group.members });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
