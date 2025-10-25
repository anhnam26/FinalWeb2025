// models/feedback.model.js
import db from '../utils/db.js';

export function findByUserCourse(userId, courseId) {
  return db('feedback')
    .where({ user_id: userId, course_id: courseId })
    .first();
}

export async function upsert(userId, courseId, rating, comment) {
  const existed = await findByUserCourse(userId, courseId);
  const payload = {
    rating: Number(rating),
    comment: comment ?? '',
    created_at: db.fn.now()
  };
  if (existed) {
    return db('feedback')
      .where({ user_id: userId, course_id: courseId })
      .update(payload);
  }
  return db('feedback').insert({
    user_id: userId,
    course_id: courseId,
    ...payload,
  });
}

export function listByCourse(courseId) {
  // Nếu cần hiển thị danh sách đánh giá
  return db('feedback as f')
    .leftJoin('users as u', 'u.id', 'f.user_id')
    .where('f.course_id', courseId)
    .select('f.*', 'u.name as user_name')
    .orderBy('f.created_at', 'desc');
}

export function remove(userId, courseId) {
  return db('feedback')
    .where({ user_id: userId, course_id: courseId })
    .del();
}

export function findByCourse(courseId) {
  return db('feedback as f')
    .join('users as u', 'u.id', 'f.user_id')
    .where('f.course_id', courseId)
    .select(
      'u.name as student_name',
      'f.rating',
      'f.comment',
      'f.created_at'
    )
    .orderBy('f.created_at', 'desc');
}