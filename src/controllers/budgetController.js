const { ObjectId } = require("mongodb");
const { getDB } = require("../../dbConnection");
const { sendNotification } = require("../services/notification.service");
const { getToken } = require("../../tokenStorage");

const db = getDB();

const createBudget = async (req, res) => {
  try {
    const { amount, category, date, description,type,user} = req.body; // Assuming these fields are required

    if (!amount || !user || !type) {
      return res.status(400).json({ message: "Missing required details" });
    }
  
    const budgetCollection = db.collection("budget");
    const result = await budgetCollection.insertOne({ amount, category,date,description,type,user });
    
    res.status(200).json({ message: "Budget created", budgetId: result.insertedId });
    await sendNotification(
      getToken(),
      "Budget created",
      ""
    );
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
