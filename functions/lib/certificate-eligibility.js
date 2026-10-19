function hasAcknowledgedAllPublishedLessons(publishedLessonIds, progressRecords) {
  if (!Array.isArray(publishedLessonIds) || publishedLessonIds.length === 0
    || !Array.isArray(progressRecords)) {
    return false;
  }

  const acknowledgedLessonIds = new Set(
    progressRecords
      .filter((progress) => progress && progress.acknowledged === true)
      .map((progress) => progress.lessonId)
  );
  return publishedLessonIds.every((lessonId) => acknowledgedLessonIds.has(lessonId));
}

module.exports = { hasAcknowledgedAllPublishedLessons };
