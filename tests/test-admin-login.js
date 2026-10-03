const path = require('path');
const assert = require('assert');
const express = require('express');
const { ObjectId } = require('mongodb');
const createStudentRoutes = require('../routes/studentRoutes');

async function testAdmissionStatusRoute() {
  const student = {
    _id: new ObjectId(),
    name: 'Test Student',
    admissionNo: 'TEST-001',
    class: 'Grade 4'
  };
  const collection = {
    find: () => ({ toArray: async () => [student] }),
    findOne: async filter => String(filter._id) === String(student._id) ? student : null,
    updateOne: async (filter, update) => {
      if (String(filter._id) !== String(student._id)) {
        return { matchedCount: 0 };
      }
      Object.assign(student, update.$set);
      return { matchedCount: 1 };
    }
  };
  const app = express();
  app.use(express.json());
  app.use('/api/students', createStudentRoutes({ collection: () => collection }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const apiUrl = `http://127.0.0.1:${server.address().port}/api/students`;

  try {
    const initialResponse = await fetch(apiUrl);
    const [initialStudent] = await initialResponse.json();
    assert.strictEqual(initialStudent.admissionStatus, undefined);

    const blockedResponse = await fetch(`${apiUrl}/${student._id}/admission-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admissionStatus: 'Admitted' })
    });
    assert.strictEqual(blockedResponse.status, 409);

    const requirements = {
      applicationForm: 'verified',
      birthCertificate: 'verified',
      guardianId: 'verified',
      previousSchoolReport: 'notApplicable',
      passportPhotos: 'verified',
      medicalInformation: 'notApplicable'
    };
    const reviewResponse = await fetch(`${apiUrl}/${student._id}/admission-review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admissionRequirements: requirements })
    });
    assert.strictEqual(reviewResponse.status, 200);
    assert.deepStrictEqual(student.admissionRequirements, requirements);

    const updateResponse = await fetch(`${apiUrl}/${student._id}/admission-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admissionStatus: 'Admitted' })
    });
    assert.strictEqual(updateResponse.status, 200);
    assert.strictEqual(student.admissionStatus, 'Admitted');

    const incompleteReview = await fetch(`${apiUrl}/${student._id}/admission-review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admissionRequirements: { ...requirements, birthCertificate: 'pending' } })
    });
    assert.strictEqual(incompleteReview.status, 409);

    const invalidResponse = await fetch(`${apiUrl}/${student._id}/admission-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admissionStatus: 'Rejected' })
    });
    assert.strictEqual(invalidResponse.status, 400);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

(async () => {
  await testAdmissionStatusRoute();
  const fs = require('fs');
  const puppeteerModule = await import('puppeteer');
  const puppeteer = puppeteerModule.default || puppeteerModule;

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  const execPath = candidates.find(p => fs.existsSync(p));
  const launchOpts = execPath ? { headless: true, executablePath: execPath, args: ['--disable-web-security'] } : { headless: true };

  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();
  const filePath = 'file:' + path.resolve(__dirname, '..', 'admin.html');

  await page.evaluateOnNewDocument(students => {
    window.__admissionTestStudents = students;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, options = {}) => {
      const url = typeof input === 'string' ? input : input.url;
      if (!url.startsWith('http://localhost:3000/api/students')) {
        return originalFetch(input, options);
      }

      const method = (options.method || 'GET').toUpperCase();
      if (method === 'GET') {
        return new Response(JSON.stringify(window.__admissionTestStudents), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const match = url.match(/\/api\/students\/([^/]+)\/(admission-review|admission-status)$/);
      const student = match && window.__admissionTestStudents.find(item => item._id === decodeURIComponent(match[1]));
      if (method === 'PATCH' && student && match[2] === 'admission-review') {
        const { admissionRequirements, admissionStatus } = JSON.parse(options.body || '{}');
        student.admissionRequirements = admissionRequirements;
        if (admissionStatus) {
          student.admissionStatus = admissionStatus;
        }
        return new Response(JSON.stringify({ success: true, student }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (method === 'PATCH' && student && match[2] === 'admission-status') {
        student.admissionStatus = JSON.parse(options.body || '{}').admissionStatus;
        return new Response(JSON.stringify({ success: true, student }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: false }), { status: 404 });
    };
  }, [
    {
      _id: '68d000000000000000000001',
      name: 'Amina Otieno',
      admissionNo: 'KPS-001',
      class: 'Grade 4'
    },
    {
      _id: '68d000000000000000000002',
      name: 'Brian Kamau',
      admissionNo: 'KPS-002',
      class: 'Grade 5',
      admissionStatus: 'Admitted'
    }
  ]);

  try {
    await page.goto(filePath);

    // Set credentials via localStorage (same as console snippet)
    await page.evaluate(() => {
      return (async () => {
        const hash = async s => {
          const enc = new TextEncoder();
          const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
          return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
        };
        localStorage.setItem('kareroAdminUserHash', await hash('Fred'));
        localStorage.setItem('kareroAdminPassHash', await hash('1234'));
        return true;
      })();
    });

    // Refresh to let script pick up credentials
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] });

    // Fill form (script sets autocomplete but no autofill now)
    await page.type('#adminUsername', 'Fred');
    await page.type('#adminPassword', '1234');
    await Promise.all([
      page.click('#adminLoginForm button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => {})
    ]);

    // Check if dashboard visible
    const dashboardVisible = await page.evaluate(() => {
      const dash = document.getElementById('adminDashboard');
      return dash && !dash.classList.contains('hidden');
    });

    console.log('Dashboard visible:', dashboardVisible);
    await page.waitForFunction(() =>
      document.getElementById('waitingApprovalCount').textContent === '1' &&
      document.getElementById('admittedCount').textContent === '1'
    );
    const initialCounts = await page.evaluate(() => ({
      waiting: document.getElementById('waitingApprovalCount').textContent,
      admitted: document.getElementById('admittedCount').textContent,
      hasOldTable: Boolean(document.getElementById('downloadsTable'))
    }));
    if (initialCounts.waiting !== '1' || initialCounts.admitted !== '1' || initialCounts.hasOldTable) {
      throw new Error(`Unexpected initial admission groups: ${JSON.stringify(initialCounts)}`);
    }

    await page.click('#waitingApprovalList [data-review-student]');
    await page.waitForSelector('#admissionReviewModal:not(.hidden)');
    const initiallyDisabled = await page.$eval('#confirmAdmissionButton', button => button.disabled);
    if (!initiallyDisabled) {
      throw new Error('Admit action should be disabled before reviewing the requirements.');
    }
    await page.evaluate(() => {
      document.querySelectorAll('#admissionRequirementsList select').forEach(select => {
        select.value = select.name === 'previousSchoolReport' || select.name === 'medicalInformation'
          ? 'notApplicable'
          : 'verified';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    const completeChecklistEnabled = await page.$eval('#confirmAdmissionButton', button => !button.disabled);
    if (!completeChecklistEnabled) {
      throw new Error('All verified requirements should enable the admit action.');
    }
    await page.click('#confirmAdmissionButton');
    await page.waitForFunction(() =>
      document.getElementById('waitingApprovalCount').textContent === '0' &&
      document.getElementById('admittedCount').textContent === '2' &&
      window.__admissionTestStudents[0].admissionStatus === 'Admitted'
    );

    await page.click('#admittedList .admission-action--quiet');
    await page.waitForFunction(() =>
      document.getElementById('waitingApprovalCount').textContent === '1' &&
      document.getElementById('admittedCount').textContent === '1' &&
      window.__admissionTestStudents[0].admissionStatus === 'Waiting approval'
    );
    console.log('Admission API route and dashboard workflow: passed');
    await browser.close();
    process.exit(dashboardVisible ? 0 : 2);
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(1);
  }
})();
