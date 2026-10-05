// ===============================
// Teacher Management
// ===============================

const TEACHERS_API = "http://localhost:3000/api/teachers";

let currentTeacherId = null;
let editingTeacher = false;

document.addEventListener("DOMContentLoaded", () => {
  const openTeacherButton = document.getElementById("openTeacherManagementModal");
  const addTeacherButton = document.getElementById("addTeacherButton");
  const teacherForm = document.getElementById("teacherForm");
  const cancelTeacherButton = document.getElementById("cancelTeacherButton");
  const teacherModal = document.getElementById("teacherManagementModal");

  // Open Teacher Management
  if (openTeacherButton) {
    openTeacherButton.addEventListener("click", () => {
      openTeacherManagement();
    });
  }

  // Show Add Teacher form
  if (addTeacherButton) {
    addTeacherButton.addEventListener("click", () => {
      openTeacherForm();
    });
  }

  // Submit Add/Edit Teacher form
  if (teacherForm) {
    teacherForm.addEventListener("submit", handleTeacherSubmit);
  }

  // Cancel Add/Edit
  if (cancelTeacherButton) {
    cancelTeacherButton.addEventListener("click", () => {
      closeTeacherForm();
    });
  }

  // Load teachers when dashboard page is ready
  fetchTeachers();

  // Close modal when clicking outside the modal card
  if (teacherModal) {
    teacherModal.addEventListener("click", (event) => {
      if (event.target === teacherModal) {
        closeTeacherManagement();
      }
    });
  }
});


// ===============================
// Open Teacher Management
// ===============================

function openTeacherManagement() {
  const modal = document.getElementById("teacherManagementModal");

  if (!modal) {
    console.error("Teacher Management modal not found.");
    return;
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  closeTeacherForm();
  fetchTeachers();
}


// ===============================
// Close Teacher Management
// ===============================

function closeTeacherManagement() {
  const modal = document.getElementById("teacherManagementModal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");

  closeTeacherForm();
}


// ===============================
// Open Add/Edit Form
// ===============================

function openTeacherForm() {
  const formContainer = document.getElementById("teacherFormContainer");

  if (!formContainer) return;

  formContainer.classList.remove("hidden");

  editingTeacher = false;
  currentTeacherId = null;

  clearTeacherForm();

  const saveButton = document.getElementById("saveTeacherButton");

  if (saveButton) {
    saveButton.textContent = "Save Teacher";
  }
}


// ===============================
// Close Add/Edit Form
// ===============================

function closeTeacherForm() {
  const formContainer = document.getElementById("teacherFormContainer");

  if (!formContainer) return;

  formContainer.classList.add("hidden");

  clearTeacherForm();

  editingTeacher = false;
  currentTeacherId = null;

  const saveButton = document.getElementById("saveTeacherButton");

  if (saveButton) {
    saveButton.textContent = "Save Teacher";
  }
}


// ===============================
// Clear Teacher Form
// ===============================

function clearTeacherForm() {
  const teacherId = document.getElementById("teacherId");
  const teacherName = document.getElementById("teacherName");
  const teacherEmployeeNo = document.getElementById("teacherEmployeeNo");
  const teacherSubject = document.getElementById("teacherSubject");
  const teacherClass = document.getElementById("teacherClass");

  if (teacherId) teacherId.value = "";
  if (teacherName) teacherName.value = "";
  if (teacherEmployeeNo) teacherEmployeeNo.value = "";
  if (teacherSubject) teacherSubject.value = "";
  if (teacherClass) teacherClass.value = "";
}


// ===============================
// Fetch Teachers
// ===============================

function fetchTeachers() {
  fetch(TEACHERS_API)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      return response.json();
    })
    .then((teachers) => {
      populateTeacherTable(teachers);
    })
    .catch((error) => {
      console.error("Error fetching teachers:", error);

      const tableBody = document.querySelector(
        "#teachersManagementTable tbody"
      );

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5">
              Unable to load teacher records.
            </td>
          </tr>
        `;
      }
    });
}


// ===============================
// Populate Teacher Table
// ===============================

function populateTeacherTable(teachers) {
  const teacherTableBody = document.querySelector(
    "#teachersManagementTable tbody"
  );

  if (!teacherTableBody) {
    console.error("Teacher management table not found.");
    return;
  }

  teacherTableBody.innerHTML = "";

  if (!Array.isArray(teachers) || teachers.length === 0) {
    teacherTableBody.innerHTML = `
      <tr>
        <td colspan="5">
          No teacher records found.
        </td>
      </tr>
    `;
    return;
  }

  teachers.forEach((teacher) => {
    const row = document.createElement("tr");

    const teacherId = teacher._id || teacher.id;

    row.innerHTML = `
      <td>${escapeTeacherHTML(teacher.name || "")}</td>
      <td>${escapeTeacherHTML(teacher.employeeNo || "")}</td>
      <td>${escapeTeacherHTML(teacher.subject || "")}</td>
      <td>${escapeTeacherHTML(teacher.class || "")}</td>
      <td>
        <button
          type="button"
          class="btn btn-outline"
          onclick="editTeacher('${teacherId}')"
        >
          Edit
        </button>

        <button
          type="button"
          class="btn btn-danger"
          onclick="deleteTeacher('${teacherId}')"
        >
          Delete
        </button>
      </td>
    `;

    teacherTableBody.appendChild(row);
  });
}


// ===============================
// Add / Update Teacher
// ===============================

function handleTeacherSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("teacherName").value.trim();
  const employeeNo = document
    .getElementById("teacherEmployeeNo")
    .value.trim();
  const subject = document
    .getElementById("teacherSubject")
    .value.trim();
  const teacherClass = document
    .getElementById("teacherClass")
    .value;

  if (!name || !employeeNo || !subject || !teacherClass) {
    alert("Please complete all teacher fields.");
    return;
  }

  const teacherData = {
    name: name,
    employeeNo: employeeNo,
    subject: subject,
    class: teacherClass
  };

  let url = TEACHERS_API;
  let method = "POST";

  if (editingTeacher && currentTeacherId) {
    url = `${TEACHERS_API}/${currentTeacherId}`;
    method = "PUT";
  }

  fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(teacherData)
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      return response.json();
    })
    .then(() => {
      alert(
        editingTeacher
          ? "Teacher updated successfully."
          : "Teacher added successfully."
      );

      closeTeacherForm();
      fetchTeachers();
    })
    .catch((error) => {
      console.error("Error saving teacher:", error);
      alert("Unable to save teacher record.");
    });
}


// ===============================
// Edit Teacher
// ===============================

function editTeacher(teacherId) {
  if (!teacherId) {
    console.error("Teacher ID is missing.");
    return;
  }

  currentTeacherId = teacherId;
  editingTeacher = true;

  fetch(`${TEACHERS_API}/${teacherId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      return response.json();
    })
    .then((teacher) => {
      document.getElementById("teacherId").value =
        teacher._id || teacher.id || "";

      document.getElementById("teacherName").value =
        teacher.name || "";

      document.getElementById("teacherEmployeeNo").value =
        teacher.employeeNo || "";

      document.getElementById("teacherSubject").value =
        teacher.subject || "";

      document.getElementById("teacherClass").value =
        teacher.class || "";

      const formContainer =
        document.getElementById("teacherFormContainer");

      if (formContainer) {
        formContainer.classList.remove("hidden");
      }

      const saveButton =
        document.getElementById("saveTeacherButton");

      if (saveButton) {
        saveButton.textContent = "Update Teacher";
      }
    })
    .catch((error) => {
      console.error("Error fetching teacher:", error);
      alert("Unable to load teacher record.");
    });
}


// ===============================
// Delete Teacher
// ===============================

function deleteTeacher(teacherId) {
  if (!teacherId) {
    console.error("Teacher ID is missing.");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to delete this teacher?"
  );

  if (!confirmed) {
    return;
  }

  fetch(`${TEACHERS_API}/${teacherId}`, {
    method: "DELETE"
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      return response.json();
    })
    .then(() => {
      alert("Teacher deleted successfully.");
      fetchTeachers();
    })
    .catch((error) => {
      console.error("Error deleting teacher:", error);
      alert("Unable to delete teacher record.");
    });
}


// ===============================
// Escape HTML
// ===============================

function escapeTeacherHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}