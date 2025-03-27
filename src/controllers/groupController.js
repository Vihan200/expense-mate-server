const { MongoClient, ObjectId } = require("mongodb");

const mongoURI = process.env.MONGO_URI || "mongodb://vihanganirmitha200:HoneyBadgers@ac-w6sx0kt-shard-00-00.brbzcet.mongodb.net:27017,ac-w6sx0kt-shard-00-01.brbzcet.mongodb.net:27017,ac-w6sx0kt-shard-00-02.brbzcet.mongodb.net:27017/?replicaSet=atlas-roevg6-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=expenseCluster";
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

connectToMongoDB(); // Ensure MongoDB connection is established

const getGroups = async (req, res) => {
  try {
    const groupsCollection = db.collection("Groups");
    const groups = await groupsCollection.find({}).toArray();
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
};

const getGroupById = async (req, res) => {
  try {
    const groupId = req.params.id;
    const groupsCollection = db.collection("Groups");
    
    // Check if the ID is valid
    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error fetching group by ID:", error);
    res.status(500).json({ message: "Failed to fetch group" });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body; // Assuming these fields are required

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required" });
    }

    const groupsCollection = db.collection("Groups");
    const result = await groupsCollection.insertOne({ name, description });
    
    res.status(201).json({ message: "Group created", groupId: result.insertedId });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Failed to create group" });
  }
};

const updateGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { name, description } = req.body;

    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const groupsCollection = db.collection("Groups");
    const result = await groupsCollection.updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { name, description } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({ message: "Group updated" });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ message: "Failed to update group" });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;

    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const groupsCollection = db.collection("Groups");
    const result = await groupsCollection.deleteOne({ _id: new ObjectId(groupId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Failed to delete group" });
  }
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
};
