import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendMail from '../utils/sendmail.js';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import sendOTPViaSMS from '../utils/sendSMS.js'
import { adminAuth } from '../config/firebase.js';
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

//     console.log('=== LOGIN ATTEMPT ===');
//     console.log('Received phone:', phone);
//     console.log('Received password:', password ? '[PRESENT]' : '[MISSING]');
//     console.log('Received firebaseToken:', firebaseToken ? '[PRESENT]' : '[MISSING]');

//     // 1. Check if user exists
//     console.log('Searching for user with phone:', phone);
//     const user = await User.findOne({ phone });
//     console.log('User found:', user ? 'YES' : 'NO');

//     if (user) {
//       console.log('Found user:', {
//         id: user._id,
//         name: user.name,
//         phone: user.phone,
//         hasPassword: !!user.password
//       });
//     }

//     if (!user) {
//       console.log('❌ User not found in database');
//       return res.status(400).json({ message: 'User not found' });
//     }

//     // 2. Handle Firebase phone authentication
//     if (firebaseToken) {
//       // Verify Firebase token
//       const firebaseUser = await verifyFirebaseToken(firebaseToken);

//       if (!firebaseUser) {
//         return res.status(400).json({ message: 'Firebase verification failed' });
//       }

//       // Check if the phone number matches (handle different formats)
//       const firebasePhone = firebaseUser.phone_number;
//       const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

//       if (firebasePhone !== normalizedPhone) {
//         console.log('Phone mismatch:', { firebasePhone, normalizedPhone, originalPhone: phone });
//         return res.status(400).json({ message: 'Phone number mismatch' });
//       }

//       // Firebase verification successful - proceed to generate token
//     }
//     // 3. Handle password authentication (existing flow)
//     else if (password) {
//       console.log('🔐 Starting password authentication...');

//       if (!user.password) {
//         console.log('❌ No password set for this user');
//         return res.status(400).json({ message: 'Password not set for this user' });
//       }

//       console.log('Comparing passwords...');
//       console.log('Provided password length:', password.length);
//       console.log('Stored password hash exists:', !!user.password);

//       const isMatch = await bcrypt.compare(password, user.password);
//       console.log('Password match result:', isMatch);

//       if (!isMatch) {
//         console.log('❌ Password comparison failed');
//         return res.status(400).json({ message: 'Invalid credentials' });
//       }

//       console.log('✅ Password authentication successful');
//     } else {
//       console.log('❌ No authentication method provided');
//       return res.status(400).json({ message: 'Authentication method required' });
//     }

//     // 4. Generate token (common for both methods)
//     console.log('🔑 Generating JWT token...');
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '30d',
//     });

//     // 5. Return response (exclude password)
//     console.log('📤 Preparing response...');
//     const userWithoutPassword = user.toObject();
//     delete userWithoutPassword.password;

//     console.log('✅ LOGIN SUCCESSFUL! Sending response for user:', user._id);
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
async function verifyFirebaseToken(idToken) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return null;
  }
}



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

export const appleSignIn = async (req, res) => {
  const { email, name, appleId } = req.body;

  try {
    // 1. Find user by Apple ID
    let user = await User.findOne({ appleId: appleId });

    // 2. If not found by ID, try finding by email (if provided)
    if (!user && email) {
      user = await User.findOne({ email });

      // If found by email but no appleId linked, link it now
      if (user && !user.appleId) {
        user.appleId = appleId;
        if (user.authType === 'manual') {
          user.authType = 'apple';
        }
        await user.save();
      }
    }

    // 3. If still not found, create new user
    if (!user) {
      if (!email) {
        return res.status(400).json({ message: 'Email required for new account. Please try revoking Apple Sign In permissions and trying again.' });
      }

      user = await User.create({
        name: name || 'Apple User',
        email,
        pic: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
        appleId: appleId,
        authType: 'apple',
        password: 'apple_auth',
      });
    }

    // 4. Create your own app's JWT
    const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // 5. Respond with your JWT and user info
    res.status(200).json({
      token: appToken,
      user,
    });

  } catch (err) {
    console.error('Apple Sign-In Error:', err);
    res.status(401).json({ message: 'Apple authentication failed' });
  }
};



// export const googleSignIn = async (req, res) => {
//   const { token } = req.body;

//   try {
//     // ✅ Verify ID Token
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID, // web/ios/android client ID
//     });
//     const payload = ticket.getPayload();

//     const { email, name, picture, sub: googleId } = payload;

//     let user = await User.findOne({ email });
//     if (!user) {
//       user = await User.create({
//         name,
//         email,
//         pic: picture,
//         googleId,
//         authType: 'google',
//         password: 'google_auth',
//       });
//     }

//     const appToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     res.status(200).json({ token: appToken, user });
//   } catch (err) {
//     console.error('Google Sign-In Error:', err.message);
//     res.status(401).json({ message: 'Google authentication failed' });
//   }
// };


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
          // Raw timestamp for reliable client-side sorting
          lastPreviewAt: lastPrivateMessage?.createdAt || null,
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
      .select('_id text audio createdAt sender')
      .lean();

    // Format messages with additional info
    const formattedMessages = messages.map(message => {
      const formatted = {
        _id: message._id,
        text: message.text,
        time: new Date(message.createdAt).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        date: new Date(message.createdAt).toLocaleDateString(),
        isSentByMe: message.sender.toString() === loggedInUserId.toString()
      };

      // Only include audio if it has a valid URL
      if (message.audio && message.audio.url) {
        formatted.audio = {
          url: message.audio.url,
          mimeType: message.audio.mimeType || 'audio/mpeg',
          duration: message.audio.duration || null
        };
      }

      return formatted;
    });

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


export const blockUser = async (req, res) => {
  try {
    const { userIdToBlock } = req.body;
    const userId = req.user._id;

    if (!userIdToBlock) {
      return res.status(400).json({ message: "User ID to block is required" });
    }

    const user = await User.findById(userId);
    if (!user.blockedUsers.includes(userIdToBlock)) {
      user.blockedUsers.push(userIdToBlock);
      await user.save();
    }

    res.status(200).json({ message: "User blocked successfully", blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ message: "Server error while blocking user" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userIdToUnblock } = req.body;
    const userId = req.user._id;

    if (!userIdToUnblock) {
      return res.status(400).json({ message: "User ID to unblock is required" });
    }

    const user = await User.findById(userId);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userIdToUnblock);
    await user.save();

    res.status(200).json({ message: "User unblocked successfully", blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ message: "Server error while unblocking user" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('blockedUsers', 'name pic email');

    res.status(200).json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Get blocked users error:", error);
    res.status(500).json({ message: "Server error while fetching blocked users" });
  }
};
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

export const updatePushToken = async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    // Accept Expo push tokens and raw FCM tokens (EAS/Custom clients may return non-Expo tokens).
    // Normalize token by trimming. We will still store whatever the client provides so server
    // can attempt Expo send or fallback to FCM using firebase-admin.
    let validatedToken = null;
    if (pushToken) {
      const token = pushToken.trim();
      if (token.length < 10) {
        console.warn('Push token too short or invalid:', token);
        return res.status(400).json({ success: false, message: 'Invalid push token' });
      }
      validatedToken = token;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken: validatedToken, lastActive: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(`✅ Updated push token for user ${user.name} (${userId}):`, validatedToken ? '✓ Token set' : '✗ Token removed');

    res.json({
      success: true,
      pushToken: user.pushToken,
      message: validatedToken ? 'Push token updated successfully' : 'Push token removed successfully'
    });
  } catch (error) {
    console.error("updatePushToken error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export const getLoggedInUser = async (req, res) => {
  try {
    // req.user is populated by your `protect` middleware
    const userId = req.user._id;

    // Find user by ID
    const user = await User.findById(userId)
      .populate('groups', 'name') // populate groups with only name field
      .populate('currentGroup', 'name'); // populate current group if needed

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching logged-in user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Test push notification endpoint for Android/iOS
export const sendTestNotification = async (req, res) => {
  try {
    const { userId, platform = 'unknown' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    // Find user and their push token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.pushToken) {
      return res.status(400).json({
        success: false,
        message: "User doesn't have a push token registered"
      });
    }

    console.log(`🧪 Sending test notification to ${platform} user:`, user.name);
    console.log(`📱 Push token:`, user.pushToken);

    // Prepare the push notification message
    const message = {
      to: user.pushToken,
      sound: 'default',
      title: `Chatrio Test (${platform.toUpperCase()})`,
      body: `🎉 Push notifications are working perfectly on ${platform}!`,
      data: {
        test: true,
        platform: platform,
        userId: userId
      },
      priority: 'high',
      // Android specific settings
      android: {
        channelId: 'default',
        sound: 'default',
        priority: 'high',
        vibrate: [0, 250, 250, 250],
        sticky: false,
        notification: {
          color: '#0758C2',
          tag: `test-${Date.now()}`,
          clickAction: '.MainActivity'
        }
      },
      // iOS specific settings
      ios: {
        sound: 'default',
        badge: 1,
      }
    };

    console.log('📤 Sending notification:', message);

    // Use Expo SDK instead of direct API call
    const { Expo } = await import('expo-server-sdk');
    const expo = new Expo();

    try {
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (let chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      console.log('✅ Expo push tickets:', tickets);

      // Check for errors in tickets
      for (let ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('❌ Push notification error:', ticket.message, ticket.details);
          return res.status(400).json({
            success: false,
            message: 'Push notification failed',
            error: ticket.message,
            details: ticket.details
          });
        }
      }

      // All tickets were successful
      res.json({
        success: true,
        message: `Test notification sent successfully to ${platform}`,
        pushToken: user.pushToken,
        pushResult: tickets[0],
        ticketId: tickets[0].id
      });

    } catch (error) {
      console.error('❌ Push notification error:', error);
      res.status(400).json({
        success: false,
        message: 'Push notification failed',
        error: error.message || 'Unknown error'
      });
    }

  } catch (error) {
    console.error("❌ sendTestNotification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error sending test notification",
      error: error.message
    });
  }
};


// Android-specific notification debugging
export const sendAndroidNotificationTest = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      return res.status(400).json({
        success: false,
        message: "User not found or no push token"
      });
    }

    console.log(`🤖 Testing Android-specific notification for user:`, user.name);
    console.log(`📱 Push token:`, user.pushToken);

    // Send multiple test notifications with different configurations
    const testMessages = [
      {
        name: "High Priority Test",
        message: {
          to: user.pushToken,
          sound: 'default',
          title: 'Android Test 1 🤖',
          body: 'High priority notification with max importance',
          data: { test: 'android-high-priority', timestamp: Date.now() },
          priority: 'high',
          android: {
            channelId: 'high-priority',
            sound: 'default',
            priority: 'max',
            vibrate: [0, 500, 250, 500],
            notification: {
              color: '#FF0000',
              sticky: true,
              tag: `android-test-1-${Date.now()}`
            }
          }
        }
      },
      {
        name: "Default Channel Test",
        message: {
          to: user.pushToken,
          sound: 'default',
          title: 'Android Test 2 🔔',
          body: 'Default channel notification',
          data: { test: 'android-default', timestamp: Date.now() },
          priority: 'high',
          android: {
            channelId: 'default',
            sound: 'default',
            priority: 'high',
            vibrate: [0, 250, 250, 250],
            notification: {
              color: '#0758C2',
              sticky: false,
              tag: `android-test-2-${Date.now()}`
            }
          }
        }
      },
      {
        name: "Simple Test",
        message: {
          to: user.pushToken,
          sound: 'default',
          title: 'Android Test 3 ⚡',
          body: 'Simple notification without extra config',
          data: { test: 'android-simple', timestamp: Date.now() },
          priority: 'high'
        }
      }
    ];

    const results = [];

    for (const test of testMessages) {
      try {
        console.log(`📤 Sending ${test.name}...`);

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(test.message),
        });

        const result = await response.json();
        console.log(`✅ ${test.name} result:`, result);

        results.push({
          test: test.name,
          success: result.data && result.data.status === 'ok',
          result: result
        });

        // Wait 2 seconds between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        results.push({
          test: test.name,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Android notification tests completed',
      pushToken: user.pushToken,
      results: results,
      note: 'Check your Android device for 3 different test notifications'
    });

  } catch (error) {
    console.error("❌ Android notification test error:", error);
    res.status(500).json({
      success: false,
      message: "Server error testing Android notifications",
      error: error.message
    });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated user

    console.log(`🗑️ Account deletion requested for user: ${userId}`);

    // Find the user first to get their information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`📋 Deleting account for: ${user.name} (${user.email})`);

    // Delete all messages where user is sender or recipient
    const messagesDeleted = await Message.deleteMany({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    });
    console.log(`📨 Deleted ${messagesDeleted.deletedCount} messages`);

    // Remove user from all groups (this will also remove them from group messages)
    const groupsUpdated = await Group.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    console.log(`👥 Removed user from ${groupsUpdated.modifiedCount} groups`);

    // If user was an admin of any groups, transfer ownership or delete the group
    const adminGroups = await Group.find({ admin: userId });
    for (const group of adminGroups) {
      if (group.members.length > 1) {
        // Transfer ownership to another member
        const newAdmin = group.members.find(member => member.toString() !== userId.toString());
        if (newAdmin) {
          await Group.findByIdAndUpdate(group._id, { admin: newAdmin });
          console.log(`👑 Transferred ownership of group ${group.name} to ${newAdmin}`);
        }
      } else {
        // Delete the group if user is the only member
        await Group.findByIdAndDelete(group._id);
        console.log(`🗑️ Deleted group ${group.name} (only admin was the user)`);
      }
    }

    // Delete the user account
    await User.findByIdAndDelete(userId);
    console.log(`✅ User account deleted successfully`);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
      deletedData: {
        messages: messagesDeleted.deletedCount,
        groupsUpdated: groupsUpdated.modifiedCount,
        adminGroupsHandled: adminGroups.length
      }
    });

  } catch (error) {
    console.error("❌ Account deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting account",
      error: error.message
    });
  }
};