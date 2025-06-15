const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "backend", ".env") });

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const frontend = require("./backend/front");
const routes = require("./backend/routes");
const { connectDB } = require("./backend/config");
const session = require("express-session");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "backend", "views"));
app.use(express.static(path.join(__dirname, "static")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./static")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use("/", frontend);
app.use("/api", routes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
