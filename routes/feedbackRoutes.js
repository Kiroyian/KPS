const express = require("express");
const { ObjectId } = require("mongodb");

function createFeedbackRoutes(db) {
    const router = express.Router();

    // GET all feedback
    router.get("/", async (req, res) => {
        try {
            const feedbacks = await db
                .collection("feedback")
                .find({})
                .sort({ _id: -1 })
                .toArray();

            res.json(feedbacks);
        } catch (error) {
            console.error("Error fetching feedback:", error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch feedback"
            });
        }
    });

    // GET one feedback message by MongoDB ID
    router.get("/:id", async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid feedback ID"
                });
            }

            const feedback = await db
                .collection("feedback")
                .findOne({
                    _id: new ObjectId(req.params.id)
                });

            if (!feedback) {
                return res.status(404).json({
                    success: false,
                    message: "Feedback not found"
                });
            }

            res.json(feedback);
        } catch (error) {
            console.error("Error fetching feedback:", error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch feedback"
            });
        }
    });

    // POST - Add new feedback
    router.post("/", async (req, res) => {
        try {
            const {
                name,
                email,
                phone,
                topic,
                message
            } = req.body;

            if (!name || !email || !phone || !topic || !message) {
                return res.status(400).json({
                    success: false,
                    message: "All feedback fields are required"
                });
            }

            const feedback = {
                name,
                email,
                phone,
                topic,
                message,
                createdAt: new Date().toISOString(),
                status: "New",
                response: ""
            };

            const result = await db
                .collection("feedback")
                .insertOne(feedback);

            res.status(201).json({
                success: true,
                message: "Feedback submitted successfully",
                feedback: {
                    _id: result.insertedId,
                    ...feedback
                }
            });

        } catch (error) {
            console.error("Error adding feedback:", error);

            res.status(500).json({
                success: false,
                message: "Failed to submit feedback"
            });
        }
    });

    // PUT - Update feedback
    router.put("/:id", async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid feedback ID"
                });
            }

            const feedbackId = new ObjectId(req.params.id);

            const {
                name,
                email,
                phone,
                topic,
                message,
                status,
                response
            } = req.body;

            if (!name || !email || !phone || !topic || !message) {
                return res.status(400).json({
                    success: false,
                    message: "Name, email, phone, topic and message are required"
                });
            }

            const existingFeedback = await db
                .collection("feedback")
                .findOne({
                    _id: feedbackId
                });

            if (!existingFeedback) {
                return res.status(404).json({
                    success: false,
                    message: "Feedback not found"
                });
            }

            const updatedFeedback = {
                name,
                email,
                phone,
                topic,
                message,
                status: status || "New",
                response: response || ""
            };

            await db
                .collection("feedback")
                .updateOne(
                    { _id: feedbackId },
                    { $set: updatedFeedback }
                );

            const feedback = await db
                .collection("feedback")
                .findOne({
                    _id: feedbackId
                });

            res.json({
                success: true,
                message: "Feedback updated successfully",
                feedback
            });

        } catch (error) {
            console.error("Error updating feedback:", error);

            res.status(500).json({
                success: false,
                message: "Failed to update feedback"
            });
        }
    });

    // DELETE - Delete feedback
    router.delete("/:id", async (req, res) => {
        try {
            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid feedback ID"
                });
            }

            const result = await db
                .collection("feedback")
                .deleteOne({
                    _id: new ObjectId(req.params.id)
                });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Feedback not found"
                });
            }

            res.json({
                success: true,
                message: "Feedback deleted successfully"
            });

        } catch (error) {
            console.error("Error deleting feedback:", error);

            res.status(500).json({
                success: false,
                message: "Failed to delete feedback"
            });
        }
    });

    return router;
}

module.exports = createFeedbackRoutes;