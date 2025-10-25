// models/purchased.model.js
import db from '../utils/db.js';

export function isPurchased(userId, courseId) {
  return db('purchased')
    .where({ user_id: userId, course_id: courseId })
    .first();
}

export function add(userId, courseId, course_title) {
  return db('purchased').insert({
    user_id: userId,
    course_id: courseId,
    course_title
  });
}

export function listByUser(userId) {
  return db('purchased as p')
    .leftJoin('courses as c', 'p.course_id', 'c.id')
    .where('p.user_id', userId)
    .select(
      'p.course_id',
      'p.course_title',
      'p.purchased_at',
      'c.thumbnail',
      'c.short_desc',
      'c.price',
      'c.sale_price'
    )
    .orderBy('p.purchased_at', 'desc');
}
