function gradeAnswers(gradingSnapshot, answers, passPercentage) {
  if (!Array.isArray(gradingSnapshot) || !gradingSnapshot.length
    || !Array.isArray(answers) || answers.length !== gradingSnapshot.length) {
    throw new TypeError('Answers must match the quiz question count.');
  }
  if (!Number.isInteger(passPercentage) || passPercentage < 1 || passPercentage > 100) {
    throw new TypeError('Pass percentage must be between 1 and 100.');
  }

  let score = 0;
  for (let index = 0; index < gradingSnapshot.length; index += 1) {
    const question = gradingSnapshot[index];
    const answer = answers[index];
    if (!question || !Number.isInteger(question.correctIndex)
      || !Number.isInteger(question.optionCount) || question.optionCount < 2
      || question.optionCount > 10 || !Number.isInteger(answer)
      || question.correctIndex < 0 || question.correctIndex >= question.optionCount
      || answer < 0 || answer >= question.optionCount) {
      throw new TypeError('A submitted answer is invalid.');
    }
    if (answer === question.correctIndex) score += 1;
  }

  const questionCount = gradingSnapshot.length;
  const percentage = Math.round((score / questionCount) * 100);
  return {
    score,
    questionCount,
    percentage,
    passed: percentage >= passPercentage
  };
}

module.exports = { gradeAnswers };
