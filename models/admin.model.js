export async function getDashboardStats() {
  return {
    totalCourses: 150,
    publishedCourses: 110,
    totalStudents: 1250,
    newStudentsThisMonth: 120,
    totalInstructors: 45,
    newInstructors: 3,
    totalCategories: 12,
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
