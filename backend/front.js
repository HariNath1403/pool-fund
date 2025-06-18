const express = require("express");
const router = express.Router();

const { isAuthenticated } = require("./middleware");
const { getLast5Transactions, getAllTransactions } = require("./controller");
const { User, Transaction } = require("./model");

// Login User
router.get("/", (req, res) => {
  res.redirect("/login");
});

router.get("/login", (req, res) => {
  const errorType = req.query.error || null;
  const successType = req.query.success || null;
  res.render("login", { errorType, successType });
});

router.get("/home", isAuthenticated, (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  getLast5Transactions(req, res);
});

// Create New User
router.get("/register", (req, res) => {
  const errorType = req.query.error || null;
  res.render("register", { errorType });
});

// Update User
router.get("/update", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    console.log("Session user:", req.session.user);

    const userId = req.session.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/login");
    }

    res.render("update", {
      user,
    });
  } catch (err) {
    console.error("Error loading user: ", err);
    res.redirect("/login");
  }
});

// Logout user
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Logout error:", err);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login");
  });
});

// Transaction - Add New
router.get("/add", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/login");
    }

    const type = req.query.type || "Deposit";

    res.render("transaction", {
      type,
      user,
      transaction: null,
      isEdit: false,
      errorType: req.query.error || null,
    });
  } catch (err) {
    console.error("Error loading user: ", err);
    res.redirect("/login");
  }
});

// Transaction History
router.get("/history", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  getAllTransactions(req, res);
});

// GET 1 Transaction
router.get("/add/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const user = await User.findById(req.session.user.id);
    const txn = await Transaction.findById(req.params.id).populate(
      "user_id",
      "username"
    );

    if (!txn) return res.status(404).send("Transaction not found");

    res.render("transaction", {
      user,
      transaction: txn,
      type: txn.type,
      isEdit: true,
    });
  } catch (err) {
    console.error("Error loading transaction:", err);
    res.status(500).send("Internal Server Error");
  }
});

// QR Code
router.get("/qr", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.render("qr");
});

module.exports = router;
