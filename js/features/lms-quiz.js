import { callLms, createElement, readableError, waitForAuth } from '../firebase/lms-client.js';

const root = document.getElementById('quiz-app');
const params = new URLSearchParams(window.location.search);
const courseId = params.get('course');
const quizId = params.get('quiz');

function showMessage(message, isError = false) {
  root.replaceChildren(createElement('p', message, isError ? 'status-message error' : 'status-message'));
}

async function initialize() {
  root.hidden = false;
  if (!courseId || !quizId) {
    showMessage('Select a backend-published quiz from an enrolled course. Practice previews are not official academic assessments.');
    return;
  }
  root.replaceChildren(createElement('p', 'Checking sign-in and starting a server-managed quiz attempt…', 'muted'));
  try {
    const user = await waitForAuth();
    if (!user || !user.emailVerified) {
      showMessage('A verified Firebase account and active course enrollment are required to start this quiz.', true);
      return;
    }
    const attempt = await callLms('startQuizAttempt', { courseId, quizId });
    if (!Array.isArray(attempt.questions) || !attempt.questions.length
      || typeof attempt.attemptId !== 'string' || !Number.isFinite(attempt.expiresAt)) {
      throw new Error('The quiz backend returned an invalid attempt.');
    }

    let current = 0;
    let submitting = false;
    const answers = new Array(attempt.questions.length).fill(null);
    const title = createElement('h2', 'Server-managed course quiz');
    const instruction = createElement('p', `Attempt: ${attempt.attemptId}. Quiz version: ${attempt.quizVersion ?? 'current'}. Your answers are graded by CWU backend; answer keys are not sent to this browser.`);
    const timer = createElement('p', '', 'status-message');
    timer.setAttribute('role', 'timer');
    const question = createElement('section', undefined, 'quiz-question');
    const nav = createElement('div', undefined, 'quiz-nav');
    const actions = createElement('div', undefined, 'inline-actions');
    const previous = createElement('button', 'Previous', 'btn btn-secondary');
    previous.type = 'button';
    const next = createElement('button', 'Next', 'btn btn-secondary');
    next.type = 'button';
    const submit = createElement('button', 'Submit answers for server grading', 'btn btn-primary');
    submit.type = 'button';
    const result = createElement('p', '', 'status-message');
    result.setAttribute('role', 'status');
    actions.append(previous, next, submit);
    root.replaceChildren(title, instruction, timer, question, nav, actions, result);

    const renderQuestion = () => {
      const item = attempt.questions[current];
      question.replaceChildren(createElement('h3', item.question));
      item.options.forEach((option, index) => {
        const label = createElement('label', undefined, 'quiz-option');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'lms-answer';
        input.value = String(index);
        input.checked = answers[current] === index;
        input.disabled = submitting;
        input.addEventListener('change', () => {
          answers[current] = index;
        });
        label.append(input, createElement('span', option));
        question.append(label);
      });
      nav.replaceChildren();
      attempt.questions.forEach((_, index) => {
        const button = createElement('button', String(index + 1));
        button.type = 'button';
        button.disabled = submitting;
        button.setAttribute('aria-label', `Go to question ${index + 1}`);
        if (index === current) button.setAttribute('aria-current', 'step');
        button.addEventListener('click', () => {
          current = index;
          renderQuestion();
        });
        nav.append(button);
      });
      previous.disabled = current === 0 || submitting;
      next.disabled = current === attempt.questions.length - 1 || submitting;
      submit.disabled = submitting;
    };

    previous.addEventListener('click', () => {
      current -= 1;
      renderQuestion();
    });
    next.addEventListener('click', () => {
      current += 1;
      renderQuestion();
    });
    submit.addEventListener('click', async () => {
      if (submitting) return;
      if (answers.some((answer) => answer === null)) {
        result.textContent = 'Answer every question before submitting.';
        return;
      }
      submitting = true;
      renderQuestion();
      try {
        const graded = await callLms('submitQuizAttempt', {
          attemptId: attempt.attemptId,
          answers
        });
        result.textContent = `Server result: ${graded.score}/${graded.questionCount} (${graded.percentage}%). ${graded.passed ? 'Passed.' : 'Not passed.'}`;
      } catch (error) {
        submitting = false;
        result.textContent = readableError(error);
        result.classList.add('error');
        renderQuestion();
      }
    });

    const updateTimer = () => {
      const seconds = Math.max(0, Math.ceil((attempt.expiresAt - Date.now()) / 1000));
      timer.textContent = `Time remaining: ${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
      if (!seconds && !submitting) {
        submitting = true;
        submit.disabled = true;
        result.textContent = 'This quiz attempt has expired. Answers cannot be submitted after expiry.';
        callLms('expireQuizAttempt', { attemptId: attempt.attemptId }).catch((error) => {
          result.textContent = `This quiz attempt has expired; the backend could not close it yet: ${readableError(error)}`;
          result.classList.add('error');
        });
      }
    };
    renderQuestion();
    updateTimer();
    window.setInterval(updateTimer, 1000);
  } catch (error) {
    showMessage(readableError(error), true);
  }
}

if (root) initialize().catch((error) => showMessage(readableError(error), true));
