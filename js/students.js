// ==========================================
// KPS Student Management
// ==========================================

const STUDENTS_API = "http://localhost:3000/api/students";

let currentStudents = [];
let editingStudentId = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeStudentManagement();
});

function initializeStudentManagement() {

    const openButton = document.getElementById("openStudentManagementModal");
    const addButton = document.getElementById("addStudentButton");
    const cancelButton = document.getElementById("cancelStudentButton");
    const studentForm = document.getElementById("studentForm");

    if (openButton) {
        openButton.addEventListener("click", () => {
            openStudentManagement();
        });
    }

    if (addButton) {
        addButton.addEventListener("click", () => {
            showStudentForm();
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            hideStudentForm();
        });
    }

    if (studentForm) {
        studentForm.addEventListener("submit", saveStudent);
    }
}


// ==========================================
// Open Student Management
// ==========================================

async function openStudentManagement() {

    const modal = document.getElementById("studentManagementModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");

    hideStudentForm();

    await loadStudents();
}


// ==========================================
// Load Students
// ==========================================

async function loadStudents() {

    const tableBody = document.querySelector(
        "#studentsManagementTable tbody"
    );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="6">Loading students...</td>
        </tr>
    `;

    try {

        const response = await fetch(STUDENTS_API);

        if (!response.ok) {
            throw new Error("Failed to load students");
        }

        currentStudents = await response.json();

        renderStudents();

    } catch (error) {

        console.error("Error loading students:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Failed to load students.
                </td>
            </tr>
        `;
    }
}


// ==========================================
// Render Students
// ==========================================

function renderStudents() {

    const tableBody = document.querySelector(
        "#studentsManagementTable tbody"
    );

    if (!tableBody) {
        return;
    }

    if (currentStudents.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No students found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = currentStudents.map(student => {

        const admissionNumber =
            student.admissionNo ||
            student.admissionNumber ||
            "";

        return `
            <tr>
                <td>${escapeHtml(student.name || "")}</td>
                <td>${escapeHtml(admissionNumber)}</td>
                <td>${escapeHtml(student.class || "")}</td>
                <td>${escapeHtml(student.gender || "")}</td>
                <td>${escapeHtml(student.age || "")}</td>
                <td>
                    <button
                        type="button"
                        class="btn btn-secondary student-edit-button"
                        data-id="${student._id}">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-outline student-delete-button"
                        data-id="${student._id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    }).join("");

    document.querySelectorAll(".student-edit-button").forEach(button => {

        button.addEventListener("click", () => {
            editStudent(button.dataset.id);
        });

    });

    document.querySelectorAll(".student-delete-button").forEach(button => {

        button.addEventListener("click", () => {
            deleteStudent(button.dataset.id);
        });

    });
}


// ==========================================
// Show Add/Edit Form
// ==========================================

function showStudentForm(student = null) {

    const formContainer =
        document.getElementById("studentFormContainer");

    const form =
        document.getElementById("studentForm");

    if (!formContainer || !form) {
        return;
    }

    formContainer.classList.remove("hidden");

    if (student) {

        editingStudentId = student._id;

        document.getElementById("studentId").value =
            student._id || "";

        document.getElementById("studentName").value =
            student.name || "";

        document.getElementById("studentAdmissionNo").value =
            student.admissionNo ||
            student.admissionNumber ||
            "";

        document.getElementById("studentClass").value =
            student.class || "";

        document.getElementById("studentGender").value =
            student.gender || "";

        document.getElementById("studentAge").value =
            student.age || "";

        document.getElementById("saveStudentButton").textContent =
            "Update Student";

    } else {

        editingStudentId = null;

        form.reset();

        document.getElementById("studentId").value = "";

        document.getElementById("saveStudentButton").textContent =
            "Save Student";
    }
}


// ==========================================
// Hide Form
// ==========================================

function hideStudentForm() {

    const formContainer =
        document.getElementById("studentFormContainer");

    const form =
        document.getElementById("studentForm");

    if (formContainer) {
        formContainer.classList.add("hidden");
    }

    if (form) {
        form.reset();
    }

    editingStudentId = null;
}


// ==========================================
// Save Student
// ==========================================

async function saveStudent(event) {

    event.preventDefault();

    const student = {

        name:
            document.getElementById("studentName").value.trim(),

        admissionNo:
            document.getElementById("studentAdmissionNo").value.trim(),

        class:
            document.getElementById("studentClass").value,

        gender:
            document.getElementById("studentGender").value,

        age:
            document.getElementById("studentAge").value.trim()
    };

    if (
        !student.name ||
        !student.admissionNo ||
        !student.class ||
        !student.gender ||
        !student.age
    ) {

        alert("Please complete all student fields.");

        return;
    }

    const isEditing = Boolean(editingStudentId);

    const url = isEditing
        ? `${STUDENTS_API}/${editingStudentId}`
        : STUDENTS_API;

    const method = isEditing
        ? "PUT"
        : "POST";

    try {

        const response = await fetch(url, {

            method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(student)
        });

        const result = await response.json();

        if (!response.ok) {

            alert(result.message || "Failed to save student.");

            return;
        }

        alert(
            isEditing
                ? "Student updated successfully."
                : "Student added successfully."
        );

        hideStudentForm();

        await loadStudents();

    } catch (error) {

        console.error("Error saving student:", error);

        alert(
            "Unable to connect to the KPS backend."
        );
    }
}


// ==========================================
// Edit Student
// ==========================================

function editStudent(id) {

    const student = currentStudents.find(
        item => item._id === id
    );

    if (!student) {
        alert("Student record not found.");

        return;
    }

    showStudentForm(student);
}


// ==========================================
// Delete Student
// ==========================================

async function deleteStudent(id) {

    const student = currentStudents.find(
        item => item._id === id
    );

    if (!student) {
        alert("Student record not found.");

        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${STUDENTS_API}/${id}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {

            alert(
                result.message ||
                "Failed to delete student."
            );

            return;
        }

        alert("Student deleted successfully.");

        await loadStudents();

    } catch (error) {

        console.error("Error deleting student:", error);

        alert(
            "Unable to connect to the KPS backend."
        );
    }
}


// ==========================================
// Close Student Management Modal
// ==========================================

document.addEventListener("click", event => {

    const closeButton =
        event.target.closest(
            '[data-modal="studentManagementModal"]'
        );

    if (!closeButton) {
        return;
    }

    const modal =
        document.getElementById("studentManagementModal");

    if (modal) {

        modal.classList.add("hidden");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    hideStudentForm();
});


// ==========================================
// HTML Safety
// ==========================================

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}