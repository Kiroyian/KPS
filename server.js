const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const createStudentRoutes = require("./routes/studentRoutes");

const app = express();
const PORT = 3000;

const MONGO_URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "KPS";

const client = new MongoClient(MONGO_URI);

let db;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health", async (req, res) => {
    try {
        await db.command({ ping: 1 });

        res.json({
            success: true,
            message: "KPS backend is running",
            database: DB_NAME
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

async function startServer() {
    try {
        await client.connect();

        db = client.db(DB_NAME);

        app.use("/api/students", createStudentRoutes(db));

        console.log("Connected to MongoDB");
        console.log(`Database: ${DB_NAME}`);

        app.listen(PORT, () => {
            console.log(`KPS backend running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
}

startServer();