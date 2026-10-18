import {
  callLms, createElement, readableError, setStatus, waitForAuth
} from '../firebase/lms-client.js';

const certificates = document.getElementById('certificates-app');
const verification = document.getElementById('certificate-verification-form');

async function loadCertificates() {
  certificates.hidden = false;
  certificates.replaceChildren(createElement('p', 'Loading certificates from the CWU backend…', 'muted'));
  try {
    const user = await waitForAuth();
    if (!user || !user.emailVerified) {
      certificates.replaceChildren(createElement('p', 'Sign in with a verified account to see certificates issued to you.'));
      return;
    }
    const data = await callLms('getStudentDashboard');
    certificates.replaceChildren();
    if (!data.certificates.length) {
      certificates.append(createElement('p', 'No certificates have been issued to this account.', 'empty-state'));
      return;
    }
    const list = createElement('ul', undefined, 'dashboard-list');
    data.certificates.forEach((certificate) => {
      const item = createElement('li');
      item.append(
        createElement('h2', certificate.courseName),
        createElement('p', `Certificate status: ${certificate.status}`),
        createElement('p', `Issued: ${certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'Date unavailable'}`)
      );
      if (certificate.certificateId) {
        const link = createElement('a', 'Verify certificate');
        link.href = `verify-certificate.html?id=${encodeURIComponent(certificate.certificateId)}`;
        item.append(link);
      }
      list.append(item);
    });
    certificates.append(list);
  } catch (error) {
    certificates.replaceChildren(createElement('p', readableError(error), 'status-message error'));
  }
}

async function verifyCertificate() {
  const form = document.getElementById('certificate-verification-form');
  const result = document.getElementById('certificate-verification-result');
  if (!form || !result) return;
  const query = new URLSearchParams(window.location.search);
  if (query.has('code')) {
    const certificateId = query.get('id');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${certificateId ? `?id=${encodeURIComponent(certificateId)}` : ''}`
    );
    setStatus(result, 'One-time verification codes cannot be accepted in a URL. Enter the code directly in the form.');
  }
  if (query.has('id')) form.elements.certificateId.value = query.get('id');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const certificateId = form.elements.certificateId.value.trim();
    const verificationCode = form.elements.verificationCode.value.trim();
    if (Boolean(certificateId) === Boolean(verificationCode)) {
      setStatus(result, 'Enter either a certificate ID or a verification code, not both.', true);
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus(result, 'Checking the trusted CWU certificate record…');
    try {
      const response = await callLms('verifyCourseCertificate', certificateId
        ? { certificateId }
        : { verificationCode });
      result.replaceChildren();
      result.append(createElement('h2', `Backend verification: ${response.status}`));
      if (response.status === 'VALID') {
        [
          ['Certificate ID', response.certificateId],
          ['Learner name', response.studentName],
          ['Course', response.courseName],
          ['Issue date', response.issuedAt ? new Date(response.issuedAt).toLocaleDateString() : 'Unavailable']
        ].forEach(([label, value]) => result.append(
          createElement('dt', label),
          createElement('dd', value || 'Not provided')
        ));
      }
    } catch (error) {
      setStatus(result, readableError(error), true);
    } finally {
      submit.disabled = false;
    }
  });
}

if (certificates) loadCertificates();
if (verification) verifyCertificate();
