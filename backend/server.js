const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

// =====================
// DB CONNECTION
// =====================
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cni_stages_formations",
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Error:", err.message);
  } else {
    console.log("✅ Connexion MySQL réussie !");
  }
});

// =====================
// REGISTER
// =====================
app.post("/register", (req, res) => {
  const { nom, prenom, email, password } = req.body;

  const sql =
    "INSERT INTO stagiaire (nom, prenom, email, password, statut) VALUES (?, ?, ?, ?, 'En attente')";

  db.query(sql, [nom, prenom, email, password], (err) => {
    if (err) {
      console.error("REGISTER ERROR:", err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          Status: "Error",
          Message: "Email déjà utilisé",
        });
      }

      return res.status(500).json({
        Status: "Error",
        Message: "Erreur serveur",
      });
    }

    return res.json({ Status: "Success" });
  });
});

// =====================
// LOGIN (FIXED 100% SAFE)
// =====================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("LOGIN REQUEST:", req.body);

  // ---- STUDENT CHECK
  const sqlStudent =
    "SELECT * FROM stagiaire WHERE email = ? AND password = ?";

  db.query(sqlStudent, [email, password], (err, data) => {
    if (err) {
      console.error("DB ERROR:", err);
      return res.status(500).json({
        Status: "Error",
        Message: "DB error",
      });
    }

    if (data && data.length > 0) {
      return res.json({
        Status: "Success",
        role: "student",
        user: data[0],
      });
    }

    // ---- ADMIN CHECK
    const sqlAdmin =
      "SELECT * FROM employe WHERE email = ? AND password = ?";

    db.query(sqlAdmin, [email, password], (err2, admin) => {
      if (err2) {
        console.error("DB ERROR:", err2);
        return res.status(500).json({
          Status: "Error",
          Message: "DB error",
        });
      }

      if (admin && admin.length > 0) {
        return res.json({
          Status: "Success",
          role: "admin",
          user: admin[0],
        });
      }

      return res.status(401).json({
        Status: "Error",
        Message: "Email ou mot de passe incorrect",
      });
    });
  });
});

// =====================
// GET ALL REQUESTS
// =====================
app.get("/all-requests", (req, res) => {
  const sql = "SELECT * FROM stagiaire";

  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        Status: "Error",
      });
    }

    return res.json(data);
  });
});

// =====================
// UPDATE STATUS
// =====================
app.put("/update-status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = "UPDATE stagiaire SET statut = ? WHERE id = ?";

  db.query(sql, [status, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        Status: "Error",
      });
    }

    return res.json({
      Status: "Success",
    });
  });
});

// =====================
// DELETE
// =====================
app.delete("/delete-request/:id", (req, res) => {
  const sql = "DELETE FROM stagiaire WHERE id = ?";

  db.query(sql, [req.params.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        Status: "Error",
      });
    }

    return res.json({
      Status: "Success",
    });
  });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});