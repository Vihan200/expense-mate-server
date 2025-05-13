require("dotenv").config();
const express = require("express");
const cors = require("cors");
const firebaseAdmin = require("./firebase-admin-setup");
const { connectToMongoDB } = require("./dbConnection");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/api/verify-token", async (req, res) => {
  const idToken = req.body.token; // Assuming the token is sent in the body as `token`

  if (!idToken) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    // Verify the token using Firebase Admin SDK
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);

    // If token is valid, decodedToken will contain the decoded data
    console.log("Decoded token:", decodedToken);

    // Send success response with the decoded token data
    res.status(200).json({ message: "Token verified", user: decodedToken });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// Connect to MongoDB once when the server starts
connectToMongoDB()
  .then(() => {
    const groupRoutes = require("./src/routes/groupRoutes");
    const budgetRoutes = require("./src/routes/budgetRoutes");
    const notificationRoutes = require("./src/routes/notificationRoutes");
    require("./src/services/mail.service");

    app.use("/api/groups", groupRoutes);
    app.use("/api/budget", budgetRoutes);
    app.use("/api/notifications", notificationRoutes);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
