const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    maxLength: [10, "The username should have a max length of 10 characters"],
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email already in use"],
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minLength: [6, "The password should have a minimum length of 6 characters"],
  },
  role: {
    type: String,
    enum: ["User", "Admin"],
    default: "User",
  },
  facility: {
    type: String,
    enum: [
      "PKD Tampin",
      "KK Tampin",
      "KK Gemas",
      "KK Gemencheh",
      "KK Jelai",
      "KK AKS",
      "KK BRU",
    ],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["Deposit", "Withdrawal"],
    default: "Deposit",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  attachment_url: {
    type: String,
    required: true,
  },
});

transactionSchema.pre("save", function (next) {
  if (this.type === "Withdrawal" && this.amount > 0) {
    this.amount = -1 * this.amount;
  }
  next();
});

module.exports = {
  User: mongoose.model("User", userSchema),
  Transaction: mongoose.model("Transaction", transactionSchema),
};
