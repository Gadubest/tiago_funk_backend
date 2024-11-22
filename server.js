const {Pool} = require(pg)
require("dotenv").config(); 
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

// Initialize PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


const app = express();
app.use(bodyParser.json());


(async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        age INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await pool.query(createTableQuery);
    console.log("Table 'people' is ready!");
  } catch (error) {
    console.error("Error creating table:", error);
  }
})();

app.post("/people", async (req, res) => {
  const { name, age } = req.body;
  try {
    const insertQuery = `INSERT INTO people (name, age) VALUES ($1, $2) RETURNING *;`;
    const result = await pool.query(insertQuery, [name, age]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating person:", error);
    res.status(500).json({ error: "Failed to create person" });
  }
});

app.get("/people/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const selectQuery = `SELECT name, age FROM people WHERE id = $1;`;
    const result = await pool.query(selectQuery, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching person:", error);
    res.status(500).json({ error: "Failed to fetch person" });
  }
});

app.put("/people/:id", async (req, res) => {
  const { id } = req.params;
  const { name, age } = req.body;
  try {
    const updateQuery = `
      UPDATE people
      SET name = COALESCE($1, name), age = COALESCE($2, age)
      WHERE id = $3
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [name, age, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating person:", error);
    res.status(500).json({ error: "Failed to update person" });
  }
});

app.delete("/people/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteQuery = `DELETE FROM people WHERE id = $1 RETURNING *;`;
    const result = await pool.query(deleteQuery, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }
    res.json({ message: "Person deleted successfully", person: result.rows[0] });
  } catch (error) {
    console.error("Error deleting person:", error);
    res.status(500).json({ error: "Failed to delete person" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});