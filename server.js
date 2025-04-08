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
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    reportID INTEGER PRIMARY KEY AUTOINCREMENT,
    dateTime TEXT,
    gender TEXT,
    unit TEXT,
    personsInvolved TEXT,
    eventType TEXT,
    treatments TEXT,
    bodySite TEXT,
    injuryType TEXT,
    description TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    userID TEXT PRIMARY KEY,
    password TEXT,
    role TEXT
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
// need to fix the failed login here
app.post("/login", (req, res) => {
  const { userID, password } = req.body;
  console.log("Login attempt:", userID, password); // 🪵 Log what's submitted

  db.get(
    "SELECT * FROM users WHERE userID = ? AND password = ?",
    [userID, password],
    (err, user) => {
      if (err) {
        console.error("DB Error:", err); // 🪵 Show any DB errors
        return res.send("An error occurred during login.");
      }

      console.log("Found user:", user); // 🪵 See if a user was matched

      if (user) {
        req.session.userID = user.userID;
        req.session.role = user.role;
        console.log("Login successful, redirecting to /report");
        res.redirect("/report");
      } else {
        console.log("Login failed: user not found.");
        res.send(`<h2>Login failed</h2><p>Username or password incorrect.</p><a href='/login'>Try again</a>`);
      }
    }
  );
});



// getUserInput()
app.get("/report", (req, res) => {
  if (!req.session.userID) return res.redirect("/login");
  res.render("report", { role: req.session.role });
});

// submitReport()
app.post("/submit", (req, res) => {
  const {
    dateTime,
    gender,
    unit,
    eventType,
    eventTypeOther,
    bodySite,
    bodySiteOther,
    injuryType,
    injuryOther,
    description
  } = req.body;

  // Combine "Other" inputs if selected
  const fullEventType = (eventType === "Other") ? eventTypeOther : eventType;
  const fullBodySite = (bodySite === "Other") ? bodySiteOther : bodySite;
  const fullInjuryType = (injuryType === "Other") ? injuryOther : injuryType;

  // Join multi-select checkboxes (array) into CSV-style string
  const personsInvolved = Array.isArray(req.body.personsInvolved)
    ? req.body.personsInvolved.join(", ")
    : req.body.personsInvolved || "";

  const treatments = Array.isArray(req.body.treatments)
    ? req.body.treatments.join(", ")
    : req.body.treatments || "";

  db.run(
    `INSERT INTO reports 
      (dateTime, gender, unit, personsInvolved, eventType, treatments, bodySite, injuryType, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dateTime,
      gender,
      unit,
      personsInvolved,
      fullEventType,
      treatments,
      fullBodySite,
      fullInjuryType,
      description
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("Error submitting report.");
      }
      res.redirect("/success");
    }
  );
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

// CSV Export Route
const fs = require("fs");
const { Parser } = require("json2csv");

app.get("/export", (req, res) => {
  if (req.session.role !== "Admin") return res.status(403).send("Access denied");

  db.all("SELECT * FROM reports", (err, rows) => {
    if (err) return res.send("Error exporting data.");

    const parser = new Parser();
    const csv = parser.parse(rows);

    fs.writeFileSync("reports_export.csv", csv);

    res.download("reports_export.csv", "sentinelsync_reports.csv", (err) => {
      if (err) console.error("Export failed:", err);
    });
  });
});



app.listen(3000, () => console.log("SentinelSync is running on port 3000"));
