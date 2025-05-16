const cron = require("node-cron");
const nodemailer = require("nodemailer");
const path = require("path");
const firebaseAdmin = require("../../firebase-admin-setup");
const { sendNotification } = require("./notification.service");
const { getToken } = require("../../tokenStorage");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { getDB } = require("../../dbConnection");
const db = getDB();

async function calculateMemberDebts() {
  try {
    const debtMap = {}; // Structure: { email: { groups: { [groupId]: { name: string, amount: number } }, total: number } }
    const groupsCollection = db.collection("Groups");
    const groups = await groupsCollection.find({ isSettled: false }).toArray();

    groups.forEach((group) => {
      if (!Array.isArray(group.expenses)) return;

      group.expenses.forEach((expense) => {
        const payer = expense.paidBy;
        if (!Array.isArray(expense.splitAmong)) return;

        expense.splitAmong.forEach((split) => {
          if (split.uid && split.uid !== payer) {
            const debtor = split.uid;
            const amount = split.amount || 0;

            if (!debtMap[debtor]) {
              debtMap[debtor] = {
                groups: {},
                total: 0,
              };
            }

            // Track group-specific debt
            if (!debtMap[debtor].groups[group._id]) {
              debtMap[debtor].groups[group._id] = {
                name: group.name,
                amount: 0,
              };
            }

            debtMap[debtor].groups[group._id].amount += amount;
            debtMap[debtor].total += amount;
          }
        });
      });
    });

    return debtMap;
  } catch (error) {
    console.error("Error calculating debts:", error);
    return {};
  }
}

async function sendDebtReminderEmail(email, debtData) {
  const userName = email.split("@")[0].replace(/[^a-zA-Z]/g, " ") || "there";
  const formattedName =
    userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

  const emailData = {
    name: formattedName,
    email: email,
    totalDebt: `LKR ${debtData.total.toFixed(2)}`,
    groups: Object.values(debtData.groups).map((g) => ({
      name: g.name,
      amount: `LKR ${g.amount.toFixed(2)}`,
    })),
    link: "https://expense-mate-nuew.onrender.com/",
  };

  try {
    const info = await transporter.sendMail({
      from: {
        name: "ExpenseMate",
        address: process.env.USER,
      },
      to: emailData.email,
      subject: `🔔 Reminder: ${emailData.groups.length} Pending Payments - ${emailData.totalDebt} Total`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin: 0 0 25px 0; font-size: 24px;">
            Hi ${emailData.name},
          </h2>

          <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="margin: 0 0 20px 0; color: #4a5568;">You have pending payments in these groups:</p>

            ${emailData.groups
              .map(
                (group) => `
              <div style="margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #1a73e8;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-weight: 600; color: #2d3748;">${group.name}</span>&nbsp;
                  <span style="color: #c53030; font-weight: 500;">${group.amount}</span>
                </div>
              </div>
            `
              )
              .join("")}

            <div style="margin: 25px 0; padding: 20px; background: #fff5f5; border-radius: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #2d3748;">Total Due:</span>
                <span style="font-size: 18px; font-weight: 700; color: #c53030;">${
                  emailData.totalDebt
                }</span>
              </div>
            </div>

            <a href="${emailData.link}" 
              style="display: block; width: 100%; 
                     text-align: center; 
                     background: #1a73e8; 
                     color: white; 
                     padding: 14px; 
                     border-radius: 6px; 
                     text-decoration: none;
                     font-weight: 600;
                     margin-top: 20px;">
              View Payment Details
            </a>
          </div>

          <div style="margin-top: 25px; text-align: center; font-size: 12px; color: #718096;">
            <p style="margin: 5px 0;">
              This is an automated reminder. Payments not settled may affect group activities.
            </p>
            <p style="margin: 5px 0;">
              © ${new Date().getFullYear()} ExpenseMate
            </p>
          </div>
        </div>
      `,
    });
    console.log(`Group-specific reminder sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send to ${email}:`, error.message);
    return false;
  }
}

async function sendPaymentReminders() {
  try {
    const debtMap = await calculateMemberDebts();

    console.log(`Processing ${Object.keys(debtMap).length} debt entries...`);

    for (const [email, debtData] of Object.entries(debtMap)) {
      if (debtData.total > 0) {
        await sendDebtReminderEmail(email, debtData);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log("Completed group-specific debt reminders");
  } catch (error) {
    console.error("Error in payment reminder job:", error);
  }
}
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

async function sendGroupAddedEmail(email, groupName, adminName) {
  const userName = email.split("@")[0].replace(/[^a-zA-Z]/g, " ") || "there";
  const formattedName =
    userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

  try {
    const info = await transporter.sendMail({
      from: {
        name: "ExpenseMate",
        address: process.env.USER,
      },
      to: email,
      subject: `👋 You've been added to ${groupName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin: 0 0 25px 0; font-size: 24px;">
            Hi ${formattedName},
          </h2>

          <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="margin: 0 0 20px 0; color: #4a5568;">
              You've been added to a new expense group:
            </p>

            <div style="margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #1a73e8;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3 style="margin: 0; color: #2d3748; font-size: 18px;">
                    ${groupName}
                  </h3>
                  <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">
                    Created by: ${adminName}
                  </p>
                </div>
              </div>
            </div>

            <p style="margin: 20px 0; color: #4a5568;">
              You can now view and participate in this group's expenses.
            </p>

            <a href="https://expense-mate-nuew.onrender.com/" 
              style="display: block; width: 100%; 
                     text-align: center; 
                     background: #1a73e8; 
                     color: white; 
                     padding: 14px; 
                     border-radius: 6px; 
                     text-decoration: none;
                     font-weight: 600;">
              Go to Dashboard
            </a>
          </div>

          <div style="margin-top: 25px; text-align: center; font-size: 12px; color: #718096;">
            <p style="margin: 5px 0;">
              This is an automated notification. You're receiving this because you were added as a member.
            </p>
            <p style="margin: 5px 0;">
              © ${new Date().getFullYear()} ExpenseMate
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Group added notification sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send group notification to ${email}:`, error);
  }
}

async function sendGroupUpdatedEmail(email, groupName) {
  const userName = email.split("@")[0].replace(/[^a-zA-Z]/g, " ") || "there";
  const formattedName =
    userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

  try {
    const info = await transporter.sendMail({
      from: {
        name: "ExpenseMate",
        address: process.env.USER,
      },
      to: email,
      subject: `🔄 Group Updated: ${groupName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin: 0 0 25px 0; font-size: 24px;">
            Hi ${formattedName},
          </h2>

          <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="margin: 0 0 20px 0; color: #4a5568;">
              A group you're part of has been updated:
            </p>

            <div style="margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #1a73e8;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3 style="margin: 0; color: #2d3748; font-size: 18px;">
                    ${groupName}
                  </h3>
                </div>
              </div>
            </div>

            <p style="margin: 20px 0; color: #4a5568;">
              Please check the group for latest updates and changes.
            </p>

            <a href="https://expense-mate-nuew.onrender.com/" 
              style="display: block; width: 100%; 
                     text-align: center; 
                     background: #1a73e8; 
                     color: white; 
                     padding: 14px; 
                     border-radius: 6px; 
                     text-decoration: none;
                     font-weight: 600;">
              View Updates
            </a>
          </div>

          <div style="margin-top: 25px; text-align: center; font-size: 12px; color: #718096;">
            <p style="margin: 5px 0;">
              This is an automated notification about group changes.
            </p>
            <p style="margin: 5px 0;">
              © ${new Date().getFullYear()} ExpenseMate
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Group updated notification sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send update notification to ${email}:`, error);
  }
}

async function sendGroupDeletedEmail(email, groupName) {
  const userName = email.split("@")[0].replace(/[^a-zA-Z]/g, " ") || "there";
  const formattedName =
    userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

  try {
    const info = await transporter.sendMail({
      from: {
        name: "ExpenseMate",
        address: process.env.USER,
      },
      to: email,
      subject: `🗑️ Group Deleted: ${groupName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin: 0 0 25px 0; font-size: 24px;">
            Hi ${formattedName},
          </h2>

          <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="margin: 0 0 20px 0; color: #4a5568;">
              A group you were part of has been deleted:
            </p>

            <div style="margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #dc2626;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3 style="margin: 0; color: #2d3748; font-size: 18px;">
                    ${groupName}
                  </h3>
                </div>
              </div>
            </div>

            <p style="margin: 20px 0; color: #4a5568;">
              This group and its expenses are no longer accessible.
            </p>

            <div style="background: #fef2f2; padding: 15px; border-radius: 6px; color: #dc2626;">
              <p style="margin: 0; font-size: 14px;">
                Note: Historical data will be retained for your records.
              </p>
            </div>
          </div>

          <div style="margin-top: 25px; text-align: center; font-size: 12px; color: #718096;">
            <p style="margin: 5px 0;">
              This is an automated notification about group deletion.
            </p>
            <p style="margin: 5px 0;">
              © ${new Date().getFullYear()} ExpenseMate
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Group deletion notification sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send deletion notification to ${email}:`,
      error
    );
  }
}

async function sendExpenseAddedEmail(email, groupName, expenseDetails) {
  const userName = email.split("@")[0].replace(/[^a-zA-Z]/g, " ") || "there";
  const formattedName =
    userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

  try {
    const info = await transporter.sendMail({
      from: {
        name: "ExpenseMate",
        address: process.env.USER,
      },
      to: email,
      subject: `💸 New Expense in ${groupName}: ${expenseDetails.description}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin: 0 0 25px 0; font-size: 24px;">
            Hi ${formattedName},
          </h2>

          <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <p style="margin: 0 0 20px 0; color: #4a5568;">
              A new expense has been added to <strong>${groupName}</strong>:
            </p>

            <div style="margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #1a73e8;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: 600; color: #2d3748;">Description:</span>
                <span>${expenseDetails.description}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-weight: 600; color: #2d3748;">Amount:</span>
                <span style="color: #c53030;">LKR ${expenseDetails.amount.toFixed(
                  2
                )}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600; color: #2d3748;">Paid by:</span>
                <span>${expenseDetails.paidBy}</span>
              </div>
            </div>

            <p style="margin: 20px 0; color: #4a5568;">
              Your share: LKR ${
                expenseDetails.splitAmong
                  .find((s) => s.uid === email)
                  ?.amount.toFixed(2) || "0.00"
              }
            </p>

            <a href="https://expense-mate-nuew.onrender.com/" 
              style="display: block; width: 100%; 
                     text-align: center; 
                     background: #1a73e8; 
                     color: white; 
                     padding: 14px; 
                     border-radius: 6px; 
                     text-decoration: none;
                     font-weight: 600;">
              View Expense Details
            </a>
          </div>

          <div style="margin-top: 25px; text-align: center; font-size: 12px; color: #718096;">
            <p style="margin: 5px 0;">
              This is an automated notification about recent expense activity.
            </p>
            <p style="margin: 5px 0;">
              © ${new Date().getFullYear()} ExpenseMate
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Expense notification sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send expense notification to ${email}:`, error);
  }
}

// cron schedule to send the payment reminders
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Starting targeted debt reminder job...");
  await sendPaymentReminders();
  await sendNotification(
    getToken(),
    "Payment Reminder",
    "Please check your email for pending payments"
  );
});

module.exports = {
  sendGroupAddedEmail,
  sendGroupUpdatedEmail,
  sendGroupDeletedEmail,
  sendExpenseAddedEmail,
};
