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
 * 🏠 Trang chủ Admin Dashboard
 * -----------------------------*/
router.get('/', async (req, res) => {
  const stats = await adminModel.getDashboardStats?.() ?? {};
  const topCategories = await adminModel.getTopCategories?.() ?? [];
  const courseStatuses = await adminModel.getCourseStatuses?.() ?? [];

  res.render('vwAdmin/home', {
    layout: false, // Nếu bạn có layout riêng admin.hbs thì để true
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
  const users = await userModel.findAll?.() ?? [];
  res.render('vwAdmin/users', {
    layout: 'admin',
    users,
  });
});

router.post('/users/update', async (req, res) => {
  const { id, name, email, permission } = req.body;
  await userModel.patch(id, { name, email, permission });
  res.redirect('/admin/users');
});

router.post('/users/resetpwd', async (req, res) => {
  const { id, newPassword } = req.body;
  const hashed = bcrypt.hashSync(newPassword, 10);
  await userModel.patch(id, { password: hashed });
  res.redirect('/admin/users');
});

/** ------------------------------
 * 📚 Quản lý khóa học
 * -----------------------------*/
router.get('/courses', async (req, res) => {
  const courses = await courseModel.findAll?.() ?? [];
  res.render('vwAdmin/courses', {
    layout: 'admin',
    courses,
  });
});

/** ------------------------------
 * 🗂️ Quản lý danh mục (Category)
 * -----------------------------*/
router.get('/categories', async (req, res) => {
  const categories = await categoryModel.getAllWithCourseCount();
  res.render('vwAdminCategories/categories', {
    layout: 'admin',
    categories,
    user: req.session.authUser,
  });
});


// ➕ Thêm danh mục
router.post('/categories/add', async (req, res) => {
  const name = req.body.name?.trim();
  if (name) {
    await categoryModel.add({ name });
  }
  res.redirect('/admin/categories');
});

// ✏️ Sửa danh mục
router.post('/categories/edit', async (req, res) => {
  const { id, name } = req.body;
  if (id && name?.trim()) {
    await categoryModel.patch(id, { name: name.trim() });
  }
  res.redirect('/admin/categories');
});

// ❌ Xóa danh mục (chỉ khi không có khóa học)
router.post('/categories/delete', async (req, res) => {
  const id = Number(req.body.id);
  const count = await courseModel.countByCategory?.(id) ?? 0;

  if (count > 0) {
    return res.render('vwAdminCategories/categories', {
      layout: 'admin',
      categories: await categoryModel.getAllWithCourseCount?.() ?? [],
      user: req.session.authUser,
      error: `Không thể xóa danh mục ID ${id} – đang có ${count} khóa học.`,
    });
  }

  await categoryModel.remove(id);
  res.redirect('/admin/categories');
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

router.get('/course', async (req, res) => {
  const courses = await courseModel.getAllWithCategoryAndTeacher();
  res.render('vwAdminCourse/course', {
    layout: 'admin',
    courses
  });
});

// ✅ Ẩn khóa học
router.post('/course/hide/:id', async (req, res) => {
  const { id } = req.params;
  await courseModel.updateStatus(id, true);
  res.redirect('/admin/course');
});

// ✅ Hiện khóa học
router.post('/course/unhide/:id', async (req, res) => {
  const { id } = req.params;
  await courseModel.updateStatus(id, false);
  res.redirect('/admin/course');
});

// ✅ Xóa khóa học
router.post('/course/delete/:id', async (req, res) => {
  const { id } = req.params;
  await courseModel.deleteById(id);
  res.redirect('/admin/course');
});

export default router;
