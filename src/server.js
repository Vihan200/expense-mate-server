require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("./firebase-admin-setup");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Middleware to verify Firebase token
app.post("/api/verify-token", async (req, res) => {
  const { token } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    res.status(200).json({ message: "Token verified", uid });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token", error });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
