import { supabase, callLms, createElement, readableError, setStatus, waitForAuth } from '../supabase/lms-client.js';

const certificates = document.getElementById('certificates-app');
const verification = document.getElementById('certificate-verification-form');

async function loadCertificates() {
  certificates.hidden = false;
  certificates.replaceChildren(createElement('p', 'Loading certificates from the CWU backend…', 'muted'));
  try {
    const user = await waitForAuth();
    if (!user?.email_confirmed_at) {
      certificates.replaceChildren(createElement('p', 'Sign in with a verified account to see certificates issued to you.'));
      return;
    }
    const data = await callLms('getStudentDashboard');
    const courseIds = [...new Set((data.certificates || []).map((item) => item.course_id).filter(Boolean))];
    let courses = [];
    if (courseIds.length) {
      const { data: courseRows, error } = await supabase.from('cwu_courses').select('id,title').in('id', courseIds);
      if (error) throw error;
      courses = courseRows || [];
    }
    const courseNames = new Map(courses.map((course) => [course.id, course.title]));
    certificates.replaceChildren();
    if (!data.certificates?.length) {
      certificates.append(createElement('p', 'No certificates have been issued to this account.', 'empty-state'));
      return;
    }
    const list = createElement('ul', undefined, 'dashboard-list');
    data.certificates.forEach((certificate) => {
      const item = createElement('li');
      item.append(
        createElement('h2', courseNames.get(certificate.course_id) || 'CWU Course'),
        createElement('p', `Certificate: ${certificate.certificate_number || certificate.id}`),
        createElement('p', `Issued: ${certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : 'Date unavailable'}`)
      );
      list.append(item);
    });
    certificates.append(list);
  } catch (error) {
    certificates.replaceChildren(createElement('p', readableError(error), 'status-message error'));
  }
}

function verifyCertificate() {
  const form = document.getElementById('certificate-verification-form');
  const result = document.getElementById('certificate-verification-result');
  if (!form || !result) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const verificationCode = form.elements.verificationCode?.value.trim();
    if (!verificationCode) {
      setStatus(result, 'Enter the certificate verification code.', true);
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    setStatus(result, 'Checking the trusted CWU certificate record…');
    try {
      const response = await callLms('verifyCertificate', { verificationCode });
      result.replaceChildren();
      if (response?.verified) {
        result.append(
          createElement('h2', 'Certificate verified'),
          createElement('p', `Course: ${response.course_title || 'CWU Course'}`),
          createElement('p', `Issued: ${response.issued_at ? new Date(response.issued_at).toLocaleDateString() : 'Unavailable'}`)
        );
      } else {
        result.append(createElement('p', 'Certificate verification failed. The code is invalid or no longer valid.', 'status-message error'));
      }
    } catch (error) {
      setStatus(result, readableError(error), true);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

if (certificates) loadCertificates();
if (verification) verifyCertificate();
