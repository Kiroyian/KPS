// ===============================
// Teacher Routes
// ===============================

const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

function createTeacherRoutes(db) {

    // ===============================
    // GET all teachers
    // ===============================

    router.get("/", async (req, res) => {
        try {
            const teachers = await db
                .collection("teachers")
                .find({})
                .sort({ _id: -1 })
                .toArray();

            res.json(teachers);

        } catch (error) {
            console.error("Error fetching teachers:", error);

            res.status(500).json({
                error: "Failed to fetch teachers"
            });
        }
    });


    // ===============================
    // GET one teacher
    // ===============================

    router.get("/:id", async (req, res) => {
        try {

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    error: "Invalid teacher ID"
                });
            }

            const teacher = await db
                .collection("teachers")
                .findOne({
                    _id: new ObjectId(req.params.id)
                });

            if (!teacher) {
                return res.status(404).json({
                    error: "Teacher not found"
                });
            }

            res.json(teacher);

        } catch (error) {
            console.error("Error fetching teacher:", error);

            res.status(500).json({
                error: "Failed to fetch teacher"
            });
        }
    });


    // ===============================
    // POST - Add teacher
    // ===============================

    router.post("/", async (req, res) => {
        try {

            const {
                name,
                employeeNo,
                subject,
                class: teacherClass
            } = req.body;

            if (!name || !employeeNo || !subject || !teacherClass) {
                return res.status(400).json({
                    error: "All teacher fields are required"
                });
            }

            const newTeacher = {
                name: name.trim(),
                employeeNo: employeeNo.trim(),
                subject: subject.trim(),
                class: teacherClass
            };

            const result = await db
                .collection("teachers")
                .insertOne(newTeacher);

            res.status(201).json({
                message: "Teacher added successfully",
                id: result.insertedId
            });

        } catch (error) {
            console.error("Error adding teacher:", error);

            res.status(500).json({
                error: "Failed to add teacher"
            });
        }
    });


    // ===============================
    // PUT - Update teacher
    // ===============================

    router.put("/:id", async (req, res) => {
        try {

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    error: "Invalid teacher ID"
                });
            }

            const {
                name,
                employeeNo,
                subject,
                class: teacherClass
            } = req.body;

            if (!name || !employeeNo || !subject || !teacherClass) {
                return res.status(400).json({
                    error: "All teacher fields are required"
                });
            }

            const updatedTeacher = {
                name: name.trim(),
                employeeNo: employeeNo.trim(),
                subject: subject.trim(),
                class: teacherClass
            };

            const result = await db
                .collection("teachers")
                .updateOne(
                    {
                        _id: new ObjectId(req.params.id)
                    },
                    {
                        $set: updatedTeacher
                    }
                );

            if (!result.matchedCount) {
                return res.status(404).json({
                    error: "Teacher not found"
                });
            }

            res.json({
                message: "Teacher updated successfully"
            });

        } catch (error) {
            console.error("Error updating teacher:", error);

            res.status(500).json({
                error: "Failed to update teacher"
            });
        }
    });


    // ===============================
    // DELETE teacher
    // ===============================

    router.delete("/:id", async (req, res) => {
        try {

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    error: "Invalid teacher ID"
                });
            }

            const result = await db
                .collection("teachers")
                .deleteOne({
                    _id: new ObjectId(req.params.id)
                });

            if (!result.deletedCount) {
                return res.status(404).json({
                    error: "Teacher not found"
                });
            }

            res.json({
                message: "Teacher deleted successfully"
            });

        } catch (error) {
            console.error("Error deleting teacher:", error);

            res.status(500).json({
                error: "Failed to delete teacher"
            });
        }
    });


    return router;
}

module.exports = createTeacherRoutes;