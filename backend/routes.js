const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  updateUser,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getAllTransactions,
  getLast5Transactions,
  getUserTransactions,
} = require("./controller");

const { verifyToken, upload, deleteOldAttachment } = require("./middleware");

// User
router.post("/user/register", registerUser);
router.post("/user/login", loginUser);
router.post("/user/update/:id", updateUser);

// Transaction
router.post("/txn/add", upload.single("attachment"), addTransaction);
router.post("/txn/update/:id", upload.single("attachment"), updateTransaction);

router.delete(
  "/txn/delete/:id",
  verifyToken,
  deleteOldAttachment,
  deleteTransaction
);
router.get("/txn/all", verifyToken, getAllTransactions);
router.get("/txn/recent", verifyToken, getLast5Transactions);
router.get("/txn/user/:userId", verifyToken, getUserTransactions);

module.exports = router;
