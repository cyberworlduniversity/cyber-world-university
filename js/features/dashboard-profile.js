import { auth, onAuthStateChanged, signOut } from '../firebase/auth-client.js';
import { getCurrentUserProfile } from '../firebase/profiles.js';

const dashboard = document.querySelector('.dashboard-main');
if (!dashboard) throw new Error('The account profile requires the student dashboard.');

const pageHeading = document.querySelector('.page-heading h1');
const defaultHeading = pageHeading?.textContent || '';
const demoProfile = dashboard.querySelector('[data-demo-student-profile]');

const section = document.createElement('section');
section.className = 'dashboard-card';
section.setAttribute('aria-labelledby', 'cwu-account-profile-title');
section.hidden = true;

const heading = document.createElement('h2');
heading.id = 'cwu-account-profile-title';
heading.textContent = 'Your CWU account';

const status = document.createElement('p');
status.className = 'status-message';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');

const details = document.createElement('dl');
details.className = 'profile-details';

const profileFields = new Map();
[
  ['Name', 'name'],
  ['Email', 'email'],
  ['Profile role (informational only)', 'role'],
  ['Status', 'status'],
  ['Student ID', 'studentId']
].forEach(([label, field]) => {
  const term = document.createElement('dt');
  term.textContent = label;
  const value = document.createElement('dd');
  profileFields.set(field, value);
  details.append(term, value);
});

section.append(heading, status, details);
dashboard.prepend(section);

let authStateVersion = 0;
onAuthStateChanged(auth, async (user) => {
  const currentVersion = ++authStateVersion;
  const verifiedUser = Boolean(user && user.emailVerified);
  section.hidden = !verifiedUser;
  if (demoProfile) demoProfile.hidden = verifiedUser;
  if (!verifiedUser) {
    if (pageHeading) pageHeading.textContent = defaultHeading;
    profileFields.forEach((value) => {
      value.textContent = '';
    });
    status.textContent = '';
    status.classList.remove('error');
    if (user) {
      status.textContent = 'Email verification is required. Signing out of the unverified session.';
      signOut(auth).catch((error) => {
        console.error('Could not sign out an unverified dashboard session.', error.code || 'sign-out-failed');
      });
    }
    return;
  }

  if (pageHeading) pageHeading.textContent = `Welcome, ${user.displayName || user.email || 'learner'}`;
  status.textContent = 'Checking whether a CWU learner profile is available...';
  try {
    const profile = await getCurrentUserProfile();
    if (currentVersion !== authStateVersion || auth.currentUser?.uid !== user.uid) return;

    profileFields.get('name').textContent = profile.name || profile.displayName || user.displayName || 'Not provided';
    profileFields.get('email').textContent = profile.email || user.email || 'Not provided';
    profileFields.get('role').textContent = profile.role || 'Unassigned';
    profileFields.get('status').textContent = profile.status || 'Unknown';
    profileFields.get('studentId').textContent = profile.studentId || 'Not assigned';
    if (pageHeading) pageHeading.textContent = `Welcome, ${profile.name || profile.displayName || user.displayName || 'learner'}`;
    status.textContent = 'Profile loaded from your CWU account record. The displayed role is informational only; backend authorization is not configured.';
    status.classList.remove('error');
  } catch (error) {
    if (currentVersion !== authStateVersion) return;
    console.error('Could not load the dashboard profile.', error.code || error.message || 'profile-load-failed');
    status.textContent = 'Firebase sign-in is active, but the CWU learner profile and protected learning records are unavailable.';
    status.classList.add('error');
  }
});
