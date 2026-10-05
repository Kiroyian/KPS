// ===============================
// Teacher Assignment Management
// ===============================

const TEACHER_ASSIGNMENTS_API =
    "http://localhost:3000/api/teacherAssignments";

const ASSIGNMENT_TEACHERS_API =
    "http://localhost:3000/api/teachers";

let currentAssignmentId = null;
let editingAssignment = false;


// ===============================
// Initialize
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const openButton =
        document.getElementById("openTeacherAssignmentModal");

    const addButton =
        document.getElementById("addTeacherAssignmentButton");

    const form =
        document.getElementById("teacherAssignmentForm");

    const cancelButton =
        document.getElementById("cancelTeacherAssignmentButton");

    const modal =
        document.getElementById("teacherAssignmentModal");


    if (openButton) {
        openButton.addEventListener("click", openTeacherAssignmentModal);
    }


    if (addButton) {
        addButton.addEventListener("click", openTeacherAssignmentForm);
    }


    if (form) {
        form.addEventListener("submit", handleTeacherAssignmentSubmit);
    }


    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeTeacherAssignmentForm
        );
    }


    if (modal) {
        modal.addEventListener("click", (event) => {

            if (event.target === modal) {
                closeTeacherAssignmentModal();
            }

        });
    }


    fetchTeacherAssignments();
    loadTeachers();

});


// ===============================
// Open Assignment Modal
// ===============================

function openTeacherAssignmentModal() {

    const modal =
        document.getElementById("teacherAssignmentModal");

    if (!modal) {
        console.error("Teacher Assignment modal not found.");
        return;
    }

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");

    closeTeacherAssignmentForm();

    loadTeachers();
    fetchTeacherAssignments();
}


// ===============================
// Close Assignment Modal
// ===============================

function closeTeacherAssignmentModal() {

    const modal =
        document.getElementById("teacherAssignmentModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");

    closeTeacherAssignmentForm();
}


// ===============================
// Open Assignment Form
// ===============================

function openTeacherAssignmentForm() {

    const container =
        document.getElementById(
            "teacherAssignmentFormContainer"
        );

    if (!container) {
        return;
    }

    container.classList.remove("hidden");

    editingAssignment = false;
    currentAssignmentId = null;

    clearTeacherAssignmentForm();

    const saveButton =
        document.getElementById(
            "saveTeacherAssignmentButton"
        );

    if (saveButton) {
        saveButton.textContent = "Save Assignment";
    }

    loadTeachers();

}


// ===============================
// Close Assignment Form
// ===============================

function closeTeacherAssignmentForm() {

    const container =
        document.getElementById(
            "teacherAssignmentFormContainer"
        );

    if (!container) {
        return;
    }

    container.classList.add("hidden");

    clearTeacherAssignmentForm();

    editingAssignment = false;
    currentAssignmentId = null;

    const saveButton =
        document.getElementById(
            "saveTeacherAssignmentButton"
        );

    if (saveButton) {
        saveButton.textContent = "Save Assignment";
    }

}


// ===============================
// Clear Form
// ===============================

function clearTeacherAssignmentForm() {

    const assignmentId =
        document.getElementById("teacherAssignmentId");

    const teacher =
        document.getElementById("assignmentTeacher");

    const teacherClass =
        document.getElementById("assignmentClass");

    const subject =
        document.getElementById("assignmentSubject");


    if (assignmentId) {
        assignmentId.value = "";
    }

    if (teacher) {
        teacher.value = "";
    }

    if (teacherClass) {
        teacherClass.value = "";
    }

    if (subject) {
        subject.value = "";
    }

}


// ===============================
// Load Teachers
// ===============================

function loadTeachers() {

    const teacherSelect =
        document.getElementById("assignmentTeacher");

    if (!teacherSelect) {
        return;
    }

    fetch(ASSIGNMENT_TEACHERS_API)

        .then((response) => {

            if (!response.ok) {
                throw new Error(
                    `Server returned ${response.status}`
                );
            }

            return response.json();

        })

        .then((teachers) => {

            teacherSelect.innerHTML =
                `<option value="">Select teacher</option>`;

            if (!Array.isArray(teachers)) {
                return;
            }

            teachers.forEach((teacher) => {

                const teacherId =
                    teacher._id || teacher.id;

                const option =
                    document.createElement("option");

                option.value = teacherId;

                option.textContent =
                    `${teacher.name || ""} - ${teacher.employeeNo || ""}`;

                teacherSelect.appendChild(option);

            });

        })

        .catch((error) => {

            console.error(
                "Error loading teachers:",
                error
            );

        });

}


// ===============================
// Fetch Assignments
// ===============================

function fetchTeacherAssignments() {

    fetch(TEACHER_ASSIGNMENTS_API)

        .then((response) => {

            if (!response.ok) {
                throw new Error(
                    `Server returned ${response.status}`
                );
            }

            return response.json();

        })

        .then((assignments) => {

            populateTeacherAssignmentsTable(
                assignments
            );

        })

        .catch((error) => {

            console.error(
                "Error fetching teacher assignments:",
                error
            );

            const tableBody =
                document.querySelector(
                    "#teacherAssignmentsTable tbody"
                );

            if (tableBody) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            Unable to load teacher assignments.
                        </td>
                    </tr>
                `;

            }

        });

}


// ===============================
// Populate Assignment Table
// ===============================

function populateTeacherAssignmentsTable(assignments) {

    const tableBody =
        document.querySelector(
            "#teacherAssignmentsTable tbody"
        );

    if (!tableBody) {

        console.error(
            "Teacher assignment table not found."
        );

        return;
    }


    tableBody.innerHTML = "";


    if (
        !Array.isArray(assignments) ||
        assignments.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No teacher assignments found.
                </td>
            </tr>
        `;

        return;
    }


    assignments.forEach((assignment) => {

        const row =
            document.createElement("tr");

        const assignmentId =
            assignment._id || assignment.id;


        row.innerHTML = `
            <td>
                ${escapeAssignmentHTML(
                    assignment.teacherName || ""
                )}
            </td>

            <td>
                ${escapeAssignmentHTML(
                    assignment.employeeNo || ""
                )}
            </td>

            <td>
                ${escapeAssignmentHTML(
                    assignment.class || ""
                )}
            </td>

            <td>
                ${escapeAssignmentHTML(
                    assignment.subject || ""
                )}
            </td>

            <td>

                <button
                    type="button"
                    class="btn btn-outline"
                    onclick="editTeacherAssignment('${assignmentId}')"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="btn btn-danger"
                    onclick="deleteTeacherAssignment('${assignmentId}')"
                >
                    Delete
                </button>

            </td>
        `;

        tableBody.appendChild(row);

    });

}


// ===============================
// Save / Update Assignment
// ===============================

function handleTeacherAssignmentSubmit(event) {

    event.preventDefault();


    const teacherSelect =
        document.getElementById(
            "assignmentTeacher"
        );

    const teacherClass =
        document.getElementById(
            "assignmentClass"
        );

    const subject =
        document.getElementById(
            "assignmentSubject"
        );


    const teacherId =
        teacherSelect.value;

    const selectedOption =
        teacherSelect.options[
            teacherSelect.selectedIndex
        ];


    const teacherText =
        selectedOption
            ? selectedOption.textContent
            : "";


    const teacherParts =
        teacherText.split(" - ");


    const teacherName =
        teacherParts[0] || "";

    const employeeNo =
        teacherParts.slice(1).join(" - ") || "";


    if (
        !teacherId ||
        !teacherClass.value ||
        !subject.value.trim()
    ) {

        alert(
            "Please complete all assignment fields."
        );

        return;
    }


    const assignmentData = {

        teacherId: teacherId,

        teacherName: teacherName,

        employeeNo: employeeNo,

        class: teacherClass.value,

        subject: subject.value.trim()

    };


    let url =
        TEACHER_ASSIGNMENTS_API;

    let method = "POST";


    if (
        editingAssignment &&
        currentAssignmentId
    ) {

        url =
            `${TEACHER_ASSIGNMENTS_API}/${currentAssignmentId}`;

        method = "PUT";

    }


    fetch(url, {

        method: method,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(assignmentData)

    })

        .then((response) => {

            if (!response.ok) {

                return response.json()
                    .then((data) => {

                        throw new Error(
                            data.error ||
                            `Server returned ${response.status}`
                        );

                    });

            }

            return response.json();

        })

        .then(() => {

            alert(
                editingAssignment
                    ? "Teacher assignment updated successfully."
                    : "Teacher assigned successfully."
            );

            closeTeacherAssignmentForm();

            fetchTeacherAssignments();

        })

        .catch((error) => {

            console.error(
                "Error saving teacher assignment:",
                error
            );

            alert(
                error.message ||
                "Unable to save teacher assignment."
            );

        });

}


// ===============================
// Edit Assignment
// ===============================

function editTeacherAssignment(assignmentId) {

    if (!assignmentId) {

        console.error(
            "Assignment ID is missing."
        );

        return;
    }


    currentAssignmentId =
        assignmentId;

    editingAssignment = true;


    fetch(
        `${TEACHER_ASSIGNMENTS_API}/${assignmentId}`
    )

        .then((response) => {

            if (!response.ok) {

                throw new Error(
                    `Server returned ${response.status}`
                );

            }

            return response.json();

        })

        .then((assignment) => {

            const formContainer =
                document.getElementById(
                    "teacherAssignmentFormContainer"
                );

            if (formContainer) {
                formContainer.classList.remove("hidden");
            }


            loadTeachers();


            setTimeout(() => {

                const teacherSelect =
                    document.getElementById(
                        "assignmentTeacher"
                    );

                const teacherClass =
                    document.getElementById(
                        "assignmentClass"
                    );

                const subject =
                    document.getElementById(
                        "assignmentSubject"
                    );


                if (teacherSelect) {
                    teacherSelect.value =
                        assignment.teacherId || "";
                }

                if (teacherClass) {
                    teacherClass.value =
                        assignment.class || "";
                }

                if (subject) {
                    subject.value =
                        assignment.subject || "";
                }


                const saveButton =
                    document.getElementById(
                        "saveTeacherAssignmentButton"
                    );

                if (saveButton) {
                    saveButton.textContent =
                        "Update Assignment";
                }

            }, 200);

        })

        .catch((error) => {

            console.error(
                "Error fetching teacher assignment:",
                error
            );

            alert(
                "Unable to load teacher assignment."
            );

        });

}


// ===============================
// Delete Assignment
// ===============================

function deleteTeacherAssignment(assignmentId) {

    if (!assignmentId) {

        console.error(
            "Assignment ID is missing."
        );

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this teacher assignment?"
        );


    if (!confirmed) {
        return;
    }


    fetch(
        `${TEACHER_ASSIGNMENTS_API}/${assignmentId}`,
        {
            method: "DELETE"
        }
    )

        .then((response) => {

            if (!response.ok) {

                return response.json()
                    .then((data) => {

                        throw new Error(
                            data.error ||
                            `Server returned ${response.status}`
                        );

                    });

            }

            return response.json();

        })

        .then(() => {

            alert(
                "Teacher assignment deleted successfully."
            );

            fetchTeacherAssignments();

        })

        .catch((error) => {

            console.error(
                "Error deleting teacher assignment:",
                error
            );

            alert(
                error.message ||
                "Unable to delete teacher assignment."
            );

        });

}


// ===============================
// HTML Escaping
// ===============================

function escapeAssignmentHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}