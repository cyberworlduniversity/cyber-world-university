const test = require('node:test');
const assert = require('node:assert/strict');
const { gradeAnswers } = require('../lib/quiz-grading');

const questions = [
  { correctIndex: 1, optionCount: 4 },
  { correctIndex: 0, optionCount: 2 },
  { correctIndex: 2, optionCount: 3 },
  { correctIndex: 1, optionCount: 4 }
];

test('grades submitted answer indexes and applies the configured threshold', () => {
  assert.deepEqual(gradeAnswers(questions, [1, 0, 0, 1], 70), {
    score: 3,
    questionCount: 4,
    percentage: 75,
    passed: true
  });
});

test('uses the rounded percentage for pass/fail', () => {
  assert.equal(gradeAnswers(questions, [1, 0, 0, 1], 75).passed, true);
  assert.equal(gradeAnswers(questions, [1, 0, 0, 1], 76).passed, false);
});

test('rejects missing, extra, or out-of-range answers', () => {
  assert.throws(() => gradeAnswers(questions, [1], 70), TypeError);
  assert.throws(() => gradeAnswers(questions, [1, 0, 0, 1, 0], 70), TypeError);
  assert.throws(() => gradeAnswers(questions, [4, 0, 0, 1], 70), TypeError);
  assert.throws(() => gradeAnswers(questions, [1, 0, 0, -1], 70), TypeError);
});

test('rejects invalid quiz snapshots and pass thresholds', () => {
  assert.throws(() => gradeAnswers([], [], 70), TypeError);
  assert.throws(() => gradeAnswers([{ correctIndex: 3, optionCount: 2 }], [0], 70), TypeError);
  assert.throws(() => gradeAnswers(questions, [1, 0, 0, 1], 0), TypeError);
  assert.throws(() => gradeAnswers(questions, [1, 0, 0, 1], 101), TypeError);
});
