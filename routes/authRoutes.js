import express from 'express';

import {
     register, login,
     googleSignIn, appleSignIn,
     emailVerify, verifyOtp, updatePassword, getAllUsers, getUserById, profilePic, updateProfile, sendOtp, updatePushToken, getLoggedInUser, sendTestNotification, sendAndroidNotificationTest, deleteAccount,
     blockUser, unblockUser, getBlockedUsers
} from '../controllers/authController.js';
import { reportUser } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleSignIn);
router.post('/apple', appleSignIn);

router.get('/users', protect, getAllUsers)

// Delete user account - MUST come before /users/:id route
router.delete('/users/delete-account', protect, deleteAccount);

// Block/Unblock routes
router.post('/users/block', protect, blockUser);
router.post('/users/unblock', protect, unblockUser);
router.get('/users/blocked', protect, getBlockedUsers);

// Report route
router.post('/users/report', protect, reportUser);

//get user by id and all the chats bw specific user and logged in user
router.get('/users/:id', protect, getUserById)

router.post('/users/forgot', emailVerify);


router.post('/users/verifyOtp', verifyOtp);
router.patch('/users/updatePassword', updatePassword);

// router.post('/users/profile', protect, profilePic)
router.put('/users/profile', protect, updateProfile);
router.post('/users/sendotp', sendOtp)
router.post('/updatePushToken', updatePushToken);

router.get('/me', protect, getLoggedInUser);

// Test push notification endpoint
router.post('/test-notification', sendTestNotification);

// Debug push notification setup removed

// Android-specific notification testing
router.post('/test-android-notifications', sendAndroidNotificationTest);

export default router;