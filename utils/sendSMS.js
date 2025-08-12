import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendOTPViaSMS = async (phone, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone // e.g., '+923001234567'
    });
    console.log('SMS sent:', message.sid);
    return message.sid;
  } catch (error) {
    console.error('SMS sending error:', error);
    throw error;
  }
};

export default sendOTPViaSMS;
