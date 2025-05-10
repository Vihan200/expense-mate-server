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


const createBudget = async (req, res) => {
  try {
    const { amount, category, date, description,type,user} = req.body; // Assuming these fields are required

    if (!amount || !user || !type) {
      return res.status(400).json({ message: "Missing required details" });
    }
  
    const budgetCollection = db.collection("budget");
    const result = await budgetCollection.insertOne({ amount, category,date,description,type,user });
    
    res.status(200).json({ message: "Budget created", budgetId: result.insertedId });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({ message: "Failed to create budget" });
  }
};

const getBudgetById = async (req, res) => {
  try {
    const userId = req.params.user;
    const budgetCollection = db.collection("budget");

    const budgets = await budgetCollection.find({ user: userId }).toArray();
    if (!budgets.length) {
      return res.status(404).json({ message: "No budget entries found for this user." });
    }

    res.status(200).json(budgets);
  } catch (error) {
    console.error("Error fetching budgets by ID:", error);
    res.status(500).json({ message: "Failed to fetch budget" });
  }
};
module.exports = {
  createBudget,
  getBudgetById
};
