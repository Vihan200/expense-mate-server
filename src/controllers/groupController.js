const { ObjectId } = require("mongodb");
const { getDB } = require("../../dbConnection");
const { sendNotification } = require("../services/notification.service");
const { getToken } = require("../../tokenStorage");
const {
  sendGroupAddedEmail,
  sendGroupUpdatedEmail,
  sendGroupDeletedEmail,
  sendExpenseAddedEmail,
} = require("../services/mail.service");

const db = getDB();

const getGroups = async (req, res) => {
  try {
    const user = req.query.uid;
    const groupsCollection = db.collection("Groups");
    const groups = await groupsCollection.find({ members: user }).toArray();
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
};
//
const getGroupById = async (req, res) => {
  try {
    const groupId = req.params.id;
    const groupsCollection = db.collection("Groups");

    // Check if the ID is valid
    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await groupsCollection.findOne({
      _id: new ObjectId(groupId),
    });
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
    const { name, admin_uid, member } = req.body; // Assuming these fields are required

    if (!name || !admin_uid) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }
    let members = [];
    const isSettled = false;
    if (member) {
      members = member.split(",").map((member) => member.trim());
    }
    const groupsCollection = db.collection("Groups");
    const result = await groupsCollection.insertOne({
      name,
      admin_uid,
      members,
      isSettled,
    });

    res
      .status(200)
      .json({ message: "Group created", groupId: result.insertedId });
    await sendNotification(getToken(), `New group ${name} created`, "");

    members.forEach(async (memberEmail) => {
      if (memberEmail) {
        await sendGroupAddedEmail(memberEmail, name, admin_uid.split("@")[0]);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    });
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
    await sendNotification(getToken(), `Group ${name} updated`, "");
    const group = await groupsCollection.findOne({
      _id: new ObjectId(groupId),
    });
    group.members.forEach(async (memberEmail) => {
      if (memberEmail) {
        console.log("sending update email");
        await sendGroupUpdatedEmail(memberEmail, name);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    });
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
    const result = await groupsCollection.deleteOne({
      _id: new ObjectId(groupId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({ message: "Group deleted" });
    await sendNotification(getToken(), "Group deleted", "");
    const group = await groupsCollection.findOne({
      _id: new ObjectId(groupId),
    });
    group.members.forEach(async (memberEmail) => {
      if (memberEmail) {
        await sendGroupDeletedEmail(memberEmail, name);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Failed to delete group" });
  }
};
const updateImage = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { img } = req.body;

    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const groupsCollection = db.collection("Groups");
    const result = await groupsCollection.updateOne(
      { _id: new ObjectId(groupId) },
      { $set: { img } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({ message: "Group updated" });
    await sendNotification(getToken(), "Group display image updated", "");
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ message: "Failed to update group" });
  }
};
const createExpenses = async (req, res) => {
  try {
    const groupId = req.params.id;
    const expense = req.body; // Entire expense object (description, amount, splitAmong, etc.)

    if (!ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const groupsCollection = db.collection("Groups");

    const result = await groupsCollection.updateOne(
      { _id: new ObjectId(groupId) },
      { $push: { expenses: expense } } // Push to expenses array
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({ message: "Expense added successfully" });
    await sendNotification(getToken(), "Expenses updated", "");
    const group = await groupsCollection.findOne({
      _id: new ObjectId(groupId),
    });
    const members = group.members.filter((m) => m !== expense.paidBy); // Exclude payer
    await Promise.all(
      members.map(async (memberEmail) => {
        if (memberEmail) {
          await sendExpenseAddedEmail(memberEmail, group.name, {
            ...expense,
            splitAmong: expense.splitAmong.map((s) => ({
              uid: s.uid,
              amount: s.amount,
            })),
          });
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      })
    );
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Failed to add expense" });
  }
};
module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  updateImage,
  createExpenses,
};
