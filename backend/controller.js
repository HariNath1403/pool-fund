const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const { User, Transaction } = require("./model");

const generateToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
// User
// 1. REGISTER new user
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, facility } = req.body;

    if (!username) {
      return res.redirect("/register?error=username");
    }
    if (!email) {
      return res.redirect("/register?error=email");
    }
    if (!password) {
      return res.redirect("/register?error=password");
    }
    if (!facility) {
      return res.redirect("/register?error=facility");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
      facility,
    });

    return res.redirect("/login?success=accountCreated");
  } catch (err) {
    console.error("Registration error:", err);

    const duplicateEmail =
      err.code === 11000 ||
      (err.errorResponse && err.errorResponse.code === 11000) ||
      (err.message &&
        err.message.includes("E11000") &&
        err.message.includes("email"));

    if (duplicateEmail) {
      return res.redirect("/register?error=email");
    }

    return res.redirect("/register?error=server");
  }
};

// 2. LOGIN user
exports.loginUser = async (req, res) => {
  try {
    const { loginInput, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: loginInput }, { username: loginInput }],
    });

    if (!user) {
      return res.redirect("/login?error=user");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.redirect("/login?error=password");
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    return res.redirect("/home");
  } catch (err) {
    return res.redirect("/login?error=server");
  }
};

// 3. UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, facility, password, role } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({
        message: "User not found",
      });

    if (username) user.username = username;
    if (facility) user.facility = facility;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
    if (role) user.role = role;
    user.updatedAt = new Date();

    await user.save();

    return res.redirect("/login?success=accountUpdated");
  } catch (err) {
    return res.redirect("/login");
  }
};

// Transaction
// 1. ADD 1 transaction
exports.addTransaction = async (req, res) => {
  try {
    const { user_id, type, amount, details } = req.body;

    const allTransactions = await Transaction.find();
    const currentBalance = allTransactions.reduce(
      (total, txn) => total + txn.amount,
      0
    );

    if (type === "Withdrawal" && amount > currentBalance) {
      return res.status(400).json({
        message: "Insufficient balance for withdrawal",
        currentBalance,
      });
    }

    // const attachment_url = req.file?.path;
    const attachment_url = req.file?.path || "https://via.placeholder.com/150";

    await Transaction.create({
      user_id,
      type,
      amount,
      details,
      attachment_url,
    });

    return res.redirect("/home?success=transactionAdded");
  } catch (err) {
    return res.redirect("/login");
  }
};

// 2. UPDATE transaction
exports.updateTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { date, amount, details } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    if (date) {
      let newDate = new Date(date);
      if (!isNaN(newDate)) {
        const currentTime = new Date(transaction.date).toTimeString();
        const [hours, minutes, seconds] = currentTime.split(":");
        newDate.setHours(hours, minutes, seconds);
        transaction.date = newDate;
      }
    }

    const type = transaction?.type;
    if (amount) {
      let correctedAmount =
        type === "Withdrawal"
          ? Math.abs(Number(amount)) * -1
          : Math.abs(Number(amount));
      transaction.amount = correctedAmount;
    }

    if (details) transaction.details = details;

    if (req.file) {
      transaction.attachment_url = req.file.path;
    }

    await transaction.save();

    res.redirect("/history?successfulUpdate");
  } catch (err) {
    res.status(500).json({
      message: "Error updating transaction",
      error: err.message,
    });
  }
};

// 3. DELETE 1 transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        message: "Transaction is not found",
      });
    }

    await transaction.deleteOne();

    res.status(204).json({
      message: "Transaction deleted successfully",
      id: transactionId,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting transaction",
      error: err.message,
    });
  }
};

// 4. GET all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("user_id", "username")
      .sort({ date: -1 });

    const formattedTxns = transactions.map((txn) => {
      const d = new Date(txn.date);
      const formattedDate = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      return {
        _id: txn._id,
        date: formattedDate,
        amount: txn.amount,
        staff: txn.user_id?.username || "Unknown",
        details: txn.details,
      };
    });

    res.render("history", { transactions: formattedTxns });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching transactions",
      error: err.message,
    });
  }
};

// 5. GET latest 5 entries
exports.getLast5Transactions = async (req, res) => {
  try {
    const fullTransactions = await Transaction.find()
      .populate("user_id", "username")
      .sort({ date: -1 });

    const currentBalance = fullTransactions.reduce(
      (total, txn) => total + txn.amount,
      0
    );

    const transactions = fullTransactions.slice(0, 5);

    const formattedTxns = transactions.map((txn) => {
      const withdrawalCheck = txn.amount < 0;
      const formattedAmount = Math.abs(txn.amount).toFixed(2);
      const user = txn.user_id?.username;

      const daysLapse = moment().diff(moment(txn.date), "days");
      let dateTxt;

      if (daysLapse <= 7) {
        dateTxt =
          daysLapse === 0
            ? "today"
            : daysLapse === 1
            ? "yesterday"
            : `${daysLapse} days ago`;
      } else {
        dateTxt = `on ${moment(txn.date).format("DD/MM/YY")}`;
      }

      const type = withdrawalCheck ? "Withdrawal" : "Deposit";

      const msg = withdrawalCheck
        ? `${user} withdrew RM${formattedAmount} ${dateTxt} for ${txn.details}`
        : `${user} added RM${formattedAmount} to the pool ${dateTxt}`;

      return { type, msg };
    });

    res.render("home", {
      user: req.session.user,
      balance: currentBalance.toFixed(2),
      transactions: formattedTxns,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching transactions",
      error: err.message,
    });
  }
};

// 6. GET all transaction by user
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.params.userId;

    const transactions = await Transaction.find({ user_id: userId }).sort({
      date: -1,
    });

    res.status(200).json({
      message: "User transactions retrieved successfully",
      results: transactions.length,
      transactions: transactions.map((row) => ({
        id: row._id,
        date: row.date,
        amount: row.amount,
        details: row.details,
        attachment_url: row.attachment_url,
      })),
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching transactions",
      error: err.message,
    });
  }
};
