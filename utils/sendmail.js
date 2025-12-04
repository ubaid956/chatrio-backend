import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.APP_PASSWORD,
    },
});

const sendMail = async (mailOptions) => {
    // Debugging credentials (don't log actual values)
    if (!process.env.EMAIL_USER || !process.env.APP_PASSWORD) {
        console.error('Missing email credentials:', {
            hasUser: !!process.env.EMAIL_USER,
            hasPass: !!process.env.APP_PASSWORD
        });
    }

    try {
        // Ensure from field is set
        if (!mailOptions.from) {
            mailOptions.from = process.env.EMAIL_USER;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Mail has been sent successfully:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending mail:', error);
        throw error; // Re-throw so controller knows it failed
    }
};

export default sendMail;
