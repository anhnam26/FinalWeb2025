import db from '../utils/db.js';

export function findByCourse(courseId) {
  return db('lectures')
    .where('course_id', courseId)
    .select(
      'id',
      'title',
      'video_url',
      db.raw('duration_sec as duration_sec'),
      db.raw('order_index as ord')
    )
    .orderBy('order_index', 'asc');
}

export function findById(lectureId) {
  return db('lectures')
    .where('id', lectureId)
    .first();
}

export function updateDuration(lectureId, sec) {
  return db('lectures').where('id', lectureId).update({ duration_sec: sec });
}
