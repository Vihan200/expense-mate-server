require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection URL (hardcoded)
const mongoURI = "mongodb://vihanganirmitha200:HoneyBadgers@ac-w6sx0kt-shard-00-00.brbzcet.mongodb.net:27017,ac-w6sx0kt-shard-00-01.brbzcet.mongodb.net:27017,ac-w6sx0kt-shard-00-02.brbzcet.mongodb.net:27017/?replicaSet=atlas-roevg6-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=expenseCluster";

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

connectToMongoDB(); // Connect to MongoDB once when the server starts

// Route to get groups from MongoDB
// app.get("/api/groups", async (req, res) => {
//   try {
//     const groupsCollection = db.collection("Groups"); // Access the "Groups" collection
//     const groups = await groupsCollection.find({}).toArray(); // Fetch all documents
//     res.status(200).json(groups); // Send the data as JSON response
//   } catch (error) {
//     console.error("Error fetching groups:", error);
//     res.status(500).json({ message: "Failed to fetch groups" });
//   }
// });

// Start the Express server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
