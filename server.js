require("dotenv").config();
const express = require("express");
const cors = require("cors");
const firebaseAdmin = require("firebase-admin");
const { MongoClient } = require("mongodb");
const serviceAccount = require("./privateKey.json");

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection URL (hardcoded)
const mongoURI = process.env.MONGO_URI || "mongodb://vihanganirmitha200:HoneyBadgers@ac-w6sx0kt-shard-00-00.brbzcet.mongodb.net:27017,ac-w6sx0kt-shard-00-01.brbzcet.mongodb.net:27017,ac-w6sx0kt-shard-00-02.brbzcet.mongodb.net:27017/?replicaSet=atlas-roevg6-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=expenseCluster";

// MongoDB client setup
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

const connectToMongoDB = async () => {
  try {
    await client.connect();
    db = client.db("RAD"); // Initialize the database connection
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
};

// Connect to MongoDB once when the server starts
connectToMongoDB();
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

// Import routes after DB connection
const groupRoutes = require("./src/routes/groupRoutes");

app.use("/api/groups", groupRoutes); // Use the group routes

// Start the Express server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
