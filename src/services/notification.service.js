const admin = require("../../firebase-admin-setup");

async function sendNotification(token, title, body) {
  const message = {
    notification: { title, body },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

module.exports = {
  sendNotification,
};