(function () {
  const questions = window.CWU_QUESTIONS || [];
  const questionContainer = document.getElementById('quiz-question');
  if (!questionContainer || !questions.length) return;

  let current = 0;
  let submitted = false;
  let remaining = 300;
  const answers = new Array(questions.length).fill(null);
  const navigation = document.getElementById('quiz-navigation');
  const progress = document.getElementById('quiz-progress');
  const timer = document.getElementById('quiz-timer');
  const previous = document.getElementById('quiz-previous');
  const next = document.getElementById('quiz-next');
  const submit = document.getElementById('quiz-submit');
  const result = document.getElementById('quiz-result');
  const history = document.getElementById('quiz-history');
  const query = new URLSearchParams(window.location.search);
  const courseId = query.get('course');
  const course = (window.CWU_COURSES || []).find((item) => item.id === courseId);
  const finalAssessment = query.get('assessment') === 'final';
  const assessmentName = finalAssessment ? 'Final exam preview' : 'Practice quiz preview';
  const assessmentTitle = document.getElementById('assessment-title');
  const assessmentEyebrow = document.getElementById('assessment-eyebrow');
  const assessmentDescription = document.getElementById('assessment-description');
  const assessmentNotice = document.getElementById('assessment-notice');
  const assessmentTimerLabel = document.getElementById('assessment-timer-label');
  const returnToCourse = document.getElementById('return-to-course');

  document.getElementById('quiz-title').textContent = finalAssessment ? 'Final exam preview' : 'Practice quiz';
  document.getElementById('quiz-submit').textContent = finalAssessment ? 'Submit sample exam' : 'Submit quiz';
  assessmentEyebrow.textContent = course ? `${course.title} · ${assessmentName}` : 'Course assessment preview';
  assessmentTitle.textContent = course
    ? `${course.title}: ${finalAssessment ? 'Final Exam Preview' : 'Practice Quiz'}`
    : finalAssessment ? 'Cybersecurity final exam preview' : 'Cybersecurity practice quiz';
  assessmentDescription.textContent = finalAssessment
    ? 'Sample final assessment only. This preview uses the practice question set; it is not an official exam or credential assessment.'
    : 'Practice questions only. Results are calculated in your browser and are not securely stored or sent anywhere.';
  assessmentNotice.textContent = finalAssessment
    ? 'Demo final exam: This sample uses 10 practice questions. It does not enforce lesson or quiz prerequisites, issue credentials, or store results.'
    : 'Practice assessment: This 10-question sample does not track course completion or issue credentials.';
  assessmentTimerLabel.textContent = finalAssessment ? 'Sample exam timer:' : 'Practice timer:';
  if (course) {
    returnToCourse.href = `course-details.html?id=${encodeURIComponent(course.id)}`;
    returnToCourse.hidden = false;
  }

  function renderNavigation() {
    navigation.replaceChildren();
    questions.forEach((_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(index + 1);
      button.setAttribute('aria-label', `Go to question ${index + 1}`);
      if (index === current) button.setAttribute('aria-current', 'step');
      if (answers[index] !== null) button.classList.add('answered');
      button.disabled = submitted;
      button.addEventListener('click', () => {
        saveSelection();
        current = index;
        renderQuestion();
      });
      navigation.append(button);
    });
  }

  function saveSelection() {
    const selected = questionContainer.querySelector('input:checked');
    if (selected) answers[current] = Number(selected.value);
  }

  function renderQuestion() {
    const item = questions[current];
    document.getElementById('question-number').textContent = String(current + 1);
    document.getElementById('question-total').textContent = String(questions.length);
    progress.setAttribute('aria-valuemax', String(questions.length));
    progress.setAttribute('aria-valuenow', String(current + 1));
    const progressValue = (current + 1) / questions.length;
    progress.style.setProperty('--progress', `${progressValue * 100}%`);
    progress.style.setProperty('--progress-value', String(progressValue));
    questionContainer.replaceChildren();

    const heading = document.createElement('h3');
    heading.textContent = item.question;
    questionContainer.append(heading);
    item.options.forEach((option, index) => {
      const label = document.createElement('label');
      label.className = 'quiz-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `question-${current}`;
      radio.value = String(index);
      radio.checked = answers[current] === index;
      radio.disabled = submitted;
      const text = document.createElement('span');
      text.textContent = option;
      label.append(radio, text);
      questionContainer.append(label);
    });
    previous.disabled = current === 0 || submitted;
    next.disabled = current === questions.length - 1 || submitted;
    submit.disabled = submitted;
    renderNavigation();
  }

  function finishQuiz() {
    if (submitted) return;
    saveSelection();
    submitted = true;
    const score = answers.reduce((total, answer, index) => total + (answer === questions[index].answer ? 1 : 0), 0);
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;
    result.textContent = `Demo result: ${score}/${questions.length} (${percentage}%). ${passed ? 'Sample pass' : 'Keep practicing'} — no result has been stored or sent.`;
    const attempt = document.createElement('li');
    attempt.textContent = `${new Date().toLocaleString()} — ${assessmentName}: ${score}/${questions.length} (${percentage}%), ${passed ? 'sample pass' : 'review recommended'}`;
    history.prepend(attempt);
    renderQuestion();
  }

  previous.addEventListener('click', () => {
    saveSelection();
    current = Math.max(0, current - 1);
    renderQuestion();
  });
  next.addEventListener('click', () => {
    saveSelection();
    current = Math.min(questions.length - 1, current + 1);
    renderQuestion();
  });
  submit.addEventListener('click', finishQuiz);
  document.getElementById('quiz-restart').addEventListener('click', () => {
    submitted = false;
    current = 0;
    remaining = 300;
    answers.fill(null);
    result.textContent = '';
    renderQuestion();
    timer.textContent = '05:00';
  });

  window.setInterval(() => {
    if (submitted) return;
    remaining -= 1;
    const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    timer.textContent = `${minutes}:${seconds}`;
    if (remaining <= 0) finishQuiz();
  }, 1000);

  renderQuestion();
}());
