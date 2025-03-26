// const express = require("express");
// const cors = require("cors");
// const { MongoClient } = require("mongodb");

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());
// const getGroups = async (req, res) => {
//   try {
//     // Connect to MongoDB
//     await client.connect();

//     // Access the database and collection
//     const db = client.db("RAD"); // Replace with your database name
//     const groupsCollection = db.collection("Groups"); // Replace with your collection name

//     // Fetch all groups
//     const groups = await groupsCollection.find({}).toArray();
//     res.status(200).json(groups);
//   } catch (error) {
//     console.error("Error fetching groups:", error);
//     res.status(500).json({ message: "Failed to fetch groups" });
//   }
// };
// module.exports = { getGroups };
