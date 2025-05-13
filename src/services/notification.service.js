const admin = require("../../firebase-admin-setup");

async function sendNotification(token, title, body) {
  // Basic input validation
  if (!token || typeof token !== "string") {
    console.error("Invalid notification token:", token);
    return { success: false, error: "Invalid token" };
  }

  const message = {
    notification: { title, body },
    token: token,
  };

  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error("Firebase Admin not initialized");
      return { success: false, error: "Service unavailable" };
    }

    const response = await admin.messaging().send(message);
    console.log("Notification successfully sent:", response);
    return { success: true, response };
  } catch (error) {
    // Handle specific Firebase errors
    const errorDetails = {
      code: error.code || "UNKNOWN_ERROR",
      message: error.message || "Unknown notification error",
      stack: error.stack,
    };

    console.error(
      "Notification failed:",
      JSON.stringify(
        {
          error: errorDetails,
          notification: { title, body },
          token: token.slice(0, 6) + "...", // Partial token for security
        },
        null,
        2
      )
    );

    return {
      success: false,
      error: "Notification failed",
      details: errorDetails,
    };
  }
}

module.exports = {
  sendNotification,
};
