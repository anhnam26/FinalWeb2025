import db from '../utils/db.js';

export function add(user) {
  return db('users').insert(user);
}

export function findByName(name) {
  return db('users').where('name', name).first();
}

export function patch(id, user) {
  return db('users').where('id', id).update(user);
}



// Lấy tất cả người dùng (nếu cần)
export function findAll() {
  return db('users');
}

// 🔹 Lấy danh sách giáo viên (permission = 2)
export function findTeachers() {
  return db('users')
    .where('permission', 2)
    .select('id', 'name', 'email', 'dob', 'permission');
}

// 🔹 Lấy danh sách học sinh (permission = 1)
export function findStudents() {
  return db('users')
    .where('permission', 1)
    .select('id', 'name', 'email', 'dob', 'permission');
}

// 🔹 Cấp quyền giáo viên (chuyển permission = 2)
export function promoteToTeacher(id) {
  return db('users').where({ id }).update({ permission: 2 });
}

// 🔹 Xóa người dùng
export function deleteById(id) {
  return db('users').where({ id }).del();
}

