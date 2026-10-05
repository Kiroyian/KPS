// ===============================
// Teacher Assignment Routes
// ===============================

const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

function createTeacherAssignmentRoutes(db) {

    // ===============================
    // GET all assignments
    // ===============================

    router.get("/", async (req, res) => {
        try {

            const assignments = await db
                .collection("teacherAssignments")
                .find({})
                .sort({ _id: -1 })
                .toArray();

            res.json(assignments);

        } catch (error) {

            console.error("Error fetching teacher assignments:", error);

            res.status(500).json({
                error: "Failed to fetch teacher assignments"
            });
        }
    });


    // ===============================
    // GET one assignment
    // ===============================

    router.get("/:id", async (req, res) => {
        try {

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    error: "Invalid assignment ID"
                });
            }

            const assignment = await db
                .collection("teacherAssignments")
                .findOne({
                    _id: new ObjectId(req.params.id)
                });

            if (!assignment) {
                return res.status(404).json({
                    error: "Assignment not found"
                });
            }

            res.json(assignment);

        } catch (error) {

            console.error("Error fetching assignment:", error);

            res.status(500).json({
                error: "Failed to fetch assignment"
            });
        }
    });


    // ===============================
    // POST - Create assignment
    // ===============================

    router.post("/", async (req, res) => {
        try {

            const {
                teacherId,
                teacherName,
                employeeNo,
                class: teacherClass,
                subject
            } = req.body;

            if (
                !teacherId ||
                !teacherName ||
                !employeeNo ||
                !teacherClass ||
                !subject
            ) {
                return res.status(400).json({
                    error: "All assignment fields are required"
                });
            }

            if (!ObjectId.isValid(teacherId)) {
                return res.status(400).json({
                    error: "Invalid teacher ID"
                });
            }

            const newAssignment = {
                teacherId: new ObjectId(teacherId),
                teacherName: teacherName.trim(),
                employeeNo: employeeNo.trim(),
                class: teacherClass,
                subject: subject.trim(),
                createdAt: new Date()
            };

            const result = await db
                .collection("teacherAssignments")
                .insertOne(newAssignment);

            res.status(201).json({
                message: "Teacher assigned successfully",
                id: result.insertedId
            });

        } catch (error) {

            console.error("Error creating teacher assignment:", error);

            res.status(500).json({
                error: "Failed to create teacher assignment"
            });
        }
    });


    // ===============================
    // PUT - Update assignment
    // ===============================

    router.put("/:id", async (req, res) => {
        try {

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    error: "Invalid assignment ID"
                });
            }

            const {
                teacherId,
                teacherName,
                employeeNo,
                class: teacherClass,
                subject
            } = req.body;

            if (
                !teacherId ||
                !teacherName ||
                !employeeNo ||
                !teacherClass ||
                !subject
            ) {
                return res.status(400).json({
                    error: "All assignment fields are required"
                });
            }

            if (!ObjectId.isValid(teacherId)) {
                return res.status(400).json({
                    error: "Invalid teacher ID"
                });
            }

            const updatedAssignment = {
                teacherId: new ObjectId(teacherId),
                teacherName: teacherName.trim(),
                employeeNo: employeeNo.trim(),
                class: teacherClass,
                subject: subject.trim(),
                updatedAt: new Date()
            };

            const result = await db
                .collection("teacherAssignments")
                .updateOne(
                    {
                        _id: new ObjectId(req.params.id)
                    },
                    {
                        $set: updatedAssignment
                    }
                );

            if (!result.matchedCount) {
                return res.status(404).json({
                    error: "Assignment not found"
                });
            }

            res.json({
                message: "Teacher assignment updated successfully"
            });

        } catch (error) {

            console.error("Error updating teacher assignment:", error);

            res.status(500).json({
                error: "Failed to update teacher assignment"
            });
        }
    });


    // ===============================
    // DELETE assignment
    // ===============================

    router.delete("/:id", async (req, res) => {
        try {

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    error: "Invalid assignment ID"
                });
            }

            const result = await db
                .collection("teacherAssignments")
                .deleteOne({
                    _id: new ObjectId(req.params.id)
                });

            if (!result.deletedCount) {
                return res.status(404).json({
                    error: "Assignment not found"
                });
            }

            res.json({
                message: "Teacher assignment deleted successfully"
            });

        } catch (error) {

            console.error("Error deleting teacher assignment:", error);

            res.status(500).json({
                error: "Failed to delete teacher assignment"
            });
        }
    });


    return router;
}

module.exports = createTeacherAssignmentRoutes;