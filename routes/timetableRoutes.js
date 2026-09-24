const express = require("express");

function createTimetableRoutes(db) {
    const router = express.Router();

    // GET all timetable entries
    router.get("/", async (req, res) => {
        try {
            const timetable = await db
                .collection("timetable")
                .find({})
                .sort({ day: 1, grade: 1 })
                .toArray();

            res.json(timetable);

        } catch (error) {
            console.error("Error fetching timetable:", error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch timetable"
            });
        }
    });

    // GET one timetable entry
    router.get("/:id", async (req, res) => {
        try {
            const { ObjectId } = require("mongodb");

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid timetable ID"
                });
            }

            const timetableEntry = await db
                .collection("timetable")
                .findOne({
                    _id: new ObjectId(req.params.id)
                });

            if (!timetableEntry) {
                return res.status(404).json({
                    success: false,
                    message: "Timetable entry not found"
                });
            }

            res.json(timetableEntry);

        } catch (error) {
            console.error("Error fetching timetable entry:", error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch timetable entry"
            });
        }
    });

    // POST - Add timetable entry
    router.post("/", async (req, res) => {
        try {
            const {
                day,
                grade,
                teacher,
                subjects,
                duty
            } = req.body;

            if (
                !day ||
                !grade ||
                !teacher ||
                !Array.isArray(subjects) ||
                subjects.length === 0 ||
                !duty
            ) {
                return res.status(400).json({
                    success: false,
                    message: "All timetable fields are required"
                });
            }

            const timetableEntry = {
                day,
                grade,
                teacher,
                subjects,
                duty,
                createdAt: new Date().toISOString()
            };

            const result = await db
                .collection("timetable")
                .insertOne(timetableEntry);

            res.status(201).json({
                success: true,
                message: "Timetable entry saved successfully",
                timetable: {
                    _id: result.insertedId,
                    ...timetableEntry
                }
            });

        } catch (error) {
            console.error("Error adding timetable entry:", error);

            res.status(500).json({
                success: false,
                message: "Failed to save timetable entry"
            });
        }
    });

    // DELETE - Delete timetable entry
    router.delete("/:id", async (req, res) => {
        try {
            const { ObjectId } = require("mongodb");

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid timetable ID"
                });
            }

            const result = await db
                .collection("timetable")
                .deleteOne({
                    _id: new ObjectId(req.params.id)
                });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Timetable entry not found"
                });
            }

            res.json({
                success: true,
                message: "Timetable entry deleted successfully"
            });

        } catch (error) {
            console.error("Error deleting timetable entry:", error);

            res.status(500).json({
                success: false,
                message: "Failed to delete timetable entry"
            });
        }
    });

    return router;
}

module.exports = createTimetableRoutes;