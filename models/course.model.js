import db from '../utils/db.js';

export function findAll() {
  return db('courses')
}

export function findById(id) {
  return db('courses')
    .where('id', id)
    .first();
}

export async function countByCategory(categoryId) {
  const result = await db('courses')
    .where('categories_id', categoryId)
    .count('id as count')
    .first();
  return Number(result.count);
}
export default {
  getAllWithCategoryAndTeacher() {
    return db('courses')
      .select('courses.id', 'courses.name', 'categories.name as category_name', 
              'teachers.name as teacher_name', 'courses.isHidden')
      .leftJoin('categories', 'categories.id', 'courses.category_id')
      .leftJoin('teachers', 'teachers.id', 'courses.teacher_id');
  },

  updateStatus(id, hidden) {
    return db('courses').where('id', id).update({ isHidden: hidden });
  }
};


