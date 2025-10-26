import express from 'express';
import bcrypt from 'bcryptjs';
import { restrict } from '../middlewares/auth.mdw.js';
import * as userModel from '../models/user.model.js';
import * as adminModel from '../models/admin.model.js';
import * as categoryModel from '../models/categories.model.js';
import * as courseModel from '../models/course.model.js';
import Handlebars from 'handlebars';

Handlebars.registerHelper('eq', (a, b) => a === b);

const router = express.Router();

/** 🔹 Kiểm tra quyền admin */
function ensureAdmin(req, res, next) {
  if (!req.session?.authUser || Number(req.session.authUser.permission) !== 3) {
    return res.status(403).send('Forbidden: Admins only.');
  }
  next();
}

router.use(restrict, ensureAdmin);

/** ------------------------------
 * 🏠 Dashboard
 * -----------------------------*/
router.get('/', async (req, res) => {
  const stats = await adminModel.getDashboardStats?.() ?? {};
  const topCategories = await adminModel.getTopCategories?.() ?? [];
  const courseStatuses = await adminModel.getCourseStatuses?.() ?? [];

  res.render('vwAdmin/home', {
    layout: false,
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    stats,
    topCategories,
    courseStatuses,
  });
});

/** ------------------------------
 * 👥 Quản lý người dùng
 * -----------------------------*/
router.get('/users', async (req, res) => {
  const teachers = await userModel.findTeachers();
  const students = await userModel.findStudents();

  res.render('vwAdmin/users', {
    layout: 'admin',
    teachers,
    students,
  });
});

/** ------------------------------
 * 🚀 Cấp quyền giáo viên
 * -----------------------------*/
router.post('/users/make-teacher/:id', async (req, res) => {
  const { id } = req.params;
  await userModel.promoteToTeacher(id);
  res.redirect('/admin/users');
});

/** ------------------------------
 * 🗑️ Xóa người dùng
 * -----------------------------*/
router.post('/users/delete/:id', async (req, res) => {
  const { id } = req.params;
  await userModel.deleteById(id);
  res.redirect('/admin/users');
});



/** ------------------------------
 * 📚 Quản lý khóa học (chỉ hiển thị danh sách)
 * -----------------------------*/
router.get('/courses', async (req, res) => {
  const courses = await courseModel.getAllWithCategoryAndTeacher();
  res.render('vwAdmin/courses', {
    layout: 'admin',
    courses,
  });
});

/** ------------------------------
 * 🗂️ Quản lý danh mục
 * -----------------------------*/
router.get('/categories', async (req, res) => {
  const categories = await categoryModel.getAllWithCourseCount();
  res.render('vwAdmin/categories', {
    layout: 'admin',
    categories,
    user: req.session.authUser,
  });
});

router.post('/categories/add', async (req, res) => {
  const name = req.body.name?.trim();
  if (name) await categoryModel.add({ name });
  res.redirect('/admin/categories');
});

router.post('/categories/edit', async (req, res) => {
  const { id, name } = req.body;
  if (id && name?.trim()) {
    await categoryModel.patch(id, { name: name.trim() });
  }
  res.redirect('/admin/categories');
});

// Xóa lĩnh vực
router.post('/categories/delete', async (req, res) => {
  try {
    const { id } = req.body;
    await categoryModel.remove(id);
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.render('admin/categories', {
      error: 'Lỗi khi xóa lĩnh vực',
    });
  }
});

/** ------------------------------
 * 👤 Trang hồ sơ admin
 * -----------------------------*/
router.get('/profile', (req, res) => {
  res.render('vwAdmin/profile', {
    layout: 'admin',
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    error: false,
    success: false,
  });
});

router.post('/profile', async (req, res) => {
  const id = req.body.id;
  const updatedUser = {
    name: req.body.name?.trim(),
    email: req.body.email?.trim(),
  };
  await userModel.patch(id, updatedUser);
  req.session.authUser.name = updatedUser.name;
  req.session.authUser.email = updatedUser.email;

  res.render('vwAdmin/profile', {
    layout: 'admin',
    user: req.session.authUser,
    isAuthenticated: true,
    error: false,
    success: 'Cập nhật thông tin thành công!',
  });
});

router.post('/change-pwd', async (req, res) => {
  const id = req.body.id;
  const currentPassword = req.body.currentPassword || '';
  const newPassword = req.body.newPassword || '';

  const ok = bcrypt.compareSync(currentPassword, req.session.authUser.password);
  if (!ok) {
    return res.render('vwAdmin/profile', {
      layout: 'admin',
      user: req.session.authUser,
      isAuthenticated: true,
      error: 'Mật khẩu hiện tại không đúng.',
      success: false,
    });
  }

  if (newPassword.length < 6) {
    return res.render('vwAdmin/profile', {
      layout: 'admin',
      user: req.session.authUser,
      isAuthenticated: true,
      error: 'Mật khẩu mới phải tối thiểu 6 ký tự.',
      success: false,
    });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  await userModel.patch(id, { password: hashed });
  req.session.authUser.password = hashed;

  res.render('vwAdmin/profile', {
    layout: 'admin',
    user: req.session.authUser,
    isAuthenticated: true,
    error: false,
    success: 'Đổi mật khẩu thành công!',
  });
});

/** ------------------------------
 * 🗑️ Xóa khóa học
 * -----------------------------*/
router.post('/courses/delete/:id', async (req, res) => {
  const { id } = req.params;
  await courseModel.deleteById(id);
  res.redirect('/admin/courses');
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await categoryModel.remove(id);
    res.json({ message: 'Xóa danh mục thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi xóa danh mục' });
  }
});

export default router;
