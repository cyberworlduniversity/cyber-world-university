import { callLms, createElement, readableError, waitForAuth } from '../supabase/lms-client.js';

const root = document.getElementById('quiz-app');
const params = new URLSearchParams(window.location.search);
const quizId = params.get('quiz');

function showMessage(text, error = false) {
  root.replaceChildren(createElement('p', text, error ? 'status-message error' : 'status-message'));
}

async function initialize() {
  root.hidden = false;
  if (!quizId) {
    showMessage('Select a published quiz from an enrolled CWU course.');
    return;
  }
  root.replaceChildren(createElement('p', 'Checking sign-in and starting a server-managed quiz attempt…', 'muted'));
  try {
    const user = await waitForAuth();
    if (!user?.email_confirmed_at) {
      showMessage('A verified CWU account and active course enrollment are required to start this quiz.', true);
      return;
    }
    const attempt = await callLms('startQuizAttempt', { quizId });
    if (!Array.isArray(attempt.questions) || !attempt.questions.length || typeof attempt.attempt_id !== 'string' || !attempt.expires_at) {
      throw new Error('The quiz backend returned an invalid attempt.');
    }

    let current = 0;
    let submitting = false;
    const answers = new Map();
    const title = createElement('h2', 'Server-managed course quiz');
    const instruction = createElement('p', `Attempt ${attempt.attempt_id}. Answer keys are never sent to this browser.`);
    const timer = createElement('p', '', 'status-message');
    const question = createElement('section', undefined, 'quiz-question');
    const nav = createElement('div', undefined, 'quiz-nav');
    const actions = createElement('div', undefined, 'inline-actions');
    const previous = createElement('button', 'Previous', 'btn btn-secondary');
    const next = createElement('button', 'Next', 'btn btn-secondary');
    const submit = createElement('button', 'Submit for server grading', 'btn btn-primary');
    const result = createElement('p', '', 'status-message');
    [previous, next, submit].forEach((b) => { b.type = 'button'; });
    actions.append(previous, next, submit);
    root.replaceChildren(title, instruction, timer, question, nav, actions, result);

    const renderQuestion = () => {
      const item = attempt.questions[current];
      const selected = answers.get(item.id) || [];
      question.replaceChildren(createElement('h3', item.question_text || 'Question'));
      (item.options || []).forEach((option, index) => {
        const label = createElement('label', undefined, 'quiz-option');
        const input = document.createElement('input');
        input.type = item.question_type === 'multiple_select' ? 'checkbox' : 'radio';
        input.name = `answer-${item.id}`;
        input.value = String(index);
        input.checked = selected.includes(index);
        input.disabled = submitting;
        input.addEventListener('change', () => {
          if (item.question_type === 'multiple_select') {
            const nextSelected = new Set(answers.get(item.id) || []);
            if (input.checked) nextSelected.add(index); else nextSelected.delete(index);
            answers.set(item.id, [...nextSelected].sort((a, b) => a - b));
          } else {
            answers.set(item.id, [index]);
          }
        });
        label.append(input, createElement('span', option));
        question.append(label);
      });
      nav.replaceChildren();
      attempt.questions.forEach((_, index) => {
        const b = createElement('button', String(index + 1));
        b.type = 'button'; b.disabled = submitting; b.setAttribute('aria-label', `Go to question ${index + 1}`);
        if (index === current) b.setAttribute('aria-current', 'step');
        b.addEventListener('click', () => { current = index; renderQuestion(); });
        nav.append(b);
      });
      previous.disabled = current === 0 || submitting;
      next.disabled = current === attempt.questions.length - 1 || submitting;
      submit.disabled = submitting;
    };

    previous.addEventListener('click', () => { current -= 1; renderQuestion(); });
    next.addEventListener('click', () => { current += 1; renderQuestion(); });
    submit.addEventListener('click', async () => {
      if (submitting) return;
      const payload = attempt.questions.map((item) => ({ question_id: item.id, selected_answers: answers.get(item.id) || [] }));
      if (payload.some((answer) => !answer.selected_answers.length)) {
        result.textContent = 'Answer every question before submitting.';
        return;
      }
      submitting = true; renderQuestion();
      try {
        const graded = await callLms('submitQuizAttempt', { attemptId: attempt.attempt_id, answers: payload });
        result.textContent = `Server result: ${graded.score}/${graded.total_marks} (${graded.percentage}%). ${graded.passed ? 'Passed.' : 'Not passed.'}`;
      } catch (error) {
        submitting = false; result.textContent = readableError(error); result.classList.add('error'); renderQuestion();
      }
    });

    const expiresAt = new Date(attempt.expires_at).getTime();
    const updateTimer = () => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      timer.textContent = `Time remaining: ${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
      if (!seconds && !submitting) {
        submitting = true;
        result.textContent = 'This quiz attempt has expired. The server will reject late submissions.';
        renderQuestion();
      }
    };
    renderQuestion(); updateTimer(); window.setInterval(updateTimer, 1000);
  } catch (error) { showMessage(readableError(error), true); }
}

if (root) initialize().catch((error) => showMessage(readableError(error), true));
