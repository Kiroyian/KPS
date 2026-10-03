const STORAGE_STUDENTS = 'kareroStudentDownloads';
const STORAGE_NOTICES = 'kareroSchoolNotices';
const STORAGE_FEEDBACKS = 'kareroContactFeedbacks';
const STORAGE_ADMIN_AUTH = 'kareroAdminAuthenticated';
const STORAGE_ADMIN_USER_HASH = 'kareroAdminUserHash';
const STORAGE_ADMIN_PASS_HASH = 'kareroAdminPassHash';
const ADMIN_STUDENTS_API = 'http://localhost:3000/api/students';
const ADMISSION_REQUIREMENT_DEFINITIONS = [
  { key: 'applicationForm', label: 'Completed admission application form' },
  { key: 'birthCertificate', label: 'Copy of the learner\'s birth certificate' },
  { key: 'guardianId', label: 'Copy of parent or guardian national ID' },
  { key: 'previousSchoolReport', label: 'Previous school report or transfer letter', optional: true },
  { key: 'passportPhotos', label: 'Two recent passport-size photos' },
  { key: 'medicalInformation', label: 'Relevant medical information', optional: true }
];

let currentAdmissionStudents = [];
let activeAdmissionStudent = null;

const DEFAULT_NOTICES = [
  {
    title: 'Admission Forms Available',
    date: '2026-05-20',
    message: 'Parents and guardians can now open or download school application forms from the Downloads page.'
  },
  {
    title: 'Welcome to the Notices Page',
    date: '2026-05-20',
    message: 'Use this page to post school announcements, meeting updates, opening dates, and other reminders.'
  }
];


function loadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_ADMIN_USERNAME = 'Fred';
const DEFAULT_ADMIN_PASSWORD = '1234';

async function hashString(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function setDefaultAdminCredentials() {
  const storedUserHash = localStorage.getItem(STORAGE_ADMIN_USER_HASH);
  const storedPassHash = localStorage.getItem(STORAGE_ADMIN_PASS_HASH);
  if (storedUserHash && storedPassHash) {
    return;
  }
  const [userHash, passHash] = await Promise.all([
    hashString(DEFAULT_ADMIN_USERNAME),
    hashString(DEFAULT_ADMIN_PASSWORD)
  ]);
  localStorage.setItem(STORAGE_ADMIN_USER_HASH, userHash);
  localStorage.setItem(STORAGE_ADMIN_PASS_HASH, passHash);
}

function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

function initContactPage() {
  const contactModal = document.getElementById('contactModal');
  const openContactForm = document.getElementById('openContactForm');
  const contactForm = document.getElementById('contactForm');
  const contactFormNote = document.getElementById('contactFormNote');

  if (!contactModal || !openContactForm || !contactForm) {
    return;
  }

  function closeContactModal() {
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
  }

  openContactForm.addEventListener('click', (event) => {
    event.preventDefault();
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
    if (contactFormNote) {
      contactFormNote.textContent = '';
      contactFormNote.className = 'contact-form-note';
    }
    const nameInput = document.getElementById('contactName');
    if (nameInput) {
      nameInput.focus();
    }
  });

  document.querySelectorAll('[data-contact-close]').forEach(button => {
    button.addEventListener('click', closeContactModal);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeContactModal();
    }
  });

  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }
    const name = document.getElementById('contactName')?.value.trim();
    const email = document.getElementById('contactEmail')?.value.trim();
    const phone = document.getElementById('contactPhone')?.value.trim();
    const topic = document.getElementById('contactTopic')?.value;
    const message = document.getElementById('contactMessage')?.value.trim();
    const createdAt = new Date().toLocaleString();

    const feedbacks = loadStorage(STORAGE_FEEDBACKS, []);
    feedbacks.unshift({
      id: Date.now(),
      name,
      email,
      phone,
      topic,
      message,
      createdAt,
      status: 'New',
      response: ''
    });
    saveStorage(STORAGE_FEEDBACKS, feedbacks);

    if (contactFormNote) {
      contactFormNote.textContent = 'Thank you! Your message has been sent to the admin.';
      contactFormNote.className = 'contact-form-note success';
    }
    contactForm.reset();
  });
}

function initDownloadsPage() {
  const studentForm = document.getElementById('studentDownloadForm');
  const messageNode = document.getElementById('downloadFormMessage');

  if (studentForm) {
    studentForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = document.getElementById('studentName')?.value.trim();
      const grade = document.getElementById('studentClass')?.value.trim();
      const email = document.getElementById('studentEmail')?.value.trim();

      if (!name || !grade) {
        if (messageNode) {
          messageNode.textContent = 'Please provide the student name and class.';
          messageNode.className = 'page-intro';
        }
        return;
      }

      sessionStorage.setItem('kareroCurrentStudent', JSON.stringify({ name, grade, email }));
      if (messageNode) {
        messageNode.textContent = 'Student details saved. Click a form action to record the download or open event.';
      }
    });

    const savedStudent = sessionStorage.getItem('kareroCurrentStudent');
    if (savedStudent) {
      try {
        const student = JSON.parse(savedStudent);
        document.getElementById('studentName').value = student.name || '';
        document.getElementById('studentClass').value = student.grade || '';
        document.getElementById('studentEmail').value = student.email || '';
        if (messageNode) {
          messageNode.textContent = 'Student details restored from this session. Click a form action to record the event.';
        }
      } catch (error) {
        sessionStorage.removeItem('kareroCurrentStudent');
      }
    }
  }

  const trackedLinks = document.querySelectorAll('[data-track-action]');
  trackedLinks.forEach(link => {
    link.addEventListener('click', event => {
      const studentData = sessionStorage.getItem('kareroCurrentStudent');
      if (!studentData) {
        event.preventDefault();
        alert('Please enter student details before downloading or opening the form.');
        return;
      }
      const student = JSON.parse(studentData);
      const record = {
        studentName: student.name,
        className: student.grade,
        email: student.email || 'Not provided',
        form: link.dataset.formName || 'Application form',
        action: link.dataset.trackAction || 'download',
        status: 'Pending',
        time: new Date().toLocaleString()
      };
      const downloads = loadStorage(STORAGE_STUDENTS, []);
      downloads.unshift(record);
      saveStorage(STORAGE_STUDENTS, downloads);

      sessionStorage.removeItem('kareroCurrentStudent');
      const studentForm = document.getElementById('studentDownloadForm');
      if (studentForm) {
        studentForm.reset();
      }
      const nameInput = document.getElementById('studentName');
      const classInput = document.getElementById('studentClass');
      const emailInput = document.getElementById('studentEmail');
      if (nameInput) {
        nameInput.value = '';
      }
      if (classInput) {
        classInput.value = '';
      }
      if (emailInput) {
        emailInput.value = '';
      }
      if (messageNode) {
        messageNode.textContent = 'Student details recorded. Fill the next student below.';
        messageNode.className = 'page-intro';
      }
    });
  });
}

function initNoticesPage() {
  const noticeContainer = document.getElementById('noticeList');
  if (!noticeContainer) {
    return;
  }
  const stored = loadStorage(STORAGE_NOTICES, []);
  const notices = stored.length ? stored : DEFAULT_NOTICES;
  renderNotices(notices, noticeContainer);
}

function renderNotices(notices, container) {
  container.innerHTML = '';
  if (!notices.length) {
    container.innerHTML = '<p class="page-intro">No notices are available at the moment.</p>';
    return;
  }
  notices.forEach(notice => {
    const card = document.createElement('article');
    card.className = 'notice-card';
    card.innerHTML = `
      <p class="notice-date">${notice.date}</p>
      <h2>${notice.title}</h2>
      <p>${notice.message}</p>
    `;
    container.appendChild(card);
  });
}

function renderAdminNotices(notices, container, onEdit, onDelete) {
  container.innerHTML = '';
  if (!notices.length) {
    container.innerHTML = '<p class="page-intro">No notices published yet.</p>';
    return;
  }
  notices.slice(0, 10).forEach((notice, index) => {
    const card = document.createElement('article');
    card.className = 'notice-card';
    card.innerHTML = `
      <p class="notice-date">${notice.date}</p>
      <h2>${notice.title}</h2>
      <p>${notice.message}</p>
      ${onEdit && onDelete ? `
        <div class="notice-actions">
          <button type="button" class="btn btn-secondary admin-notice-edit" data-index="${index}">Edit</button>
          <button type="button" class="btn btn-outline admin-notice-delete" data-index="${index}">Delete</button>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });

  if (onEdit && onDelete) {
    container.querySelectorAll('.admin-notice-edit').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.index);
        onEdit(index);
      });
    });
    container.querySelectorAll('.admin-notice-delete').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.index);
        onDelete(index);
      });
    });
  }
}

function renderAdminFeedbacks(feedbacks, container) {
  container.innerHTML = '';
  if (!feedbacks.length) {
    container.innerHTML = '<p class="page-intro">No feedback messages have been submitted yet.</p>';
    return;
  }

  feedbacks.forEach(feedback => {
    const card = document.createElement('article');
    card.className = 'notice-card feedback-card';
    card.innerHTML = `
      <div class="feedback-meta">
        <div>
          <p class="notice-date">${feedback.createdAt}</p>
          <p><strong>${feedback.topic}</strong></p>
        </div>
        <span class="feedback-status">${feedback.status}</span>
      </div>
      <h2>${feedback.name}</h2>
      <p><strong>Email:</strong> ${feedback.email}</p>
      <p><strong>Phone:</strong> ${feedback.phone}</p>
      <div class="feedback-message">
        <strong>Message:</strong>
        <p>${feedback.message}</p>
      </div>
      <div class="feedback-response">
        <label for="response-${feedback.id}">Admin Response</label>
        <textarea id="response-${feedback.id}" class="feedback-response-input" data-id="${feedback.id}" placeholder="Write a response...">${feedback.response || ''}</textarea>
      </div>
      <div class="feedback-edit-form hidden" data-id="${feedback.id}">
        <label>Name<input type="text" class="feedback-edit-name" value="${feedback.name}"></label>
        <label>Email<input type="email" class="feedback-edit-email" value="${feedback.email}"></label>
        <label>Phone<input type="tel" class="feedback-edit-phone" value="${feedback.phone}"></label>
        <label>Topic<select class="feedback-edit-topic">
          <option${feedback.topic === 'help' ? ' selected' : ''} value="help">Help</option>
          <option${feedback.topic === 'feedback' ? ' selected' : ''} value="feedback">Feedback</option>
          <option${feedback.topic === 'request' ? ' selected' : ''} value="request">Request</option>
          <option${feedback.topic === 'admissions' ? ' selected' : ''} value="admissions">Admissions inquiry</option>
        </select></label>
        <label>Message<textarea class="feedback-edit-message">${feedback.message}</textarea></label>
        <div class="modal-form-actions">
          <button type="button" class="btn btn-secondary feedback-save-edit" data-id="${feedback.id}">Save Changes</button>
          <button type="button" class="btn btn-outline feedback-cancel-edit" data-id="${feedback.id}">Cancel</button>
        </div>
      </div>
      <div class="notice-actions">
        <button type="button" class="btn btn-secondary feedback-save" data-id="${feedback.id}">Save Response</button>
        <button type="button" class="btn btn-outline feedback-edit" data-id="${feedback.id}">Edit Message</button>
        <button type="button" class="btn btn-outline feedback-delete" data-id="${feedback.id}">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.feedback-save').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);
      const textarea = container.querySelector(`textarea[data-id="${id}"]`);
      const response = textarea?.value.trim() || '';
      const feedbacks = loadStorage(STORAGE_FEEDBACKS, []);
      const index = feedbacks.findIndex(item => item.id === id);
      if (index === -1) return;
      feedbacks[index].response = response;
      feedbacks[index].status = response ? 'Replied' : 'New';
      saveStorage(STORAGE_FEEDBACKS, feedbacks);
      renderAdminFeedbacks(feedbacks, container);
      alert('Response saved successfully.');
    });
  });

  container.querySelectorAll('.feedback-edit').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);
      const editForm = container.querySelector(`.feedback-edit-form[data-id="${id}"]`);
      if (editForm) {
        editForm.classList.toggle('hidden');
      }
    });
  });

  container.querySelectorAll('.feedback-cancel-edit').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);
      const editForm = container.querySelector(`.feedback-edit-form[data-id="${id}"]`);
      if (editForm) {
        editForm.classList.add('hidden');
      }
    });
  });

  container.querySelectorAll('.feedback-save-edit').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);
      const feedbacks = loadStorage(STORAGE_FEEDBACKS, []);
      const index = feedbacks.findIndex(item => item.id === id);
      if (index === -1) return;
      const card = container.querySelector(`.feedback-edit-form[data-id="${id}"]`);
      const nameValue = card.querySelector('.feedback-edit-name')?.value.trim();
      const emailValue = card.querySelector('.feedback-edit-email')?.value.trim();
      const phoneValue = card.querySelector('.feedback-edit-phone')?.value.trim();
      const topicValue = card.querySelector('.feedback-edit-topic')?.value;
      const messageValue = card.querySelector('.feedback-edit-message')?.value.trim();
      feedbacks[index] = {
        ...feedbacks[index],
        name: nameValue,
        email: emailValue,
        phone: phoneValue,
        topic: topicValue,
        message: messageValue
      };
      saveStorage(STORAGE_FEEDBACKS, feedbacks);
      renderAdminFeedbacks(feedbacks, container);
      alert('Feedback values updated.');
    });
  });

  container.querySelectorAll('.feedback-delete').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.id);
      const feedbacks = loadStorage(STORAGE_FEEDBACKS, []);
      const index = feedbacks.findIndex(item => item.id === id);
      if (index === -1) return;
      feedbacks.splice(index, 1);
      saveStorage(STORAGE_FEEDBACKS, feedbacks);
      renderAdminFeedbacks(feedbacks, container);
      alert('Feedback deleted successfully.');
    });
  });
}

async function initAdminPage() {
  const loginForm = document.getElementById('adminLoginForm');
  const adminLoginPanel = document.getElementById('adminLoginPanel');
  const adminDashboard = document.getElementById('adminDashboard');
  const logoutButton = document.getElementById('adminLogout');
  const noticeForm = document.getElementById('noticeForm');
  const scheduleForm = document.getElementById('scheduleForm');
  const noticeModal = document.getElementById('noticeModal');
  const timetableModal = document.getElementById('timetableModal');
  const scheduleModal = document.getElementById('scheduleModal');
  const feedbackModal = document.getElementById('feedbackModal');
  const admissionReviewModal = document.getElementById('admissionReviewModal');
  const admissionReviewForm = document.getElementById('admissionReviewForm');
  const confirmAdmissionButton = document.getElementById('confirmAdmissionButton');
  const returnToWaitingButton = document.getElementById('returnToWaitingButton');
  const openNoticesButton = document.getElementById('openNoticesModal');
  const openTimetableButton = document.getElementById('openTimetableModal');
  const openScheduleButton = document.getElementById('openScheduleModal');
  const openFeedbackButton = document.getElementById('openFeedbackModal');
  const cancelNoticeEditButton = document.getElementById('cancelNoticeEdit');
  const adminFeedbackList = document.getElementById('adminFeedbackList');

  let editingNoticeIndex = null;
  const noticeSubmitButton = noticeForm?.querySelector('button[type="submit"]');

  function resetNoticeForm() {
    editingNoticeIndex = null;
    noticeForm?.reset();
    if (noticeSubmitButton) {
      noticeSubmitButton.textContent = 'Publish Notice';
    }
    if (cancelNoticeEditButton) {
      cancelNoticeEditButton.style.display = 'none';
    }
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function handleEditNotice(index) {
    const notices = loadStorage(STORAGE_NOTICES, []);
    const notice = notices[index];
    if (!notice) {
      return;
    }
    document.getElementById('noticeTitle').value = notice.title;
    document.getElementById('noticeDate').value = notice.date;
    document.getElementById('noticeMessage').value = notice.message;
    editingNoticeIndex = index;
    if (noticeSubmitButton) {
      noticeSubmitButton.textContent = 'Update Notice';
    }
    if (cancelNoticeEditButton) {
      cancelNoticeEditButton.style.display = 'inline-block';
    }
  }

  function handleDeleteNotice(index) {
    const notices = loadStorage(STORAGE_NOTICES, []);
    if (index < 0 || index >= notices.length) {
      return;
    }
    notices.splice(index, 1);
    saveStorage(STORAGE_NOTICES, notices);
    renderAdminNotices(notices, document.getElementById('adminNoticePreview'), handleEditNotice, handleDeleteNotice);
    if (editingNoticeIndex === index) {
      resetNoticeForm();
    }
    alert('Notice deleted successfully.');
  }

  if (!adminLoginPanel || !adminDashboard) {
    return;
  }

  await setDefaultAdminCredentials();

  const authenticated = sessionStorage.getItem(STORAGE_ADMIN_AUTH) === 'true';
  if (authenticated) {
    showAdminDashboard();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      const username = document.getElementById('adminUsername')?.value.trim() || '';
      const password = document.getElementById('adminPassword')?.value.trim() || '';

      if (!localStorage.getItem(STORAGE_ADMIN_USER_HASH) || !localStorage.getItem(STORAGE_ADMIN_PASS_HASH)) {
        await setDefaultAdminCredentials();
      }

      const storedUserHash = localStorage.getItem(STORAGE_ADMIN_USER_HASH);
      const storedPassHash = localStorage.getItem(STORAGE_ADMIN_PASS_HASH);
      const [userHash, passHash] = await Promise.all([hashString(username), hashString(password)]);
      if (userHash === storedUserHash && passHash === storedPassHash) {
        sessionStorage.setItem(STORAGE_ADMIN_AUTH, 'true');
        showAdminDashboard();
        return;
      }
      alert('Invalid admin credentials.');
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      sessionStorage.removeItem(STORAGE_ADMIN_AUTH);
      adminDashboard.classList.add('hidden');
      adminLoginPanel.classList.remove('hidden');
    });
  }

  if (openNoticesButton) {
    openNoticesButton.addEventListener('click', () => {
      renderAdminNotices(loadStorage(STORAGE_NOTICES, DEFAULT_NOTICES), document.getElementById('adminNoticePreview'), handleEditNotice, handleDeleteNotice);
      if (cancelNoticeEditButton) {
        cancelNoticeEditButton.style.display = 'none';
      }
      openModal(noticeModal);
    });
  }

  if (openTimetableButton) {
    openTimetableButton.addEventListener('click', () => {
      renderSchedule();
      openModal(timetableModal);
    });
  }

  if (openScheduleButton) {
    openScheduleButton.addEventListener('click', () => {
      renderTeacherSchedule();
      openModal(scheduleModal);
    });
  }

  if (openFeedbackButton) {
    openFeedbackButton.addEventListener('click', () => {
      renderAdminFeedbacks(loadStorage(STORAGE_FEEDBACKS, []), adminFeedbackList);
      openModal(feedbackModal);
    });
  }

  document.querySelectorAll('.modal-close').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.modal;
      if (target === 'noticeModal') closeModal(noticeModal);
      if (target === 'timetableModal') closeModal(timetableModal);
      if (target === 'feedbackModal') closeModal(feedbackModal);
      if (target === 'scheduleModal') closeModal(scheduleModal);
      if (target === 'admissionReviewModal') closeModal(admissionReviewModal);
    });
  });

  document.getElementById('admissionGroups')?.addEventListener('click', event => {
    const reviewButton = event.target.closest('[data-review-student]');
    if (!reviewButton) {
      return;
    }
    const student = currentAdmissionStudents.find(item => item._id === reviewButton.dataset.reviewStudent);
    if (student) {
      populateAdmissionReview(student);
      openModal(admissionReviewModal);
    }
  });

  admissionReviewForm?.addEventListener('submit', event => {
    event.preventDefault();
    saveAdmissionReview(false);
  });

  confirmAdmissionButton?.addEventListener('click', () => saveAdmissionReview(true));

  returnToWaitingButton?.addEventListener('click', () => {
    if (activeAdmissionStudent) {
      changeStudentAdmissionStatus(activeAdmissionStudent._id, 'Waiting approval', returnToWaitingButton);
    }
  });

  if (noticeForm) {
    noticeForm.addEventListener('submit', event => {
      event.preventDefault();
      const title = document.getElementById('noticeTitle')?.value.trim();
      const date = document.getElementById('noticeDate')?.value;
      const message = document.getElementById('noticeMessage')?.value.trim();
      if (!title || !date || !message) {
        alert('Please complete all notice fields.');
        return;
      }
      const notices = loadStorage(STORAGE_NOTICES, []);
      if (editingNoticeIndex !== null && editingNoticeIndex >= 0 && editingNoticeIndex < notices.length) {
        notices[editingNoticeIndex] = { title, date, message };
        saveStorage(STORAGE_NOTICES, notices);
        renderAdminNotices(notices, document.getElementById('adminNoticePreview'), handleEditNotice, handleDeleteNotice);
        resetNoticeForm();
        alert('Notice updated successfully.');
        return;
      }
      notices.unshift({ title, date, message });
      saveStorage(STORAGE_NOTICES, notices);
      renderAdminNotices(notices, document.getElementById('adminNoticePreview'), handleEditNotice, handleDeleteNotice);
      noticeForm.reset();
      alert('Notice published successfully.');
    });
  }

  if (scheduleForm) {
  scheduleForm.addEventListener('submit', async event => {
    event.preventDefault();

    const grade = document.getElementById('scheduleGrade')?.value;
    const teacher = document.getElementById('scheduleTeacher')?.value.trim();
    const subjects = document.getElementById('scheduleSubjects')?.value.trim();
    const day = document.getElementById('scheduleDay')?.value;
    const duty = document.getElementById('scheduleDuty')?.value.trim();

    if (!grade || !teacher || !subjects || !day || !duty) {
      alert('Please complete all timetable fields.');
      return;
    }

    const subjectList = subjects
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    if (
      ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3'].includes(grade) &&
      subjectList.length !== 2
    ) {
      alert('Playgroups through Grade 3 must have exactly 2 subjects.');
      return;
    }

    if (
      !['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3'].includes(grade) &&
      subjectList.length !== 3
    ) {
      alert('Grade 4 through Grade 10 must have exactly 3 subjects.');
      return;
    }

    try {
      const response = await fetch('/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          day,
          grade,
          teacher,
          subjects: subjectList,
          duty
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save timetable entry.');
      }

      renderSchedule();
      renderTeacherSchedule();

      document.getElementById('scheduleForm').reset();

      alert('Timetable entry saved successfully.');

    } catch (error) {
      console.error('Error saving timetable entry:', error);
      alert('Failed to save timetable entry. Please check that the KPS server is running.');
    }
  });
}

  function showAdminDashboard() {
    adminLoginPanel.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    renderStudentDownloads();
    renderAdminNotices(loadStorage(STORAGE_NOTICES, DEFAULT_NOTICES), document.getElementById('adminNoticePreview'), handleEditNotice, handleDeleteNotice);
    renderSchedule();
    renderTeacherSchedule();
  }

}

async function renderStudentDownloads() {
  const waitingList = document.getElementById('waitingApprovalList');
  const admittedList = document.getElementById('admittedList');
  if (!waitingList || !admittedList) {
    return;
  }
  waitingList.innerHTML = '<p class="admission-empty">Loading students...</p>';
  admittedList.replaceChildren();
  document.getElementById('waitingApprovalCount').textContent = '0';
  document.getElementById('admittedCount').textContent = '0';
  document.getElementById('admissionTotalCount').textContent = 'Loading students...';

  try {
    const response = await fetch(ADMIN_STUDENTS_API);
    const students = await response.json();
    if (!response.ok) {
      throw new Error(students.message || 'Failed to load students.');
    }
    if (!Array.isArray(students)) {
      throw new Error('The students API returned an invalid response.');
    }

    currentAdmissionStudents = students;
    const waitingStudents = students.filter(student => student.admissionStatus !== 'Admitted');
    const admittedStudents = students.filter(student => student.admissionStatus === 'Admitted');
    waitingList.replaceChildren(...waitingStudents.map(student => createAdmissionCard(student, false)));
    admittedList.replaceChildren(...admittedStudents.map(student => createAdmissionCard(student, true)));
    document.getElementById('waitingApprovalCount').textContent = waitingStudents.length;
    document.getElementById('admittedCount').textContent = admittedStudents.length;
    document.getElementById('admissionTotalCount').textContent = `${students.length} ${students.length === 1 ? 'student' : 'students'}`;

    if (!waitingStudents.length) {
      waitingList.innerHTML = '<p class="admission-empty">No students waiting for approval.</p>';
    }
    if (!admittedStudents.length) {
      admittedList.innerHTML = '<p class="admission-empty">No students admitted yet.</p>';
    }
  } catch (error) {
    console.error('Error loading admission records:', error);
    waitingList.innerHTML = '<p class="admission-empty">Unable to load students from the KPS server.</p>';
    admittedList.replaceChildren();
    document.getElementById('waitingApprovalCount').textContent = '0';
    document.getElementById('admittedCount').textContent = '0';
    document.getElementById('admissionTotalCount').textContent = 'Unavailable';
  }
}

function createAdmissionCard(student, admitted) {
  const card = document.createElement('article');
  card.className = 'admission-student-card';

  const identity = document.createElement('div');
  identity.className = 'admission-student-identity';

  const name = document.createElement('h4');
  name.textContent = student.name;
  identity.appendChild(name);

  const details = document.createElement('p');
  details.textContent = [
    student.class || 'Class not provided',
    student.admissionNo ? `Admission No. ${student.admissionNo}` : ''
  ].filter(Boolean).join(' / ');
  identity.appendChild(details);

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'admission-action admission-action--secondary';
  action.dataset.reviewStudent = student._id;
  action.textContent = admitted ? 'Review details' : 'Review requirements';

  const actions = document.createElement('div');
  actions.className = 'admission-student-actions';
  actions.appendChild(action);

  if (admitted) {
    const returnButton = document.createElement('button');
    returnButton.type = 'button';
    returnButton.className = 'admission-action admission-action--quiet';
    returnButton.textContent = 'Move to waiting';
    returnButton.addEventListener('click', () => {
      changeStudentAdmissionStatus(student._id, 'Waiting approval', returnButton);
    });
    actions.appendChild(returnButton);
  }

  card.append(identity, actions);
  return card;
}

function populateAdmissionReview(student) {
  activeAdmissionStudent = student;
  const details = document.getElementById('admissionStudentDetails');
  const requirementsList = document.getElementById('admissionRequirementsList');
  const message = document.getElementById('admissionReviewMessage');
  const saveButton = document.getElementById('saveAdmissionReview');
  const confirmButton = document.getElementById('confirmAdmissionButton');
  const returnButton = document.getElementById('returnToWaitingButton');
  const isAdmitted = student.admissionStatus === 'Admitted';

  details.replaceChildren();
  [
    ['Student name', student.name],
    ['Admission number', student.admissionNo || 'Not assigned'],
    ['Class', student.class],
    ['Gender', student.gender],
    ['Age', student.age],
    ['Registered', student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Date not recorded']
  ].forEach(([label, value]) => {
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value || 'Not provided';
    details.append(term, description);
  });

  const requirements = student.admissionRequirements || {};
  requirementsList.replaceChildren(...ADMISSION_REQUIREMENT_DEFINITIONS.map(requirement => {
    const label = document.createElement('label');
    label.className = 'admission-requirement-item';

    const copy = document.createElement('span');
    copy.className = 'admission-requirement-copy';
    copy.textContent = requirement.label;

    const select = document.createElement('select');
    select.name = requirement.key;
    select.setAttribute('aria-label', requirement.label);
    select.disabled = isAdmitted;
    const options = [
      ['pending', 'Not checked'],
      ['verified', 'Received and verified']
    ];
    if (requirement.optional) {
      options.push(['notApplicable', 'Not applicable']);
    }
    options.forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });
    select.value = options.some(([value]) => value === requirements[requirement.key])
      ? requirements[requirement.key]
      : 'pending';
    select.addEventListener('change', updateAdmissionReviewControls);

    label.append(copy, select);
    return label;
  }));

  message.textContent = isAdmitted ? 'This student has been admitted.' : 'All required items must be verified before admission.';
  saveButton.classList.toggle('hidden', isAdmitted);
  confirmButton.classList.toggle('hidden', isAdmitted);
  returnButton.classList.toggle('hidden', !isAdmitted);
  updateAdmissionReviewControls();
}

function getAdmissionRequirementsFromForm() {
  return Object.fromEntries(ADMISSION_REQUIREMENT_DEFINITIONS.map(requirement => [
    requirement.key,
    document.querySelector(`#admissionRequirementsList [name="${requirement.key}"]`)?.value || 'pending'
  ]));
}

function isAdmissionReviewComplete(requirements) {
  return ADMISSION_REQUIREMENT_DEFINITIONS.every(requirement =>
    requirements[requirement.key] === 'verified' ||
    (requirement.optional && requirements[requirement.key] === 'notApplicable')
  );
}

function updateAdmissionReviewControls() {
  const requirements = getAdmissionRequirementsFromForm();
  const confirmButton = document.getElementById('confirmAdmissionButton');
  if (confirmButton && activeAdmissionStudent?.admissionStatus !== 'Admitted') {
    confirmButton.disabled = !isAdmissionReviewComplete(requirements);
  }
}

async function saveAdmissionReview(admitStudent) {
  if (!activeAdmissionStudent) {
    return;
  }

  const requirements = getAdmissionRequirementsFromForm();
  const message = document.getElementById('admissionReviewMessage');
  const saveButton = document.getElementById('saveAdmissionReview');
  const confirmButton = document.getElementById('confirmAdmissionButton');
  if (admitStudent && !isAdmissionReviewComplete(requirements)) {
    message.textContent = 'Verify all required items before admitting this student.';
    return;
  }

  saveButton.disabled = true;
  confirmButton.disabled = true;
  message.textContent = admitStudent ? 'Saving admission decision...' : 'Saving checklist...';
  const body = { admissionRequirements: requirements };
  if (admitStudent) {
    body.admissionStatus = 'Admitted';
  }

  try {
    const response = await fetch(`${ADMIN_STUDENTS_API}/${encodeURIComponent(activeAdmissionStudent._id)}/admission-review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to save admission review.');
    }

    if (admitStudent) {
      document.getElementById('admissionReviewModal').classList.add('hidden');
      document.getElementById('admissionReviewModal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      activeAdmissionStudent = null;
    } else {
      populateAdmissionReview(result.student);
      message.textContent = 'Checklist saved. The admission decision is still pending.';
    }
    await renderStudentDownloads();
  } catch (error) {
    console.error('Error saving admission review:', error);
    message.textContent = error.message || 'Unable to save the admission review.';
  } finally {
    saveButton.disabled = false;
    updateAdmissionReviewControls();
  }
}

async function changeStudentAdmissionStatus(studentId, admissionStatus, button) {
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Saving...';
  try {
    const response = await fetch(`${ADMIN_STUDENTS_API}/${encodeURIComponent(studentId)}/admission-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admissionStatus })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update admission status.');
    }
    await renderStudentDownloads();
  } catch (error) {
    console.error('Error updating admission status:', error);
    button.disabled = false;
    button.textContent = originalLabel;
    alert(error.message || 'Unable to update the admission status.');
  }
}

async function renderSchedule() {
  const preview = document.getElementById('schedulePreview');

  if (!preview) {
    return;
  }

  try {
    const response = await fetch('/api/timetable');

    if (!response.ok) {
      throw new Error('Failed to fetch timetable.');
    }

    const schedule = await response.json();

    preview.innerHTML = '';

    if (!schedule.length) {
      preview.innerHTML = '<p class="page-intro">No timetable entries created yet.</p>';
      return;
    }

    const grouped = schedule.slice(0, 10);

    grouped.forEach(item => {
      const card = document.createElement('div');
      card.className = 'schedule-card';

      card.innerHTML = `
        <h3>${item.day} — ${item.grade}</h3>
        <p><strong>Teacher:</strong> ${item.teacher}</p>
        <p><strong>Subjects:</strong> ${item.subjects.join(', ')}</p>
        <p><strong>Duty:</strong> ${item.duty}</p>
      `;

      preview.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading timetable:', error);
    preview.innerHTML =
      '<p class="page-intro">Unable to load timetable entries.</p>';
  }
}

async function renderTeacherSchedule() {
  const tableBody = document.querySelector('#teacherScheduleTable tbody');

  if (!tableBody) {
    return;
  }

  try {
    const response = await fetch('/api/timetable');

    if (!response.ok) {
      throw new Error('Failed to fetch teacher schedule.');
    }

    const schedule = await response.json();

    tableBody.innerHTML = '';

    if (!schedule.length) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5">No teacher duty entries available.</td>';
      tableBody.appendChild(row);
      return;
    }

    schedule.slice(0, 12).forEach(entry => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${entry.day}</td>
        <td>${entry.grade}</td>
        <td>${entry.teacher}</td>
        <td>${entry.subjects.join(', ')}</td>
        <td>${entry.duty}</td>
      `;

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading teacher schedule:', error);

    tableBody.innerHTML =
      '<tr><td colspan="5">Unable to load teacher duty entries.</td></tr>';
  }
}

function initPage() {
  setActiveNav();
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'contact.html') {
    initContactPage();
  }
  if (page === 'downloads.html') {
    initDownloadsPage();
  }
  if (page === 'notices.html') {
    initNoticesPage();
  }
  if (page === 'admin.html') {
    initAdminPage();
  }
}

initPage();
