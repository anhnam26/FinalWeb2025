import db from '../utils/db.js';

export function findAll() {
  return db('courses');
}

export function findById(id) {
  return db('courses').where('id', id).first();
}

export async function countByCategory(categoryId) {
  const result = await db('courses')
    .where('category_id', categoryId)
    .count('id as count')
    .first();
  return Number(result?.count || 0);
}

export function getAllWithCategoryAndTeacher() {
  return db({ c: 'courses' })
    // categories: dùng category_id
    .leftJoin({ cat: 'categories' }, 'cat.id', 'c.category_id')
    // users: dùng instructor_id
    .leftJoin({ u: 'users' }, 'u.id', 'c.instructor_id')
    .select(
      'c.id',
      db.ref('c.title').as('course_title'),
      // 🔧 đổi name -> title cho bảng categories
      db.ref('cat.catname').as('category_name'),
      // 🔧 đổi name -> fullname cho bảng users (nếu bảng bạn dùng fullname)
      db.ref('u.name').as('instructor_name')
    );
}

export function deleteById(id) {
  return db('courses').where({ id }).del();
}

export default {
  findAll,
  findById,
  countByCategory,
  getAllWithCategoryAndTeacher,
  deleteById,
};
