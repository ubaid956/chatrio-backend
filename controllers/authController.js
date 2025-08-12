import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendMail from '../utils/sendmail.js';
import Message from '../models/Message.js';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

import sendOTPViaSMS from '../utils/sendSMS.js'
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

import cloudinary from '../cloudinaryConfig.js';
const otpStore = {};

// @desc    Register new user
// export const register = async (req, res) => {
//   try {
//     const { name, email, password, phone } = req.body;

//     const userExists = await User.findOne({ phone });
//     if (userExists) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       phone
//     });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '30d',
//     });

//     res.status(201).json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       pic: user.pic,
//       token,

//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role === 'teacher' ? 'teacher' : 'student' // ✅ Role check
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      pic: user.pic,
      role: user.role, // ✅ Include role in response
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Authenticate user

// Login with phone and password working perfectly 
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ phone }).select('+password'); // Explicitly select password
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // 2. Compare passwords (ensure password is not undefined)
    if (!password || !user.password) {
      return res.status(400).json({ message: 'Password missing' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // 4. Return response (exclude password)
    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.json({
      ...userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};


//Login works with firebase phone auth 

// export const login = async (req, res) => {
//   try {
//     const { phone, password, firebaseToken } = req.body;

//     // 1. Check if user exists
//     const user = await User.findOne({ phone });
//     if (!user) {
//       return res.status(400).json({ message: 'User not found' });
//     }

//     // 2. Handle Firebase phone authentication
//     if (firebaseToken) {
//       // Verify Firebase token (you'll need to implement this)
//       const firebaseUser = await verifyFirebaseToken(firebaseToken);

//       if (!firebaseUser || firebaseUser.phone_number !== `+${phone}`) {
//         return res.status(400).json({ message: 'Firebase verification failed' });
//       }

//       // Firebase verification successful - proceed to generate token
//     } 
//     // 3. Handle password authentication (existing flow)
//     else if (password) {
//       if (!user.password) {
//         return res.status(400).json({ message: 'Password not set for this user' });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: 'Invalid credentials' });
//       }
//     } else {
//       return res.status(400).json({ message: 'Authentication method required' });
//     }

//     // 4. Generate token (common for both methods)
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '30d',
//     });

//     // 5. Return response (exclude password)
//     const userWithoutPassword = user.toObject();
//     delete userWithoutPassword.password;

//     res.json({
//       ...userWithoutPassword,
//       token,
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// Helper function to verify Firebase token
// async function verifyFirebaseToken(idToken) {
//   const auth = getAuth();
//   try {
//     const decodedToken = await auth.verifyIdToken(idToken);
//     return decodedToken;
//   } catch (error) {
//     console.error('Firebase token verification error:', error);
//     return null;
//   }
// }



// export const googleSignIn = async (req, res) => {
//   const { token } = req.body;

//   try {
//     // 1. Verify the token with Google
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const { email, name, picture, sub: googleId } = payload;

//     // 2. Find or create the user in your database
//     let user = await User.findOne({ email });

//     if (!user) {
//       user = await User.create({
//         name,
//         email,
//         pic: picture, // change avatar to pic
//         googleId,
//         authType: 'google',
//         password: 'google_auth', // just to satisfy required field, won't be used
//       });
//     }


//     // 3. Create your own app's JWT
//     const appToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     // 4. Respond with your JWT and user info
//     res.status(200).json({
//       token: appToken,
//       user,
//     });

//   } catch (err) {
//     console.error('Google Sign-In Error:', err);
//     res.status(401).json({ message: 'Google authentication failed' });
//   }
// };

//Working for web
export const googleSignIn = async (req, res) => {
  const { token } = req.body;

  try {
    // 1. Use access token to get user info from Google
    const googleUserRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const { email, name, picture, id: googleId } = googleUserRes.data;

    // 2. Find or create the user in your database
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        pic: picture,
        googleId,
        authType: 'google',
        password: 'google_auth', // just to satisfy required field
      });
    }

    // 3. Generate JWT for your app
    const appToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // 4. Respond with your token and user info
    res.status(200).json({
      token: appToken,
      user,
    });

  } catch (err) {
    console.error('Google Sign-In Error:', err?.response?.data || err.message);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Get the logged-in user's ID from the request (assuming you have auth middleware)
    const loggedInUserId = req.user._id;

    // Fetch users excluding passwords and the logged-in user
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');

    // Use Promise.all to add lastPreviewMessage and lastPreviewTime for each user
    const usersWithMessages = await Promise.all(
      users.map(async (user) => {
        // Find the last private message between the logged-in user and this user
        const lastPrivateMessage = await Message.findOne({
          isPrivate: true,
          $or: [
            { sender: loggedInUserId, recipient: user._id },
            { sender: user._id, recipient: loggedInUserId }
          ]
        })
          .sort({ createdAt: -1 })
          .select('text createdAt')
          .lean();

        // Format createdAt to "h:mm AM/PM"
        const formatTime = (date) => {
          if (!date) return null;
          return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        };

        return {
          ...user.toObject(),
          lastPreviewMessage: lastPrivateMessage?.text || null,
          lastPreviewTime: formatTime(lastPrivateMessage?.createdAt) || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithMessages.length,
      data: usersWithMessages
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

// export const getUserById = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     // Fetch user without password
//     const user = await User.findById(userId).select('-password');

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     res.status(200).json({
//       success: true,
//       data: user
//     });
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching user',
//       error: error.message
//     });
//   }
// };


// Get user by id and all the private chats bw logged in user and specific user 
export const getUserById = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const loggedInUserId = req.user._id; // Assuming you have auth middleware

    // Fetch user without password
    const user = await User.findById(targetUserId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch all messages between logged-in user and target user
    const messages = await Message.find({
      isPrivate: true,
      $or: [
        { sender: loggedInUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: loggedInUserId }
      ]
    })
      .sort({ createdAt: 1 }) // Sort by oldest first (use -1 for newest first)
      .select('text createdAt sender')
      .lean();

    // Format messages with additional info
    const formattedMessages = messages.map(message => ({
      text: message.text,
      time: new Date(message.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      date: new Date(message.createdAt).toLocaleDateString(),
      isSentByMe: message.sender.toString() === loggedInUserId.toString()
    }));

    res.status(200).json({
      success: true,
      data: {
        user,
        messages: formattedMessages
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

export const emailVerify = async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });

    if (!oldUser) {
      return res.status(404).json({
        error: true,
        message: "This email is not registered in our app. Please sign up first."
      });
    }

    const code = Math.floor(10000 + Math.random() * 90000).toString(); // Always 5 digits
    oldUser.otp = code;
    oldUser.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    await oldUser.save();

    const mailOptions = {
      from: {
        name: 'Trady Way',
        address: process.env.USER,
      },
      to: email,
      subject: "FORGOT PASSWORD",
      text: `Your verification code is ${code}. This code will expire in 5 minutes.`,
      html: `
        <html>
          <body>
            <p>Your verification code is:</p>
            <h2>${code}</h2>
            <p>This code will expire in <strong>5 minutes</strong>.</p>
          </body>
        </html>
      `,
    };

    await sendMail(mailOptions);

    return res.status(200).json({
      message: "OTP sent successfully. This OTP will expire in 5 minutes.",
      user: oldUser
    });
  } catch (error) {
    console.error("Error in emailVerify:", error);
    return res.status(500).json({ message: "Something went wrong while processing your request." });
  }
};



export const verifyOtp = async (req, res) => {
  const { OTP } = req.body;

  try {
    if (!OTP) {
      return res.status(400).json({ error: true, message: "OTP is required" });
    }

    // Find user by OTP
    const user = await User.findOne({ otp: OTP });

    if (!user) {
      return res.status(404).json({ error: true, message: "Invalid OTP or user not found" });
    }

    if (user.isOtpExpired()) {
      return res.status(400).json({ error: true, message: "OTP has expired" });
    }

    // Optionally, you could mark the OTP as "verified"
    // or set a temporary token to allow password update

    return res.status(200).json({
      message: "OTP verified successfully",
      userId: user._id // or generate a session token
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
  }
};




// export const sendOtp = async (req, res) => {
//   const { phone } = req.body;
//   const { purpose } = req.query;

//   if (!phone) {
//     return res.status(400).json({ error: true, message: "Phone number is required" });
//   }

//   try {
//     const otp = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit OTP
//     const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 mins

//     const existingUser = await User.findOne({ phone });

//     if (purpose === 'login') {
//       if (!existingUser) {
//         return res.status(404).json({ error: true, message: "User not found. Please sign up first." });
//       }

//       existingUser.otp = otp;
//       existingUser.otpExpiresAt = otpExpiresAt;
//       await existingUser.save();

//       await sendOTPViaSMS(phone, otp);

//       return res.status(200).json({ message: "OTP sent to phone number for login" });
//     }

//     if (purpose === 'signup') {
//       if (existingUser) {
//         return res.status(400).json({ error: true, message: "Phone number already registered" });
//       }

//       // Send OTP only (do not create user yet)
//       await sendOTPViaSMS(phone, otp);

//       // You could store OTP in a temporary collection or cache like Redis
//       return res.status(200).json({ message: "OTP sent to phone number for signup" });
//     }

//     return res.status(400).json({ error: true, message: "Invalid purpose. Must be 'login' or 'signup'" });

//   } catch (err) {
//     return res.status(500).json({ error: true, message: "Failed to send OTP", details: err.message });
//   }
// };
export const sendOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Use your utility function to send SMS
    await sendOTPViaSMS(phone, otp);

    // Store OTP and expiry time (5 mins)
    otpStore[phone] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};



export const updatePassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    if (!userId || !newPassword) {
      return res.status(400).json({ error: true, message: "User ID and new password are required" });
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({ error: true, message: "New password cannot be the same as the old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Password update error:", error);
    return res.status(500).json({ error: true, message: "Internal Server Error", details: error.message });
  }
};


// export const updateProfile = async (req, res) => {
//   const userId = req.user._id; // Authenticated user ID from middleware
//   const { name, pic } = req.body;

//   if (!name || !pic) {
//     return res.status(400).json({ message: "Please provide name or profile picture to update." });
//   }

//   try {
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     if (name) user.name = name;
//     if (pic) user.pic = pic;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Profile updated successfully.",
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         pic: user.pic,
//         currentStatus: user.currentStatus,
//         mood: user.mood,
//       }
//     });
//   } catch (error) {
//     console.error("Error updating profile:", error);
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// };


export const updateProfile = async (req, res) => {
  const userId = req.user._id;
  const profilePic = req.files?.profilePic;
  // const { name, bio, location, currentStatus, mood } = req.body;

  const { name, bio, location, currentStatus, mood } = req.body || {};

  try {
    // Initialize update object
    const updateData = {};

    // Handle profile picture upload if provided
    if (profilePic) {
      const result = await cloudinary.uploader.upload(profilePic.tempFilePath);
      updateData.pic = result.secure_url;
    }

    // Add other fields to update if provided
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (currentStatus) updateData.currentStatus = currentStatus;
    if (mood) updateData.mood = mood;

    // Check if at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        pic: updatedUser.pic,
        bio: updatedUser.bio,
        location: updatedUser.location,
        currentStatus: updatedUser.currentStatus,
        mood: updatedUser.mood
      }
    });

  } catch (error) {
    console.error("Error updating profile:", error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};


export const profilePic = async (req, res) => {
  const profile = req.files?.profilePic;
  const userId = req.user._id; // Changed from req.userId to req.user._id

  try {
    if (!profile) {
      return res.status(400).json({ message: "No profile picture uploaded" });
    }

    const result = await cloudinary.uploader.upload(profile.tempFilePath);

    const updatedUser = await User.findByIdAndUpdate(userId, {
      pic: result.secure_url
    }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile picture updated successfully",
      profilePic: updatedUser.pic
    });

  } catch (error) {
    console.error("Error updating profile picture:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
