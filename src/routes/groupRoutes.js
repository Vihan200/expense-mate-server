const express = require("express");
const router = express.Router();
const { getGroups, getGroupById, createGroup, updateGroup, deleteGroup,updateImage,createExpenses } = require("../controllers/groupController");

router.get("/", getGroups);

router.get("/:id", getGroupById);

router.post("/", createGroup);
router.post("/:id/expenses", createExpenses);

router.put("/:id", updateGroup);
router.put("/image/:id", updateImage);

router.delete("/:id", deleteGroup);

module.exports = router;
