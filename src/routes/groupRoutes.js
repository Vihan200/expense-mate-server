const express = require("express");
const router = express.Router();
const { getGroups } = require("../controllers/groupController");

// Route to get all groups
router.get("/", getGroups);

module.exports = router;
