const cron = require("node-cron");
const nodemailer = require("nodemailer");
const path = require("path");
const firebaseAdmin = require("../../firebase-admin-setup");
const { sendNotification } = require("./notification.service");
const { getToken } = require("../../tokenStorage");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER,
    pass: process.env.APP_PASSWORD,
  },
});

async function sendReminderEmail(userEmail, userName) {
  // Customize this data as needed - you might want to fetch actual expense data from your DB
  const emailData = {
    name: userName || "User",
    email: userEmail,
    amountDue: "LKR 3,200", // This should come from your database
    dueDate: "May 15, 2025", // This should come from your database
    expenseTitle: "April Group Dinner", // This should come from your database
    link: "https://expensemate.app/dashboard",
  };

  try {
    const info = await transporter.sendMail({
      from: {
        name: "ExpenseMate",
        address: process.env.USER,
      },
      to: emailData.email,
      subject: `🔔 Reminder: You have a pending payment for ${emailData.expenseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; color: #333;">
          <h2 style="color: #1a73e8;">Hi ${emailData.name},</h2>
          <p>You still have a pending payment for <strong>${emailData.expenseTitle}</strong>.</p>
          <p><strong>Amount Due:</strong> ${emailData.amountDue}<br>
             <strong>Due Date:</strong> ${emailData.dueDate}</p>
          <p style="margin-top: 20px;">Please click below to view or settle the payment:</p>
          <a href="${emailData.link}" style="display: inline-block; background-color: #1a73e8; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            View Expense
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">
            If you've already made this payment, you can ignore this reminder.<br>
            — The ExpenseMate Team
          </p>
        </div>
      `,
    });

    console.log(
      `✅ Reminder email sent to ${emailData.email}:`,
      info.messageId
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to send email to ${emailData.email}:`,
      error.message
    );
    return false;
  }
}

async function sendEmailsToAllUsers() {
  try {
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const users = listUsersResult.users;

    console.log(`Found ${users.length} users. Sending reminder emails...`);

    // Send email to each user
    for (const user of users) {
      if (user.email) {
        // Only if user has an email
        await sendReminderEmail(user.email, user.displayName || null);
        // Add a small delay between emails to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("🎉 Finished sending all reminder emails");
  } catch (error) {
    console.error("Error in sendEmailsToAllUsers:", error);
  }
}

// Schedule the job to run daily at 9 AM
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Running cron job to send reminder emails to all users...");
  await sendEmailsToAllUsers();
  await sendNotification(
    getToken(),
    "Please settle your pending payments",
    ""
  );
});
