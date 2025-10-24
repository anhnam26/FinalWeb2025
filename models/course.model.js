import db from '../utils/db.js';

// 🟢 Lấy toàn bộ danh sách khóa học
export function findAll() {
  return db('courses')
}

// 🟢 Lấy chi tiết 1 khóa học theo id
export function findById(id) {
  return db('courses')
    .where('id', id)
    .first();
}
