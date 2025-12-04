import Report from "../models/Report.js";
import User from "../models/User.js";
import sendMail from "../utils/sendmail.js";

export const reportUser = async (req, res) => {
    try {
        const { reportedUserId, reason, description } = req.body;
        const reporterId = req.user._id;

        if (!reportedUserId || !reason) {
            return res.status(400).json({ message: "Reported user and reason are required." });
        }

        const report = new Report({
            reporter: reporterId,
            reportedUser: reportedUserId,
            reason,
            description,
        });

        await report.save();

        // Fetch user details for the email
        const reporter = await User.findById(reporterId);
        const reportedUser = await User.findById(reportedUserId);

        const emailSubject = `New User Report: ${reason}`;
        const emailText = `
      New Report Submitted:
      
      Reporter: ${reporter.name} (${reporter.email})
      Reported User: ${reportedUser.name} (${reportedUser.email})
      Reason: ${reason}
      Description: ${description}
      
      Time: ${new Date().toLocaleString()}
    `;

        try {
            await sendMail({
                to: 'ubaidanxari451@gmail.com', // Changed from email to to
                subject: emailSubject,
                text: emailText, // Changed from message to text
            });
            console.log('Report notification email sent to admin.');
        } catch (emailError) {
            console.error('Failed to send report notification email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({ message: "Report submitted successfully." });
    } catch (error) {
        console.error("Report user error:", error);
        res.status(500).json({ message: "Server error while submitting report." });
    }
};
