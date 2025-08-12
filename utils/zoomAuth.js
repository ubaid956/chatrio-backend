import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const generateZoomAccessToken = async () => {
  try {
    const { ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID } = process.env;
    console.log('Generating Zoom access token...' );

    // Encode client ID and secret to base64
    const base64Credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

    console.log('Base64 Credentials:', base64Credentials);
    // Request access token from Zoom
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      null,
      {
        headers: {
          Authorization: `Basic ${base64Credentials}`,
        }
      }
    );

    // Return the access token
    return response.data.access_token;
  } catch (error) {
    console.error('Zoom token error:', error.response?.data || error.message);
    throw new Error('Failed to generate Zoom access token');
  }
};
