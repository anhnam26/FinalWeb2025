import db from '../utils/db.js';

export function find(userId, lectureId) {
  return db('lecture_progress')
    .where({ user_id: userId, lecture_id: lectureId })
    .first();
}

export async function upsert(userId, lectureId, payload) {
  const row = await find(userId, lectureId);
  if (row) {
    return db('lecture_progress')
      .where({ user_id: userId, lecture_id: lectureId })
      .update(payload);
  }
  return db('lecture_progress').insert({
    user_id: userId,
    lecture_id: lectureId,
    ...payload
  });
}
