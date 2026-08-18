const STORAGE_STUDENTS = 'kareroStudentDownloads';
const STORAGE_NOTICES = 'kareroSchoolNotices';
const STORAGE_SCHEDULE = 'kareroClassSchedules';
const STORAGE_FEEDBACKS = 'kareroContactFeedbacks';
const STORAGE_ADMIN_AUTH = 'kareroAdminAuthenticated';
const STORAGE_ADMIN_USER_HASH = 'kareroAdminUserHash';
const STORAGE_ADMIN_PASS_HASH = 'kareroAdminPassHash';

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

const DEFAULT_SCHEDULE = [
  { day: 'Monday', grade: 'PP1', teacher: 'Ms. Amina', subjects: ['Songs', 'Creative Play'], duty: 'Play Area' },
  { day: 'Monday', grade: 'PP2', teacher: 'Ms. Grace', subjects: ['Story Time', 'Numbers'], duty: 'Play Area' },
  { day: 'Monday', grade: 'Grade 1', teacher: 'Mr. Otieno', subjects: ['English', 'Math'], duty: 'Classroom 2' },
  { day: 'Monday', grade: 'Grade 2', teacher: 'Ms. Wairimu', subjects: ['Math', 'Science'], duty: 'Classroom 3' },
  { day: 'Monday', grade: 'Grade 3', teacher: 'Mr. Kimani', subjects: ['English', 'Social Studies'], duty: 'Classroom 4' },
  { day: 'Monday', grade: 'Grade 4', teacher: 'Mr. Njoroge', subjects: ['Math', 'Science', 'English'], duty: 'Classroom 5' },
  { day: 'Monday', grade: 'Grade 5', teacher: 'Ms. Nyambura', subjects: ['English', 'Kiswahili', 'History'], duty: 'Classroom 6' },
  { day: 'Monday', grade: 'Grade 6', teacher: 'Mr. Mwangi', subjects: ['Math', 'Science', 'Geography'], duty: 'Classroom 7' },
  { day: 'Monday', grade: 'Grade 7', teacher: 'Ms. Cherono', subjects: ['English', 'Biology', 'ICT'], duty: 'Classroom 8' },
  { day: 'Monday', grade: 'Grade 8', teacher: 'Mr. Kamau', subjects: ['Math', 'Physics', 'Chemistry'], duty: 'Laboratory' },
  { day: 'Monday', grade: 'Grade 9', teacher: 'Ms. Wanjiru', subjects: ['English', 'History', 'CRE'], duty: 'Classroom 9' },
  { day: 'Monday', grade: 'Grade 10', teacher: 'Mr. Ouma', subjects: ['Math', 'Biology', 'English'], duty: 'Classroom 10' }
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

      const storedUserHash = localStorage.getItem(STORAGE_ADMIN_USER_HASH);
      const storedPassHash = localStorage.getItem(STORAGE_ADMIN_PASS_HASH);

      if (!storedUserHash || !storedPassHash) {
        await setDefaultAdminCredentials();
      }

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
    });
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
    scheduleForm.addEventListener('submit', event => {
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
      const subjectList = subjects.split(',').map(item => item.trim()).filter(Boolean);
      if (['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3'].includes(grade) && subjectList.length !== 2) {
        alert('Playgroups through Grade 3 must have exactly 2 subjects.');
        return;
      }
      if (!['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3'].includes(grade) && subjectList.length !== 3) {
        alert('Grade 4 through Grade 10 must have exactly 3 subjects.');
        return;
      }
      const schedule = loadStorage(STORAGE_SCHEDULE, []);
      schedule.unshift({ day, grade, teacher, subjects: subjectList, duty });
      saveStorage(STORAGE_SCHEDULE, schedule);
      renderSchedule();
      renderTeacherSchedule();
      document.getElementById('scheduleForm').reset();
      alert('Timetable entry saved successfully.');
    });
  }

  function showAdminDashboard() {
    adminLoginPanel.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    renderStudentDownloads();
    renderAdminNotices(loadStorage(STORAGE_NOTICES, DEFAULT_NOTICES), document.getElementById('adminNoticePreview'), handleEditNotice, handleDeleteNotice);
    initializeSchedule();
    renderSchedule();
    renderTeacherSchedule();
  }

  function initializeSchedule() {
    const existing = loadStorage(STORAGE_SCHEDULE, []);
    if (!existing.length) {
      saveStorage(STORAGE_SCHEDULE, DEFAULT_SCHEDULE);
    }
  }
}

function renderStudentDownloads() {
  const tableBody = document.querySelector('#downloadsTable tbody');
  if (!tableBody) {
    return;
  }
  const records = loadStorage(STORAGE_STUDENTS, []);
  tableBody.innerHTML = '';
  if (!records.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7">No student download records yet.</td>';
    tableBody.appendChild(row);
    return;
  }
  records.forEach((record, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.studentName}</td>
      <td>${record.className}</td>
      <td>${record.email}</td>
      <td>${record.form}</td>
      <td>${record.action}</td>
      <td>${record.status === 'Submitted' ? 'Submitted' : `<button class="btn btn-secondary admin-submit" data-index="${index}">Mark Submitted</button>`}</td>
      <td>${record.time}</td>
    `;
    tableBody.appendChild(row);
  });
  tableBody.querySelectorAll('.admin-submit').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const records = loadStorage(STORAGE_STUDENTS, []);
      if (records[index]) {
        records[index].status = 'Submitted';
        saveStorage(STORAGE_STUDENTS, records);
        renderStudentDownloads();
      }
    });
  });
}

function renderSchedule() {
  const preview = document.getElementById('schedulePreview');
  if (!preview) {
    return;
  }
  const schedule = loadStorage(STORAGE_SCHEDULE, []);
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
}

function renderTeacherSchedule() {
  const tableBody = document.querySelector('#teacherScheduleTable tbody');
  if (!tableBody) {
    return;
  }
  const schedule = loadStorage(STORAGE_SCHEDULE, []);
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
