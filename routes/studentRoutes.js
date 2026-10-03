const express = require("express");

const REQUIRED_ADMISSION_REQUIREMENTS = [
    "applicationForm",
    "birthCertificate",
    "guardianId",
    "passportPhotos"
];
const OPTIONAL_ADMISSION_REQUIREMENTS = [
    "previousSchoolReport",
    "medicalInformation"
];
const ALL_ADMISSION_REQUIREMENTS = [
    ...REQUIRED_ADMISSION_REQUIREMENTS,
    ...OPTIONAL_ADMISSION_REQUIREMENTS
];

function isAdmissionChecklistComplete(requirements) {
    return REQUIRED_ADMISSION_REQUIREMENTS.every(key => requirements[key] === "verified") &&
        OPTIONAL_ADMISSION_REQUIREMENTS.every(key => ["verified", "notApplicable"].includes(requirements[key]));
}

function createStudentRoutes(db) {
    const router = express.Router();

    // GET all students
    router.get("/", async (req, res) => {
        try {
            const students = await db
                .collection("students")
                .find({})
                .toArray();

            res.json(students);
        } catch (error) {
            console.error("Error fetching students:", error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch students"
            });
        }
    });

    router.patch("/:id/admission-status", async (req, res) => {
        try {
            const { ObjectId } = require("mongodb");
            const { admissionStatus } = req.body;

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID"
                });
            }

            if (!["Admitted", "Waiting approval"].includes(admissionStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Admission status must be Admitted or Waiting approval"
                });
            }

            const studentId = new ObjectId(req.params.id);
            const existingStudent = await db
                .collection("students")
                .findOne({ _id: studentId });

            if (!existingStudent) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });
            }

            if (admissionStatus === "Admitted" &&
                !isAdmissionChecklistComplete(existingStudent.admissionRequirements || {})) {
                return res.status(409).json({
                    success: false,
                    message: "Verify all admission requirements before admitting this student"
                });
            }

            const result = await db
                .collection("students")
                .updateOne(
                    { _id: studentId },
                    { $set: { admissionStatus } }
                );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });
            }

            const student = await db
                .collection("students")
                .findOne({ _id: studentId });

            res.json({
                success: true,
                message: "Admission status updated successfully",
                student
            });
        } catch (error) {
            console.error("Error updating admission status:", error);

            res.status(500).json({
                success: false,
                message: "Failed to update admission status"
            });
        }
    });

    router.patch("/:id/admission-review", async (req, res) => {
        try {
            const { ObjectId } = require("mongodb");
            const { admissionRequirements, admissionStatus } = req.body;

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID"
                });
            }

            if (!admissionRequirements || typeof admissionRequirements !== "object" ||
                Array.isArray(admissionRequirements) ||
                ALL_ADMISSION_REQUIREMENTS.some(key => !["pending", "verified", "notApplicable"].includes(admissionRequirements[key])) ||
                Object.keys(admissionRequirements).some(key => !ALL_ADMISSION_REQUIREMENTS.includes(key)) ||
                REQUIRED_ADMISSION_REQUIREMENTS.some(key => admissionRequirements[key] === "notApplicable")) {
                return res.status(400).json({
                    success: false,
                    message: "Provide a valid status for every admission requirement"
                });
            }

            if (admissionStatus !== undefined && !["Admitted", "Waiting approval"].includes(admissionStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Admission status must be Admitted or Waiting approval"
                });
            }

            const studentId = new ObjectId(req.params.id);
            const existingStudent = await db
                .collection("students")
                .findOne({ _id: studentId });

            if (!existingStudent) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });
            }

            if ((admissionStatus === "Admitted" ||
                (admissionStatus === undefined && existingStudent.admissionStatus === "Admitted")) &&
                !isAdmissionChecklistComplete(admissionRequirements)) {
                return res.status(409).json({
                    success: false,
                    message: "Verify all admission requirements before admitting this student"
                });
            }

            const update = {
                admissionRequirements,
                admissionRequirementsUpdatedAt: new Date().toISOString()
            };
            if (admissionStatus !== undefined) {
                update.admissionStatus = admissionStatus;
            }

            await db.collection("students").updateOne(
                { _id: studentId },
                { $set: update }
            );

            const student = await db
                .collection("students")
                .findOne({ _id: studentId });

            res.json({
                success: true,
                message: "Admission review saved successfully",
                student
            });
        } catch (error) {
            console.error("Error saving admission review:", error);

            res.status(500).json({
                success: false,
                message: "Failed to save admission review"
            });
        }
    });

    // GET one student by MongoDB ID
    router.get("/:id", async (req, res) => {
        try {
            const { ObjectId } = require("mongodb");

            if (!ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID"
                });
            }

            const student = await db
                .collection("students")
                .findOne({
                    _id: new ObjectId(req.params.id)
                });

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });
            }

            res.json(student);
        } catch (error) {
            console.error("Error fetching student:", error);

            res.status(500).json({
                success: false,
                message: "Failed to fetch student"
            });
        }
    });

// POST - Add a new student
router.post("/", async (req, res) => {
    try {
        const { name, admissionNo, class: studentClass, gender, age } = req.body;

        if (!name || !admissionNo || !studentClass || !gender || !age) {
            return res.status(400).json({
                success: false,
                message: "All student fields are required"
            });
        }

        const existingStudent = await db
            .collection("students")
            .findOne({ admissionNo });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: "Admission number already exists"
            });
        }

        const student = {
            id: Date.now(),
            name,
            admissionNo,
            class: studentClass,
            gender,
            age,
            createdAt: new Date().toISOString()
        };

        const result = await db
            .collection("students")
            .insertOne(student);

        res.status(201).json({
            success: true,
            message: "Student added successfully",
            student: {
                _id: result.insertedId,
                ...student
            }
        });

    } catch (error) {
        console.error("Error adding student:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add student"
        });
    }
});

// DELETE - Delete a student
router.delete("/:id", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const result = await db
            .collection("students")
            .deleteOne({
                _id: new ObjectId(req.params.id)
            });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting student:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
});

// PUT - Update a student
router.put("/:id", async (req, res) => {
    try {
        const { ObjectId } = require("mongodb");

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const { name, admissionNo, class: studentClass, gender, age } = req.body;

        if (!name || !admissionNo || !studentClass || !gender || !age) {
            return res.status(400).json({
                success: false,
                message: "All student fields are required"
            });
        }

        const studentId = new ObjectId(req.params.id);

        const existingStudent = await db
            .collection("students")
            .findOne({ _id: studentId });

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const duplicateStudent = await db
            .collection("students")
            .findOne({
                _id: { $ne: studentId },
                $or: [
                    { admissionNo },
                    { admissionNumber: admissionNo }
                ]
            });

        if (duplicateStudent) {
            return res.status(409).json({
                success: false,
                message: "Admission number already exists"
            });
        }

        const updatedStudent = {
            name,
            admissionNo,
            class: studentClass,
            gender,
            age
        };

        const result = await db
            .collection("students")
            .updateOne(
                { _id: studentId },
                { $set: updatedStudent }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const student = await db
            .collection("students")
            .findOne({ _id: studentId });

        res.json({
            success: true,
            message: "Student updated successfully",
            student
        });

    } catch (error) {
        console.error("Error updating student:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
});

    return router;
}

module.exports = createStudentRoutes;