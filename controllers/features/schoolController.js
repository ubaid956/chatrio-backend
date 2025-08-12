import Assignment from "../../models/features/school/assignment.model.js";
import Quiz from "../../models/features/school/quiz.model.js";
import StudyEvent from '../../models/features/school/studyEvent.model.js'
import Resource from '../../models/features/school/resource.model.js'
import cloudinary from '../../cloudinaryConfig.js';
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';
import path from 'path';



//Assignments Done
export const createAssignment = async (req, res) => {
    try {
        const { title, description, dueDate, groupId } = req.body;

        // if (req.user.role !== 'teacher') {
        //   return res.status(403).json({ message: 'Only teachers can create assignments' });
        // }

        const assignment = await Assignment.create({
            title,
            description,
            dueDate,
            groupId,
            createdBy: req.user._id
        });

        await StudyEvent.create({
            title: `Assignment: ${title}`,
            description,
            date: dueDate,
            createdBy: req.user._id,
            groupId,
            isPersonal: false
        });

        res.status(201).json({ message: 'Assignment created', assignment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========== Submit Assignment (Student only) ==========

export const submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const file = req.files?.file; // assume file is uploaded as 'file' key
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if already submitted
        const alreadySubmitted = assignment.submissions.some(sub =>
            sub.student.toString() === userId.toString()
        );
        if (alreadySubmitted) {
            return res.status(400).json({ message: 'You have already submitted this assignment' });
        }

        // ✅ Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(file.tempFilePath);

        // ✅ Save submission
        assignment.submissions.push({
            student: userId,
            fileUrl: result.secure_url,
            submittedAt: new Date()
        });

        await assignment.save();

        // res.status(200).json({ message: 'Assignment submitted successfully', fileUrl: result.secure_url });


        res.status(200).json({
            message: "Assignment submitted successfully",
            fileUrl: result.secure_url,
            submittedAt: new Date(),
            student: req.user._id
        });
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ========== Get Submissions for an Assignment (Teacher) ==========
export const getSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await Assignment.findById(assignmentId)
            .populate('submissions.student', 'name email')
            .populate('createdBy', 'name role');

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        if (assignment.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the creator teacher can view submissions' });
        }

        res.status(200).json({ submissions: assignment.submissions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getAssignmentsByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const assignments = await Assignment.find({ groupId })
            .populate('createdBy', 'name pic role') // Now includes pic along with name and role
            .sort({ createdAt: -1 }); // Most recent first



        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// export const generateQuiz = async (req, res) => {
//     console.log("API KEY:", process.env.OPENROUTER_API_KEY);

//     const { topic = "JavaScript", category = "Programming", numQuestions = 5, groupId } = req.body;

//     if (!groupId) {
//         return res.status(400).json({ message: "groupId is required" });
//     }

//     const prompt = `Generate ${numQuestions} multiple choice questions about ${topic}. Each should have 4 options and a correct answer. Return as a JSON array with keys: question, options, correctAnswer.`;

//     try {
//         const response = await axios.post(
//             'https://openrouter.ai/api/v1/chat/completions',
//             {
//                 model: "openrouter/cypher-alpha:free",
//                 messages: [
//                     { role: "user", content: prompt }
//                 ]
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//                     'Content-Type': 'application/json',
//                     'HTTP-Referer': 'http://localhost:3000', // update this if you're testing on a different port
//                     'X-Title': 'QuizGenerator'
//                 }
//             }
//         );


//         const content = response.data.choices[0].message.content;

//         // Safely parse JSON
//         let questions;
//         try {
//             const cleaned = content
//                 .replace(/```json/g, '')
//                 .replace(/```/g, '')
//                 .trim();

//             questions = JSON.parse(cleaned);
//         } catch (parseErr) {
//             console.error("Invalid JSON format:", content);
//             return res.status(500).json({ message: "Failed to parse quiz from LLM", raw: content });
//         }


//         const quiz = await Quiz.create({
//             title: `${topic} Quiz`,
//             category,
//             groupId,
//             questions,
//         });

//         await StudyEvent.create({
//             title: `Quiz: ${topic}`,
//             description: `${numQuestions} questions quiz on ${topic}`,
//             date: new Date(), // Current date/time as quiz doesn't have due date
//             createdBy: req.user._id,
//             groupId,
//             isPersonal: false
//         });

//         res.status(201).json({ message: "Quiz generated from OpenRouter", quiz });
//     } catch (err) {
//         console.error("Error from OpenRouter:", err.response?.data || err.message);
//         res.status(500).json({
//             message: "Quiz generation failed",
//             error: err.response?.data?.error || err.message
//         });
//     }
// };

// export const getQuizzesByGroup = async (req, res) => {
//     const { groupId } = req.params;

//     try {
//         const quizzes = await Quiz.find({ groupId }).sort({ createdAt: -1 });

//         if (!quizzes || quizzes.length === 0) {
//             return res.status(404).json({ message: "No quizzes found for this group" });
//         }

//         res.status(200).json(quizzes);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

export const generateQuiz = async (req, res) => {
    console.log("API KEY:", process.env.OPENROUTER_API_KEY);

    const { topic = "JavaScript", category = "Programming", numQuestions = 5, groupId } = req.body;

    if (!groupId) {
        return res.status(400).json({ message: "groupId is required" });
    }

    if (!req.user?._id) {
        return res.status(400).json({ message: "User authentication required" });
    }

    const prompt = `Generate ${numQuestions} multiple choice questions about ${topic}. Each should have 4 options and a correct answer. Return as a JSON array with keys: question, options, correctAnswer. Format should be valid JSON without any extra text.`;

    try {
        // Generate quiz questions using AI
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "mistralai/mistral-7b-instruct:free",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" } // Ensures JSON output
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'QuizGenerator'
                }
            }
        );

        // Parse the generated content
        const content = response.data.choices[0].message.content;
        let questions;

        try {
            const cleaned = content
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            const parsed = JSON.parse(cleaned);
            // Handle both direct array and object with questions property
            questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
        } catch (parseErr) {
            console.error("Invalid JSON format:", content);
            return res.status(500).json({
                message: "Failed to parse quiz from LLM",
                raw: content
            });
        }

        // Validate questions
        if (!Array.isArray(questions)) {
            return res.status(500).json({
                message: "Generated questions are not in array format",
                raw: content
            });
        }

        // Create the quiz with creator information
        const quiz = await Quiz.create({
            title: `${topic} Quiz`,
            category,
            groupId,
            questions,
            createdBy: req.user._id // Add creator reference
        });

        // Create associated study event
        await StudyEvent.create({
            title: `Quiz: ${topic}`,
            description: `${numQuestions} questions quiz on ${topic}`,
            date: new Date(),
            createdBy: req.user._id,
            groupId,
            isPersonal: false
        });

        // Populate creator info in the response
        const populatedQuiz = await Quiz.findById(quiz._id)
            .populate('createdBy', 'name pic role');

        res.status(201).json({
            message: "Quiz generated successfully",
            quiz: {
                _id: populatedQuiz._id,
                title: populatedQuiz.title,
                category: populatedQuiz.category,
                questionCount: populatedQuiz.questions.length,
                createdBy: {
                    _id: populatedQuiz.createdBy._id,
                    name: populatedQuiz.createdBy.name,
                    pic: populatedQuiz.createdBy.pic,
                    role: populatedQuiz.createdBy.role
                },
                createdAt: populatedQuiz.createdAt,
                time: populatedQuiz.createdAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            }
        });
    } catch (err) {
        console.error("Error generating quiz:", err.response?.data || err.message);
        res.status(500).json({
            message: "Quiz generation failed",
            error: err.response?.data?.error || err.message
        });
    }
};
export const getQuizzesByGroup = async (req, res) => {
    const { groupId } = req.params;

    try {
        const quizzes = await Quiz.find({ groupId })
            .populate('createdBy', 'name pic') // Populate creator info
            .populate('submissions.student', 'name pic') // Populate student info in submissions
            .sort({ createdAt: -1 });

        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({ message: "No quizzes found for this group" });
        }

        res.status(200).json(quizzes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



export const submitQuiz = async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user._id;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers must be an array" });
    }

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // ✅ Prevent duplicate submission
        const alreadySubmitted = quiz.submissions.find(
            (sub) => sub.student.toString() === userId.toString()
        );
        if (alreadySubmitted) {
            return res.status(400).json({ message: "You have already submitted this quiz" });
        }

        let score = 0;
        const results = [];

        quiz.questions.forEach((question, index) => {
            const userAnswer = answers.find(a => a.questionIndex === index);
            const isCorrect = userAnswer && question.correctAnswer === userAnswer.selectedOption;

            if (isCorrect) score++;

            results.push({
                question: question.question,
                selectedAnswer: userAnswer?.selectedOption || null,
                correctAnswer: question.correctAnswer,
                isCorrect
            });
        });

        // ✅ Store the submission in quiz.submissions
        quiz.submissions.push({
            student: userId,
            answers: results,
            score,
            total: quiz.questions.length,
            submittedAt: new Date()
        });

        await quiz.save();

        res.status(200).json({
            message: "Quiz submitted successfully",
            score,
            total: quiz.questions.length,
            results
        });
    } catch (error) {
        console.error("Error submitting quiz:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getQuizById = async (req, res) => {
    const { quizId } = req.params;

    try {
        const quiz = await Quiz.findById(quizId)
            .populate('createdBy', 'name pic role') // include creator info
            .populate('submissions.student', 'name pic'); // include student info in submissions

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.status(200).json({
            message: 'Quiz fetched successfully',
            quiz,
        });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


export const getStudyEventsByGroup = async (req, res) => {
    const { groupId } = req.params;

    try {
        const events = await StudyEvent.find({ groupId }).sort({ date: 1 });

        if (!events || events.length === 0) {
            return res.status(404).json({ message: "No study events found for this group" });
        }

        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching study events:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// export const uploadResource = async (req, res) => {
//   try {
//     const { title } = req.body;
//     const { groupId } = req.params;
//     const file = req.files?.file;
//     const userId = req.user._id;

//     if (!file || !groupId || !title) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Upload file to Cloudinary
//     const result = await cloudinary.uploader.upload(file.tempFilePath, {
//       resource_type: "auto"
//     });

//     // Determine file type
//     const fileType = file.mimetype.includes("pdf") ? "pdf" :
//                     file.mimetype.includes("image") ? "image" :
//                     file.mimetype.includes("word") ? "doc" :
//                     file.mimetype.includes("video") ? "video" : "other";

//     // Create resource
//     const resource = await Resource.create({
//       title,
//       fileUrl: result.secure_url,
//       fileType,
//       createdBy: userId,
//       groupId
//     });

//     // Populate the uploadedBy field with user details
//     const populatedResource = await Resource.findById(resource._id)
//       .populate('createdBy', 'name pic role');

//     // Format the response
//     const response = {
//       _id: populatedResource._id,
//       title: populatedResource.title,
//       fileUrl: populatedResource.fileUrl,
//       fileType: populatedResource.fileType,
//       createdAt: populatedResource.createdAt,
//       time: populatedResource.createdAt.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       }),
//       createdBy: {
//         _id: populatedResource.createdBy._id,
//         name: populatedResource.createdBy.name,
//         pic: populatedResource.createdBy.pic,
//         role: populatedResource.createdBy.role
//       },
//       groupId: populatedResource.groupId
//     };

//     res.status(201).json({ 
//       message: 'Resource uploaded successfully', 
//       resource: response 
//     });

//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ 
//       message: 'Server error', 
//       error: err.message 
//     });
//   }
// };


export const uploadResource = async (req, res) => {
    try {
        const file = req.files?.file;
        const { title } = req.body;
        const { groupId } = req.params;
        const userId = req.user?.id || req.user?._id; // assuming authentication middleware sets req.user

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
        let fileType = 'other';

        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            resourceType = 'image';
            fileType = 'image';
        } else if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
            resourceType = 'video';
            fileType = 'video';
        } else if (['.pdf'].includes(ext)) {
            fileType = 'pdf';
        } else if (['.doc', '.docx'].includes(ext)) {
            fileType = 'doc';
        }

        // Create unique filename with extension
        const uniqueFileName = `${baseName}_${uuidv4()}${ext}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: 'travel_docs',
            resource_type: resourceType,
            public_id: uniqueFileName,
            type: 'upload'
        });

        // Save to DB
        const resource = await Resource.create({
            title,
            fileUrl: result.secure_url,
            fileType,
            createdBy: userId,
            groupId
        });

        const populatedResource = await Resource.findById(resource._id)
            .populate('createdBy', 'name pic role');

        const response = {
            _id: populatedResource._id,
            title: populatedResource.title,
            fileUrl: populatedResource.fileUrl,
            fileType: populatedResource.fileType,
            createdAt: populatedResource.createdAt,
            time: populatedResource.createdAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
            createdBy: {
                _id: populatedResource.createdBy._id,
                name: populatedResource.createdBy.name,
                pic: populatedResource.createdBy.pic,
                role: populatedResource.createdBy.role
            },
            groupId: populatedResource.groupId
        };

        res.status(201).json({
            message: 'Resource uploaded successfully',
            resource: response
        });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};



export const getResourcesByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const resources = await Resource.find({ groupId })
            .populate('createdBy', 'name pic role')
            .sort({ createdAt: -1 });

        const formattedResources = resources.map(resource => ({
            _id: resource._id,
            title: resource.title,
            fileUrl: resource.fileUrl,
            fileType: resource.fileType,
            createdBy: {
                _id: resource.createdBy._id,
                name: resource.createdBy.name,
                pic: resource.createdBy.pic,
                role: resource.createdBy.role
            },
            createdAt: resource.createdAt,
            time: resource.createdAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })
        }));

        res.status(200).json(formattedResources);
    } catch (err) {
        res.status(500).json({
            message: 'Error fetching resources',
            error: err.message
        });
    }
};