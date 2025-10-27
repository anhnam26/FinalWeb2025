// /models/watchlist.model.js
import db from '../utils/db.js';

/**
 * Thêm vào watchlist của 1 user.
 * - Tránh trùng (user_id, course_id)
 * - Không bắt buộc course_title (đã có trong bảng courses); nếu bảng watchlist của bạn
 *   còn cột course_title thì vẫn ghi kèm (nullable).
 */
export function add({ user_id, course_id, course_title = null }) {
  return db('watchlist')
    .insert({ user_id, course_id, course_title })
    .onConflict(['user_id', 'course_id'])
    .ignore()
    .returning('*');
}

/** Kiểm tra 1 khóa đã có trong watchlist của user chưa */
export function isInWatchlist(user_id, course_id) {
  return db('watchlist')
    .where({ user_id, course_id })
    .first();
}

/**
 * Lấy danh sách watchlist của user + thông tin khóa học từ bảng courses
 * Phù hợp với cấu trúc bảng courses hiện tại của bạn (ảnh chụp).
 */
export function findAllByUser(user_id) {
  return db('watchlist as w')
    .leftJoin('courses as c', 'w.course_id', 'c.id')
    .where('w.user_id', user_id)
    .select(
      // watchlist fields
      'w.id',
      'w.user_id',
      'w.course_id',
      'w.added_at',
      'w.course_title',                // vẫn giữ để tương thích, có thể null

      // course fields (theo bảng courses của bạn)
      'c.title',
      'c.thumbnail',
      'c.short_desc',
      'c.full_desc',
      'c.price',
      'c.sale_price',
      'c.rating_avg',
      'c.rating_count',
      'c.student_count',
      'c.category_id',
      'c.instructor_id',
      'c.created_at',
      'c.updated_at'
    )
    .orderBy('w.added_at', 'desc');
}

/** Xóa khỏi watchlist theo (user_id, course_id) */
export function remove(user_id, course_id) {
  return db('watchlist')
    .where({ user_id, course_id })
    .del();
}

/** (tuỳ chọn) Lấy 1 dòng watchlist theo id nhưng ràng buộc user */
export function findById(id, user_id) {
  return db('watchlist')
    .where({ id, user_id })
    .first();
}

/** (tuỳ chọn) Đếm số mục watchlist của user */
export function countByUser(user_id) {
  return db('watchlist')
    .where({ user_id })
    .count('id as total')
    .first();
}
