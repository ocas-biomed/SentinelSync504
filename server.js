const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const db = new sqlite3.Database("./database.db");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({
  secret: "sentinelsync_secret",
  resave: false,
  saveUninitialized: true
}));

// Database Setup
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    userID TEXT PRIMARY KEY,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reports (
    reportID INTEGER PRIMARY KEY AUTOINCREMENT,
    userID TEXT,
    eventType TEXT,
    description TEXT,
    dateTime TEXT,
    reporterRole TEXT
  )`);
});

// Landing Page
app.get("/", (req, res) => {
  res.render("index");
});

// Registration Form
app.get("/register", (req, res) => {
  res.render("register");
});

// Register New User
app.post("/register", (req, res) => {
  const { userID, password, role } = req.body;
  db.run("INSERT INTO users (userID, password, role) VALUES (?, ?, ?)", [userID, password, role], err => {
    if (err) return res.send("Error: User ID may already exist.");
    res.redirect("/login");
  });
});

// Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

// verifyLogin()
app.post("/login", (req, res) => {
  const { userID, password } = req.body;
  db.get("SELECT * FROM users WHERE userID = ? AND password = ?", [userID, password], (err, user) => {
    if (user) {
      req.session.userID = user.userID;
      req.session.role = user.role;
      res.redirect("/report");
    } else {
      res.send("Login failed. <a href='/login'>Try again</a>");
    }
  });
});

// getUserInput()
app.get("/report", (req, res) => {
  if (!req.session.userID) return res.redirect("/login");
  res.render("report", { role: req.session.role });
});

// submitReport()
app.post("/submit", (req, res) => {
  const { eventType, description, dateTime } = req.body;
  const userID = req.session.userID;
  const role = req.session.role;
  db.run(`INSERT INTO reports (userID, eventType, description, dateTime, reporterRole) VALUES (?, ?, ?, ?, ?)`,
    [userID, eventType, description, dateTime, role], err => {
      if (err) return res.send("Submission error.");
      res.redirect("/success");
    });
});

// Success Page
app.get("/success", (req, res) => {
  res.render("success");
});

// Admin Dashboard
app.get("/admin", (req, res) => {
  if (req.session.role !== "Admin") return res.send("Access Denied.");
  db.all("SELECT * FROM reports", (err, reports) => {
    res.render("admin", { reports });
  });
});

app.listen(3000, () => console.log("SentinelSync is running on port 3000"));
