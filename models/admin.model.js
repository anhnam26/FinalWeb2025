import db from '../utils/db.js';
export async function getDashboardStats() {
  const [totalCourses] = await db('courses').count('id as total');
  const totalStudents = await db('users').where('permission', '=', 1).count('id as total').first();
  const [totalInstructors] = await db('users').where('permission', 2).count('id as total');
  const [totalCategories] = await db('categories').count('id as total');

  return {
    totalCourses: totalCourses.total || 0,
    totalStudents: totalStudents.total || 0,
    totalInstructors: totalInstructors.total || 0,
    totalCategories: totalCategories.total || 0,
  };
}
export async function getTopCategories() {
  return [
    { name: 'Lập trình Web', count: 45 },
    { name: 'Kinh doanh', count: 30 },
    { name: 'Ngoại ngữ', count: 20 },
    { name: 'Thiết kế đồ hoạ', count: 15 },
    { name: 'Marketing', count: 10 }
  ];
}

export async function getCourseStatuses() {
  return {
    Published: 110,
    Draft: 35,
    Disabled: 5
  };
}

export default {
  findAll() {
    return db('users').select('id', 'fullname', 'email', 'isTeacher', 'isLocked');
  },

  findById(id) {
    return db('users').where('id', id).first();
  },

  add(user) {
    return db('users').insert(user);
  },

  updateRole(id, isTeacher) {
    return db('users').where('id', id).update({ isTeacher });
  },

  updateLock(id, isLocked) {
    return db('users').where('id', id).update({ isLocked });
  },

  deleteById(id) {
    return db('users').where('id', id).del();
  }
};

