const express = require("express");
const router = express.Router();
const { createBudget ,getBudgetById  } = require("../controllers/budgetController");


router.get("/user/:user", getBudgetById);

// Route to create a new group
router.post("/", createBudget);


module.exports = router;
