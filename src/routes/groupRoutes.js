const express = require("express");
const router = express.Router();
const { getGroups, getGroupById, createGroup, updateGroup, deleteGroup } = require("../controllers/groupController");

// Route to get all groups
router.get("/", getGroups);

// Route to get group by ID
router.get("/:id", getGroupById);

// Route to create a new group
router.post("/", createGroup);

// Route to update an existing group by ID
router.put("/:id", updateGroup);

// Route to delete a group by ID
router.delete("/:id", deleteGroup);

module.exports = router;
