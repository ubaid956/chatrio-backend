
import Meeting from '../../models/features/work/meeting.model.js';
import Task from '../../models/features/work/task.model.js';
import Idea from '../../models/features/work/idea.model.js';
import Note from '../../models/features/work/note.model.js';
import Poll from '../../models/features/work/poll.model.js';
import Group from '../../models/Group.js';
import { google } from 'googleapis';
import oauth2Client from '../../utils/googleAuth.js';
import axios from 'axios';
import { generateZoomAccessToken } from '../../utils/zoomAuth.js';


// Tasks

export const createTask = async (req, res) => {
  try {
    const { groupId, title, description, status, startTime, endTime } = req.body;
    const userId = req.user._id;

    // 1. Validate group and user membership
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // 2. Check if user is in group members
    const isMember = group.members.includes(userId);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // 3. Create task
    const task = await Task.create({
      groupId,
      title,
      description,
      status,
      startTime,
      endTime,
      sender: req.user._id
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupTasks = async (req, res) => {
  try {
    const { groupId } = req.params;
    const tasks = await Task.find({ groupId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Meetings
export const scheduleMeeting = async (req, res) => {
  try {
    const { groupId, title, scheduledAt, attendees } = req.body;
    const meeting = await Meeting.create({ groupId, title, scheduledAt, attendees, sender: req.user._id});
    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const createGoogleMeet = async (req, res) => {
  const { accessToken, title, startTime, endTime, attendees } = req.body;

  try {
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: title,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        attendees: attendees.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      },
    });

    const meetLink = response.data.hangoutLink;
    return res.status(200).json({ meetLink });
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    return res.status(500).json({ message: 'Failed to create meeting.' });
  }
};


export const createMeeting = async (req, res) => {
  const { topic, startTime, duration , groupId} = req.body;

  try {
    const accessToken = await generateZoomAccessToken();

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic,
        type: 2,
        start_time: startTime,
        duration,
        settings: {
          host_video: true,
          participant_video: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const zoomData = response.data;

    // ✅ Save to MongoDB
    const newMeeting = await Meeting.create({
      topic,
      start_time: zoomData.start_time,
      duration: zoomData.duration,
      join_url: zoomData.join_url,
      meeting_id: zoomData.id,
      sender: req.user?._id,
      groupId: groupId
    });

    res.status(200).json(newMeeting);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to create Zoom meeting' });
  }
};


export const getGroupMeetings = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Fetch meetings for this group
    const meetings = await Meeting.find({ groupId }).populate('sender', 'name email'); // populate sender details

    // Fetch group members
    const group = await Group.findById(groupId).populate('members', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({
      meetings,
      members: group.members,
    });

  } catch (error) {
    console.error('Error fetching group meetings:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Ideas
export const postIdea = async (req, res) => {
  try {
    const { groupId, content, title  } = req.body;
    const idea = await Idea.create({ groupId, content, sender: req.user._id, title });
    res.status(201).json(idea);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupIdeas = async (req, res) => {
  try {
    const { groupId } = req.params;
    const ideas = await Idea.find({ groupId });
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Notes
export const addNote = async (req, res) => {
  try {
    const { groupId, title, content } = req.body;
    const note = await Note.create({ groupId, title, content, sender: req.user._id });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupNotes = async (req, res) => {
  try {
    const { groupId } = req.params;
    const notes = await Note.find({ groupId });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Polls
// export const createPoll = async (req, res) => {
//   try {
//     const { groupId, question, options } = req.body;
//     const sender = req.user._id;

//     // Find group and check if user is a member
//     const group = await Group.findById(groupId);
//     if (!group) return res.status(404).json({ message: "Group not found" });

//     const isMember = group.members.includes(sender.toString());
//     if (!isMember) {
//       return res.status(403).json({ message: "Only group members can create polls" });
//     }

//     const poll = await Poll.create({ groupId, question, options, sender });
//     res.status(201).json(poll);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


export const createPoll = async (req, res) => {
  try {
    const { groupId, question, options } = req.body;
    const sender = req.user._id;

    // Validate input
    if (!groupId || !question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Invalid poll data. At least 2 options required." });
    }

    // Find group and check if user is a member
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember = group.members.includes(sender.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Only group members can create polls" });
    }

    // Create poll
    const poll = await Poll.create({ groupId, question, options, sender });
    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//Vote on Poll
// export const votePoll = async (req, res) => {
//   try {
//     const { pollId } = req.params;
//     const { optionIndex } = req.body;
//     const userId = req.user._id;

//     const poll = await Poll.findById(pollId);
//     if (!poll) return res.status(404).json({ message: "Poll not found" });

//     const group = await Group.findById(poll.groupId);
//     if (!group) return res.status(404).json({ message: "Group not found" });

//     const isMember = group.members.includes(userId.toString());
//     if (!isMember) {
//       return res.status(403).json({ message: "Only group members can vote" });
//     }

//     const hasVoted = poll.votes.find(v => v.user.toString() === userId.toString());
//     if (hasVoted) {
//       return res.status(400).json({ message: "You have already voted" });
//     }

//     poll.votes.push({ user: userId, optionIndex });
//     await poll.save();
//     res.status(200).json({ message: "Vote submitted", poll });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    // Validate input
    if (typeof optionIndex !== 'number' || optionIndex < 0) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    // Find poll and ensure sender exists
    const poll = await Poll.findById(pollId).lean();
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (!poll.sender) {
      return res.status(400).json({
        message: "This poll is invalid (missing creator)",
        success: false
      });
    }

    // Validate option index
    if (optionIndex >= poll.options.length) {
      return res.status(400).json({ message: "Invalid option index" });
    }

    // Check group membership
    const group = await Group.findById(poll.groupId);
    if (!group || !group.members.includes(userId.toString())) {
      return res.status(403).json({ message: "Only group members can vote" });
    }

    // Check for existing vote
    const hasVoted = poll.votes.some(v => v.user.toString() === userId.toString());
    if (hasVoted) {
      return res.status(400).json({ message: "You have already voted" });
    }

    // Add vote without triggering full validation
    const updatedPoll = await Poll.findOneAndUpdate(
      { _id: pollId },
      {
        $push: {
          votes: {
            user: userId,
            optionIndex
          }
        }
      },
      { new: true, runValidators: false } // Skip validation
    );

    if (!updatedPoll) {
      return res.status(500).json({ message: "Failed to update poll" });
    }

    res.status(200).json({
      success: true,
      message: "Vote submitted successfully",
      updatedPoll
    });
  } catch (error) {
    console.error("Voting error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};
export const getGroupPolls = async (req, res) => {
  try {
    const { groupId } = req.params;
    const polls = await Poll.find({ groupId });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};